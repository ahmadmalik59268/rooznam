import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ALL_PRODUCTS, CATEGORIES, formatPKR } from '../src/data/catalog.ts';
import type { PlacedOrder, ProductItem } from '../src/data/catalog.ts';
import { hashPassword, verifyPassword } from './auth.ts';
import type { UserRole } from './auth.ts';
import { storeDb } from './db.ts';
import type {
  AdminOrderRecord,
  AdminProduct,
  ContactMessageRecord,
  DbUser,
  SubscriberRecord,
} from './db.ts';

function getSupabaseEnv() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  ).trim();
  return { url, anonKey, serviceKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceKey } = getSupabaseEnv();
  return Boolean(url.startsWith('https://') && serviceKey.length > 20);
}

let catalogSeedAttempted = false;

async function ensureSupabaseCatalogSeeded(): Promise<void> {
  if (catalogSeedAttempted || !isSupabaseConfigured()) return;
  catalogSeedAttempted = true;
  try {
    const admin = getAdminClient();
    const catRows = CATEGORIES.map((c, idx) => ({
      id: c.id,
      title: c.title,
      count_label: c.countLabel,
      image: c.image,
      group_name: c.group,
      row_num: c.row,
      description: c.description,
      sort_order: idx + 1,
    }));
    await admin.from('categories').upsert(catRows, { onConflict: 'id', ignoreDuplicates: true });

    const prodRows = ALL_PRODUCTS.map((p, idx) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.image,
      back_image: p.backImage ?? null,
      category_id: p.categoryId,
      category_name: p.categoryName,
      section: p.section,
      fabric: p.fabric,
      fit: p.fit,
      color: p.color,
      description: p.description,
      sizes: p.sizes,
      badge: p.badge ?? null,
      stock: idx % 5 === 0 ? 6 : 18 + (idx % 4) * 7,
      is_active: true,
    }));
    await admin.from('products').upsert(prodRows, { onConflict: 'id', ignoreDuplicates: true });
  } catch {
    catalogSeedAttempted = false;
  }
}

let cachedAdminClient: SupabaseClient | null = null;
let cachedConfigSig = '';

function getAdminClient(): SupabaseClient {
  const { url, serviceKey } = getSupabaseEnv();
  const sig = `${url}|${serviceKey.slice(0, 8)}`;
  if (!cachedAdminClient || cachedConfigSig !== sig) {
    cachedAdminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    cachedConfigSig = sig;
  }
  return cachedAdminClient;
}

function createAnonAuthClient(): SupabaseClient {
  const { url, anonKey, serviceKey } = getSupabaseEnv();
  return createClient(url, anonKey || serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function formatDisplayDate(raw: unknown): string {
  const dt = raw ? new Date(String(raw)) : new Date();
  if (Number.isNaN(dt.getTime())) return String(raw ?? '');
  return dt.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapProfileRow(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? 'Lahore'),
    address: String(row.address ?? ''),
    role: row.role === 'admin' ? 'admin' : 'customer',
    createdAt: formatDisplayDate(row.created_at),
  };
}

function mapSupabaseProduct(row: Record<string, unknown>): AdminProduct {
  const price = Number(row.price ?? 0);
  const rawSizes = row.sizes;
  let sizes: string[] = ['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs'];
  if (Array.isArray(rawSizes) && rawSizes.length > 0) {
    sizes = rawSizes.map((s) => String(s));
  }
  const secVal = String(row.section ?? 'catalog');
  const section: ProductItem['section'] =
    secVal === 'new-arrivals' || secVal === 'branded-ready-to-wear' ? secVal : 'catalog';

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    price,
    priceFormatted: formatPKR(price),
    image: String(row.image ?? ''),
    backImage: row.back_image ? String(row.back_image) : undefined,
    categoryId: String(row.category_id ?? 'girls-eastern'),
    categoryName: String(row.category_name ?? 'Girls Eastern Wear'),
    section,
    fabric: String(row.fabric ?? 'Soft Cotton'),
    fit: String(row.fit ?? 'Regular Fit'),
    color: String(row.color ?? 'Assorted'),
    description: String(row.description ?? ''),
    sizes,
    badge: row.badge ? String(row.badge) : undefined,
    stock: Number(row.stock ?? 0),
    isActive: row.is_active !== false,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSupabaseOrder(row: Record<string, unknown>): AdminOrderRecord {
  const rawStatus = String(row.status ?? 'Confirmed');
  const validStatuses = ['Confirmed', 'Packing', 'Dispatched', 'Delivered', 'Cancelled'] as const;
  const status = validStatuses.includes(rawStatus as (typeof validStatuses)[number])
    ? (rawStatus as PlacedOrder['status'])
    : 'Confirmed';

  return {
    orderId: String(row.order_id),
    userId: row.user_id ? String(row.user_id) : null,
    createdAt: formatDisplayDate(row.created_at),
    customerName: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? ''),
    address: String(row.address ?? ''),
    notes: row.notes ? String(row.notes) : undefined,
    paymentMethod: row.payment_method === 'WhatsAppTransfer' ? 'WhatsAppTransfer' : 'COD',
    items: Array.isArray(row.items) ? (row.items as PlacedOrder['items']) : [],
    subtotal: Number(row.subtotal ?? 0),
    shippingFee: Number(row.shipping_fee ?? 0),
    total: Number(row.total ?? 0),
    status,
  };
}

export const dataStore = {
  backendName(): 'supabase' | 'sqlite' {
    return isSupabaseConfigured() ? 'supabase' : 'sqlite';
  },

  async countAdmins(): Promise<number> {
    if (!isSupabaseConfigured()) return storeDb.countAdmins();
    const { count, error } = await getAdminClient()
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async findUserById(id: string): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return storeDb.findUserById(id);
    const { data, error } = await getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data as Record<string, unknown>);
  },

  async registerCustomer(params: {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    password: string;
  }): Promise<{ user?: DbUser; error?: string; status?: number }> {
    const normalizedEmail = params.email.trim().toLowerCase();
    if (!isSupabaseConfigured()) {
      if (storeDb.findUserByEmail(normalizedEmail)) {
        return {
          error: 'An account with this email already exists. Please sign in.',
          status: 409,
        };
      }
      const { hash, salt } = hashPassword(params.password);
      const user = storeDb.createUser({
        name: params.name,
        email: normalizedEmail,
        phone: params.phone,
        city: params.city,
        role: 'customer',
        passwordHash: hash,
        passwordSalt: salt,
      });
      return { user };
    }

    const admin = getAdminClient();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        name: params.name,
        phone: params.phone ?? '',
        city: params.city ?? 'Lahore',
      },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message || 'Unable to create account.';
      const isDuplicate = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists');
      return {
        error: isDuplicate ? 'An account with this email already exists. Please sign in.' : msg,
        status: isDuplicate ? 409 : 400,
      };
    }

    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          name: params.name,
          email: normalizedEmail,
          phone: params.phone ?? '',
          city: params.city ?? 'Lahore',
          role: 'customer',
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (profErr || !profile) {
      return {
        user: {
          id: created.user.id,
          name: params.name,
          email: normalizedEmail,
          phone: params.phone ?? '',
          city: params.city ?? 'Lahore',
          address: '',
          role: 'customer',
          createdAt: formatDisplayDate(new Date()),
        },
      };
    }
    return { user: mapProfileRow(profile as Record<string, unknown>) };
  },

  async authenticateUser(email: string, password: string): Promise<DbUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured()) {
      const record = storeDb.findUserByEmail(normalizedEmail);
      if (!record || !verifyPassword(password, record.passwordSalt, record.passwordHash)) {
        return null;
      }
      const { passwordHash: _ph, passwordSalt: _ps, ...safeUser } = record;
      return safeUser;
    }

    const anon = createAnonAuthClient();
    const { data, error } = await anon.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error || !data.user) return null;

    const existing = await this.findUserById(data.user.id);
    if (existing) return existing;

    const fallbackName =
      typeof data.user.user_metadata?.name === 'string'
        ? data.user.user_metadata.name
        : normalizedEmail.split('@')[0];
    const { data: inserted } = await getAdminClient()
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          name: fallbackName,
          email: normalizedEmail,
          role: 'customer',
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    return inserted ? mapProfileRow(inserted as Record<string, unknown>) : null;
  },

  async claimInitialAdmin(params: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user?: DbUser; error?: string; status?: number }> {
    const normalizedEmail = params.email.trim().toLowerCase();
    if (!isSupabaseConfigured()) {
      const { hash, salt } = hashPassword(params.password);
      try {
        const admin = storeDb.claimInitialAdmin({
          name: params.name,
          email: normalizedEmail,
          passwordHash: hash,
          passwordSalt: salt,
        });
        if (!admin) {
          return {
            error: 'An admin account has already been claimed. Please sign in instead.',
            status: 409,
          };
        }
        return { user: admin };
      } catch (err) {
        if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
          return { error: 'This email is already registered.', status: 409 };
        }
        return { error: 'Unable to complete initial admin setup.', status: 500 };
      }
    }

    const adminCount = await this.countAdmins();
    if (adminCount > 0) {
      return {
        error: 'An admin account has already been claimed. Please sign in instead.',
        status: 409,
      };
    }

    const admin = getAdminClient();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: params.password,
      email_confirm: true,
      user_metadata: { name: params.name },
    });

    if (createErr || !created.user) {
      return {
        error: createErr?.message || 'This email is already registered.',
        status: 409,
      };
    }

    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          name: params.name,
          email: normalizedEmail,
          role: 'admin',
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (profErr || !profile) {
      return { error: 'Unable to save admin profile.', status: 500 };
    }
    return { user: mapProfileRow(profile as Record<string, unknown>) };
  },

  async updateUserProfile(
    userId: string,
    updates: { name: string; phone: string; city: string; address: string }
  ): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return storeDb.updateUserProfile(userId, updates);
    const { data, error } = await getAdminClient()
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        city: updates.city,
        address: updates.address,
      })
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data as Record<string, unknown>);
  },

  async updateUserRole(userId: string, role: UserRole): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return storeDb.updateUserRole(userId, role);
    const { data, error } = await getAdminClient()
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data as Record<string, unknown>);
  },

  async listUsersWithStats(): Promise<(DbUser & { orderCount: number; totalSpent: number })[]> {
    if (!isSupabaseConfigured()) return storeDb.listUsersWithStats();
    const admin = getAdminClient();
    const [{ data: profiles }, { data: orders }] = await Promise.all([
      admin.from('profiles').select('*').order('created_at', { ascending: false }),
      admin.from('orders').select('user_id, total, status'),
    ]);

    const stats = new Map<string, { orderCount: number; totalSpent: number }>();
    for (const o of (orders ?? []) as Record<string, unknown>[]) {
      const uid = o.user_id ? String(o.user_id) : '';
      if (!uid) continue;
      const cur = stats.get(uid) ?? { orderCount: 0, totalSpent: 0 };
      cur.orderCount += 1;
      if (o.status !== 'Cancelled') cur.totalSpent += Number(o.total ?? 0);
      stats.set(uid, cur);
    }

    return ((profiles ?? []) as Record<string, unknown>[]).map((row) => {
      const user = mapProfileRow(row);
      const st = stats.get(user.id) ?? { orderCount: 0, totalSpent: 0 };
      return { ...user, ...st };
    });
  },

  async listProducts(includeInactive = false): Promise<AdminProduct[]> {
    if (!isSupabaseConfigured()) return storeDb.listProducts(includeInactive);
    await ensureSupabaseCatalogSeeded();
    let query = getAdminClient().from('products').select('*');
    if (!includeInactive) {
      query = query.eq('is_active', true).order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(mapSupabaseProduct);
  },

  async getProductById(id: string): Promise<AdminProduct | null> {
    if (!isSupabaseConfigured()) return storeDb.getProductById(id);
    const { data, error } = await getAdminClient()
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapSupabaseProduct(data as Record<string, unknown>);
  },

  async createProduct(data: {
    title: string;
    price: number;
    image: string;
    backImage?: string;
    categoryId: string;
    section: ProductItem['section'];
    fabric: string;
    fit: string;
    color: string;
    description: string;
    sizes: string[];
    badge?: string;
    stock: number;
    isActive: boolean;
  }): Promise<AdminProduct> {
    if (!isSupabaseConfigured()) return storeDb.createProduct(data);
    const cat = CATEGORIES.find((c) => c.id === data.categoryId) ?? CATEGORIES[0];
    const id = `prd-${crypto.randomBytes(5).toString('hex')}`;
    const { data: inserted, error } = await getAdminClient()
      .from('products')
      .insert({
        id,
        title: data.title,
        price: data.price,
        image: data.image,
        back_image: data.backImage || null,
        category_id: cat.id,
        category_name: cat.title,
        section: data.section,
        fabric: data.fabric,
        fit: data.fit,
        color: data.color,
        description: data.description,
        sizes: data.sizes,
        badge: data.badge || null,
        stock: data.stock,
        is_active: data.isActive,
      })
      .select('*')
      .single();
    if (error || !inserted) throw new Error(error?.message || 'Failed to create product.');
    return mapSupabaseProduct(inserted as Record<string, unknown>);
  },

  async updateProduct(
    id: string,
    data: {
      title: string;
      price: number;
      image: string;
      backImage?: string;
      categoryId: string;
      section: ProductItem['section'];
      fabric: string;
      fit: string;
      color: string;
      description: string;
      sizes: string[];
      badge?: string;
      stock: number;
      isActive: boolean;
    }
  ): Promise<AdminProduct | null> {
    if (!isSupabaseConfigured()) return storeDb.updateProduct(id, data);
    const cat = CATEGORIES.find((c) => c.id === data.categoryId) ?? CATEGORIES[0];
    const { data: updated, error } = await getAdminClient()
      .from('products')
      .update({
        title: data.title,
        price: data.price,
        image: data.image,
        back_image: data.backImage || null,
        category_id: cat.id,
        category_name: cat.title,
        section: data.section,
        fabric: data.fabric,
        fit: data.fit,
        color: data.color,
        description: data.description,
        sizes: data.sizes,
        badge: data.badge || null,
        stock: data.stock,
        is_active: data.isActive,
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error || !updated) return null;
    return mapSupabaseProduct(updated as Record<string, unknown>);
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return storeDb.deleteProduct(id);
    const { data, error } = await getAdminClient()
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  },

  async createOrder(params: {
    userId?: string | null;
    customerName: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
    paymentMethod: 'COD' | 'WhatsAppTransfer';
    items: PlacedOrder['items'];
    subtotal: number;
    shippingFee: number;
    total: number;
  }): Promise<AdminOrderRecord> {
    if (!isSupabaseConfigured()) return storeDb.createOrder(params);
    const admin = getAdminClient();
    const orderId = `RZN-2026-${crypto.randomInt(1000, 9999)}`;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeUserId = params.userId && uuidRegex.test(params.userId) ? params.userId : null;

    const { data: inserted, error } = await admin
      .from('orders')
      .insert({
        order_id: orderId,
        user_id: safeUserId,
        customer_name: params.customerName,
        phone: params.phone,
        city: params.city,
        address: params.address,
        notes: params.notes || null,
        payment_method: params.paymentMethod,
        items: params.items,
        subtotal: params.subtotal,
        shipping_fee: params.shippingFee,
        total: params.total,
        status: 'Confirmed',
      })
      .select('*')
      .single();

    if (error || !inserted) throw new Error(error?.message || 'Failed to save order.');

    // Decrement stock cleanly for each ordered catalog product
    for (const item of params.items) {
      const prod = await this.getProductById(item.productId);
      if (prod) {
        const nextStock = Math.max(0, prod.stock - item.quantity);
        await admin.from('products').update({ stock: nextStock }).eq('id', item.productId);
      }
    }

    return mapSupabaseOrder(inserted as Record<string, unknown>);
  },

  async getOrderById(orderId: string): Promise<AdminOrderRecord | null> {
    const cleaned = orderId.trim();
    if (!/^[a-z0-9-]+$/i.test(cleaned)) return null;
    if (!isSupabaseConfigured()) return storeDb.getOrderById(cleaned);
    const { data, error } = await getAdminClient()
      .from('orders')
      .select('*')
      .ilike('order_id', cleaned)
      .maybeSingle();
    if (error || !data) return null;
    return mapSupabaseOrder(data as Record<string, unknown>);
  },

  async listOrdersByUser(userId: string): Promise<AdminOrderRecord[]> {
    if (!isSupabaseConfigured()) return storeDb.listOrdersByUser(userId);
    const { data, error } = await getAdminClient()
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return ((data ?? []) as Record<string, unknown>[]).map(mapSupabaseOrder);
  },

  async listAllOrders(): Promise<AdminOrderRecord[]> {
    if (!isSupabaseConfigured()) return storeDb.listAllOrders();
    const { data, error } = await getAdminClient()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(mapSupabaseOrder);
  },

  async updateOrderStatus(
    orderId: string,
    status: PlacedOrder['status']
  ): Promise<AdminOrderRecord | null> {
    if (!isSupabaseConfigured()) return storeDb.updateOrderStatus(orderId, status);
    const { data, error } = await getAdminClient()
      .from('orders')
      .update({ status })
      .eq('order_id', orderId)
      .select('*')
      .maybeSingle();
    if (error || !data) return null;
    return mapSupabaseOrder(data as Record<string, unknown>);
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return storeDb.deleteOrder(orderId);
    const { data, error } = await getAdminClient()
      .from('orders')
      .delete()
      .eq('order_id', orderId)
      .select('order_id');
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  },

  async createContactMessage(params: {
    name: string;
    phone: string;
    email?: string;
    message: string;
  }): Promise<ContactMessageRecord> {
    if (!isSupabaseConfigured()) return storeDb.createContactMessage(params);
    const { data, error } = await getAdminClient()
      .from('contact_messages')
      .insert({
        name: params.name,
        phone: params.phone,
        email: params.email ?? '',
        message: params.message,
        status: 'New',
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to save message.');
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      message: String(row.message),
      status: 'New',
      createdAt: formatDisplayDate(row.created_at),
    };
  },

  async listContactMessages(): Promise<ContactMessageRecord[]> {
    if (!isSupabaseConfigured()) return storeDb.listContactMessages();
    const { data, error } = await getAdminClient()
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      message: String(row.message),
      status: row.status === 'Replied' || row.status === 'Resolved' ? row.status : 'New',
      createdAt: formatDisplayDate(row.created_at),
    }));
  },

  async updateContactMessageStatus(
    id: string,
    status: 'New' | 'Replied' | 'Resolved'
  ): Promise<ContactMessageRecord | null> {
    if (!isSupabaseConfigured()) return storeDb.updateContactMessageStatus(id, status);
    const { data, error } = await getAdminClient()
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      message: String(row.message),
      status: row.status === 'Replied' || row.status === 'Resolved' ? row.status : 'New',
      createdAt: formatDisplayDate(row.created_at),
    };
  },

  async addSubscriber(email: string): Promise<SubscriberRecord> {
    if (!isSupabaseConfigured()) return storeDb.addSubscriber(email);
    const normalized = email.trim().toLowerCase();
    const admin = getAdminClient();
    const { data: existing } = await admin
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();
    if (existing) {
      const row = existing as Record<string, unknown>;
      return {
        id: String(row.id),
        email: String(row.email),
        createdAt: formatDisplayDate(row.created_at),
      };
    }
    const { data, error } = await admin
      .from('newsletter_subscribers')
      .insert({ email: normalized })
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to subscribe.');
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      email: String(row.email),
      createdAt: formatDisplayDate(row.created_at),
    };
  },

  async listSubscribers(): Promise<SubscriberRecord[]> {
    if (!isSupabaseConfigured()) return storeDb.listSubscribers();
    const { data, error } = await getAdminClient()
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      email: String(r.email),
      createdAt: formatDisplayDate(r.created_at),
    }));
  },

  async getAdminOverview() {
    if (!isSupabaseConfigured()) return storeDb.getAdminOverview();

    const admin = getAdminClient();
    const [ordersRes, products, users, messages, subscribers] = await Promise.all([
      admin.from('orders').select('*').order('created_at', { ascending: false }),
      this.listProducts(true),
      this.listUsersWithStats(),
      this.listContactMessages(),
      this.listSubscribers(),
    ]);

    const rawOrders = (ordersRes.data ?? []) as Record<string, unknown>[];
    const orders = rawOrders.map(mapSupabaseOrder);
    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(
      (o) => o.status === 'Confirmed' || o.status === 'Packing'
    ).length;
    const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
    const lowStockProducts = products.filter((p) => p.isActive && p.stock <= 8);
    const unreadMessages = messages.filter((m) => m.status === 'New').length;

    const categorySalesMap = new Map<string, { name: string; revenue: number; units: number }>();
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const order of activeOrders) {
      for (const item of order.items) {
        const prod = productMap.get(item.productId);
        const catName = prod?.categoryName ?? 'Customized Suits';
        const prev = categorySalesMap.get(catName) ?? { name: catName, revenue: 0, units: 0 };
        prev.revenue += item.price * item.quantity;
        prev.units += item.quantity;
        categorySalesMap.set(catName, prev);
      }
    }

    const cityMap = new Map<string, { city: string; orders: number; revenue: number }>();
    for (const order of activeOrders) {
      const prev = cityMap.get(order.city) ?? { city: order.city, orders: 0, revenue: 0 };
      prev.orders += 1;
      prev.revenue += order.total;
      cityMap.set(order.city, prev);
    }

    const dayLookup = new Map<string, { orders: number; revenue: number }>();
    for (const raw of rawOrders) {
      const isoDay = String(raw.created_at ?? '').slice(0, 10);
      if (!isoDay) continue;
      const cur = dayLookup.get(isoDay) ?? { orders: 0, revenue: 0 };
      cur.orders += 1;
      if (raw.status !== 'Cancelled') cur.revenue += Number(raw.total ?? 0);
      dayLookup.set(isoDay, cur);
    }

    const revenueTrend: { label: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400000);
      const isoKey = dt.toISOString().slice(0, 10);
      const hit = dayLookup.get(isoKey);
      revenueTrend.push({
        label: dt.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }),
        orders: hit ? hit.orders : 0,
        revenue: hit ? hit.revenue : 0,
      });
    }

    return {
      kpis: {
        totalRevenue,
        totalOrders: orders.length,
        pendingOrders,
        deliveredOrders,
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.isActive).length,
        lowStockCount: lowStockProducts.length,
        totalCustomers: users.filter((u) => u.role === 'customer').length,
        totalAdmins: users.filter((u) => u.role === 'admin').length,
        unreadMessages,
        totalSubscribers: subscribers.length,
      },
      revenueTrend,
      categorySales: Array.from(categorySalesMap.values()).sort((a, b) => b.revenue - a.revenue),
      topCities: Array.from(cityMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
      recentOrders: orders.slice(0, 6),
      lowStockProducts: lowStockProducts.slice(0, 6),
    };
  },
};
