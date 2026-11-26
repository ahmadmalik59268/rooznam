import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ALL_PRODUCTS, CATEGORIES, formatPKR } from '../src/data/catalog.ts';
import type { PlacedOrder, ProductItem } from '../src/data/catalog.ts';
import type { UserRole } from './auth.ts';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface DbUserWithSecret extends DbUser {
  passwordHash: string;
  passwordSalt: string;
}

export interface AdminProduct extends ProductItem {
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: 'New' | 'Replied' | 'Resolved';
  createdAt: string;
}

export interface SubscriberRecord {
  id: string;
  email: string;
  createdAt: string;
}

export interface AdminOrderRecord extends PlacedOrder {
  userId?: string | null;
}

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'rooznam.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT 'Lahore',
    address TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL CHECK(role IN ('customer', 'admin')),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL,
    back_image TEXT,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    section TEXT NOT NULL,
    fabric TEXT NOT NULL,
    fit TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT NOT NULL,
    sizes_json TEXT NOT NULL,
    badge TEXT,
    stock INTEGER NOT NULL DEFAULT 25,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at TEXT NOT NULL,
    created_iso TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    payment_method TEXT NOT NULL,
    items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Confirmed', 'Packing', 'Dispatched', 'Delivered', 'Cancelled'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Replied', 'Resolved')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Ensure existing SQLite databases gain back_image column cleanly
try {
  db.exec('ALTER TABLE products ADD COLUMN back_image TEXT');
} catch {
  // Column already exists
}

function seedInitialData(): void {
  const productCountRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as {
    count: number;
  };
  const nowIso = new Date().toISOString();
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (
      id, title, price, image, back_image, category_id, category_name, section,
      fabric, fit, color, description, sizes_json, badge, stock, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  if (productCountRow.count === 0) {
    ALL_PRODUCTS.forEach((p, idx) => {
      const initialStock = idx % 5 === 0 ? 6 : 18 + (idx % 4) * 7;
      insertProduct.run(
        p.id,
        p.title,
        p.price,
        p.image,
        p.backImage ?? null,
        p.categoryId,
        p.categoryName,
        p.section,
        p.fabric,
        p.fit,
        p.color,
        p.description,
        JSON.stringify(p.sizes),
        p.badge ?? null,
        initialStock,
        nowIso
      );
    });
  } else {
    // Sync newly refreshed unique local photography & matching back views onto default seeded IDs
    const syncSeededPhotos = db.prepare(`
      UPDATE products
      SET title = ?, section = ?, image = ?, back_image = ?, color = ?, description = ?
      WHERE id = ?
    `);
    ALL_PRODUCTS.forEach((p, idx) => {
      syncSeededPhotos.run(
        p.title,
        p.section,
        p.image,
        p.backImage ?? null,
        p.color,
        p.description,
        p.id
      );
      const initialStock = idx % 5 === 0 ? 6 : 18 + (idx % 4) * 7;
      insertProduct.run(
        p.id,
        p.title,
        p.price,
        p.image,
        p.backImage ?? null,
        p.categoryId,
        p.categoryName,
        p.section,
        p.fabric,
        p.fit,
        p.color,
        p.description,
        JSON.stringify(p.sizes),
        p.badge ?? null,
        initialStock,
        nowIso
      );
    });
    // Remove obsolete duplicate seeded IDs so no duplicate photo ever appears on the storefront
    db.prepare("DELETE FROM products WHERE id IN ('na-8', 'cat-ge-2')").run();
  }

  const orderCountRow = db.prepare('SELECT COUNT(*) as count FROM orders').get() as {
    count: number;
  };
  if (orderCountRow.count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_id, user_id, created_at, created_iso, customer_name, phone, city, address,
        notes, payment_method, items_json, subtotal, shipping_fee, total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const sampleOrders = [
      {
        orderId: 'RZN-2026-4812',
        offsetDays: 0,
        customerName: 'Ayesha Kamran',
        phone: '0300-4129871',
        city: 'Lahore',
        address: 'House 44-B, Block H, DHA Phase 5',
        notes: 'Please call before delivery',
        paymentMethod: 'COD',
        items: [
          {
            productId: ALL_PRODUCTS[0].id,
            title: ALL_PRODUCTS[0].title,
            size: '4-5 Yrs',
            quantity: 2,
            price: ALL_PRODUCTS[0].price,
            image: ALL_PRODUCTS[0].image,
          },
          {
            productId: ALL_PRODUCTS[3].id,
            title: ALL_PRODUCTS[3].title,
            size: '5-6 Yrs',
            quantity: 1,
            price: ALL_PRODUCTS[3].price,
            image: ALL_PRODUCTS[3].image,
          },
        ],
        subtotal: ALL_PRODUCTS[0].price * 2 + ALL_PRODUCTS[3].price,
        shippingFee: 0,
        status: 'Confirmed',
      },
      {
        orderId: 'RZN-2026-4795',
        offsetDays: 1,
        customerName: 'Hina Salman',
        phone: '0321-8834012',
        city: 'Karachi',
        address: 'Flat 702, Clifton Block 4',
        notes: 'Gift wrap for birthday',
        paymentMethod: 'WhatsAppTransfer',
        items: [
          {
            productId: ALL_PRODUCTS[12].id,
            title: ALL_PRODUCTS[12].title,
            size: '6-7 Yrs',
            quantity: 1,
            price: ALL_PRODUCTS[12].price,
            image: ALL_PRODUCTS[12].image,
          },
        ],
        subtotal: ALL_PRODUCTS[12].price,
        shippingFee: 0,
        status: 'Packing',
      },
      {
        orderId: 'RZN-2026-4761',
        offsetDays: 2,
        customerName: 'Usman Tariq',
        phone: '0333-5190428',
        city: 'Islamabad',
        address: 'Street 19, Sector F-10/2',
        notes: null,
        paymentMethod: 'COD',
        items: [
          {
            productId: ALL_PRODUCTS[15].id,
            title: ALL_PRODUCTS[15].title,
            size: '4-5 Yrs',
            quantity: 1,
            price: ALL_PRODUCTS[15].price,
            image: ALL_PRODUCTS[15].image,
          },
          {
            productId: ALL_PRODUCTS[5].id,
            title: ALL_PRODUCTS[5].title,
            size: '4-5 Yrs',
            quantity: 1,
            price: ALL_PRODUCTS[5].price,
            image: ALL_PRODUCTS[5].image,
          },
        ],
        subtotal: ALL_PRODUCTS[15].price + ALL_PRODUCTS[5].price,
        shippingFee: 0,
        status: 'Dispatched',
      },
      {
        orderId: 'RZN-2026-4703',
        offsetDays: 4,
        customerName: 'Sana Bilal',
        phone: '0345-7712304',
        city: 'Faisalabad',
        address: 'House 12, Peoples Colony No. 1',
        notes: null,
        paymentMethod: 'COD',
        items: [
          {
            productId: ALL_PRODUCTS[18].id,
            title: ALL_PRODUCTS[18].title,
            size: '5-6 Yrs',
            quantity: 1,
            price: ALL_PRODUCTS[18].price,
            image: ALL_PRODUCTS[18].image,
          },
        ],
        subtotal: ALL_PRODUCTS[18].price,
        shippingFee: 0,
        status: 'Delivered',
      },
    ];

    for (const o of sampleOrders) {
      const dt = new Date(now - o.offsetDays * dayMs);
      insertOrder.run(
        o.orderId,
        null,
        formatDisplayDate(dt),
        dt.toISOString(),
        o.customerName,
        o.phone,
        o.city,
        o.address,
        o.notes,
        o.paymentMethod,
        JSON.stringify(o.items),
        o.subtotal,
        o.shippingFee,
        o.subtotal + o.shippingFee,
        o.status
      );
    }
  }

  const msgCountRow = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get() as {
    count: number;
  };
  if (msgCountRow.count === 0) {
    const insertMsg = db.prepare(`
      INSERT INTO contact_messages (id, name, phone, email, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertMsg.run(
      'msg-1',
      'Zainab Farooq',
      '0301-9283741',
      'zainab@example.pk',
      'Assalam-o-Alaikum, can I get matching sibling customized suits in ages 3-4 and 6-7 before Eid?',
      'New',
      formatDisplayDate(new Date())
    );
    insertMsg.run(
      'msg-2',
      'Hamza Raza',
      '0322-4501129',
      '',
      'Do you offer 7-day size exchange for Edenrobe boys chinos in Rawalpindi?',
      'Replied',
      formatDisplayDate(new Date(Date.now() - 86400000))
    );
  }

  const subCountRow = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get() as {
    count: number;
  };
  if (subCountRow.count === 0) {
    const insertSub = db.prepare(`
      INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)
    `);
    ['fatima.ali@example.pk', 'mariam.khan@example.pk', 'omar.sheikh@example.pk'].forEach(
      (email, idx) => {
        insertSub.run(
          `sub-${idx + 1}`,
          email,
          formatDisplayDate(new Date(Date.now() - idx * 86400000))
        );
      }
    );
  }
}

seedInitialData();

function mapUserRow(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? 'Lahore'),
    address: String(row.address ?? ''),
    role: row.role === 'admin' ? 'admin' : 'customer',
    createdAt: String(row.created_at),
  };
}

function mapProductRow(row: Record<string, unknown>): AdminProduct {
  const price = Number(row.price);
  let sizes: string[] = ['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs'];
  try {
    const parsed = JSON.parse(String(row.sizes_json));
    if (Array.isArray(parsed) && parsed.length > 0) {
      sizes = parsed.map((s) => String(s));
    }
  } catch {
    // keep defaults
  }

  const sectionVal = String(row.section);
  const section: ProductItem['section'] =
    sectionVal === 'new-arrivals' || sectionVal === 'branded-ready-to-wear'
      ? sectionVal
      : 'catalog';

  return {
    id: String(row.id),
    title: String(row.title),
    price,
    priceFormatted: formatPKR(price),
    image: String(row.image),
    backImage: row.back_image ? String(row.back_image) : undefined,
    categoryId: String(row.category_id),
    categoryName: String(row.category_name),
    section,
    fabric: String(row.fabric),
    fit: String(row.fit),
    color: String(row.color),
    description: String(row.description),
    sizes,
    badge: row.badge ? String(row.badge) : undefined,
    stock: Number(row.stock ?? 0),
    isActive: Number(row.is_active ?? 1) === 1,
    createdAt: String(row.created_at),
  };
}

function mapOrderRow(row: Record<string, unknown>): AdminOrderRecord {
  let items: PlacedOrder['items'] = [];
  try {
    const parsed = JSON.parse(String(row.items_json));
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    items = [];
  }

  const rawStatus = String(row.status);
  const validStatuses = ['Confirmed', 'Packing', 'Dispatched', 'Delivered', 'Cancelled'] as const;
  const status = validStatuses.includes(rawStatus as (typeof validStatuses)[number])
    ? (rawStatus as PlacedOrder['status'])
    : 'Confirmed';

  return {
    orderId: String(row.order_id),
    userId: row.user_id ? String(row.user_id) : null,
    createdAt: String(row.created_at),
    customerName: String(row.customer_name),
    phone: String(row.phone),
    city: String(row.city),
    address: String(row.address),
    notes: row.notes ? String(row.notes) : undefined,
    paymentMethod: row.payment_method === 'WhatsAppTransfer' ? 'WhatsAppTransfer' : 'COD',
    items,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    status,
  };
}

export const storeDb = {
  countAdmins(): number {
    const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as {
      count: number;
    };
    return Number(row.count);
  },

  findUserByEmail(email: string): DbUserWithSecret | null {
    const row = db
      .prepare('SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1')
      .get(email.trim()) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      ...mapUserRow(row),
      passwordHash: String(row.password_hash),
      passwordSalt: String(row.password_salt),
    };
  },

  findUserById(id: string): DbUser | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return mapUserRow(row);
  },

  createUser(params: {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    address?: string;
    role: UserRole;
    passwordHash: string;
    passwordSalt: string;
  }): DbUser {
    const id = `usr-${crypto.randomBytes(6).toString('hex')}`;
    const createdAt = formatDisplayDate(new Date());
    db.prepare(
      `INSERT INTO users (id, name, email, phone, city, address, role, password_hash, password_salt, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      params.name,
      params.email.toLowerCase(),
      params.phone ?? '',
      params.city ?? 'Lahore',
      params.address ?? '',
      params.role,
      params.passwordHash,
      params.passwordSalt,
      createdAt
    );
    return {
      id,
      name: params.name,
      email: params.email.toLowerCase(),
      phone: params.phone ?? '',
      city: params.city ?? 'Lahore',
      address: params.address ?? '',
      role: params.role,
      createdAt,
    };
  },

  claimInitialAdmin(params: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
  }): DbUser | null {
    db.exec('BEGIN IMMEDIATE');
    try {
      const countRow = db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        .get() as { count: number };
      if (Number(countRow.count) > 0) {
        db.exec('ROLLBACK');
        return null;
      }

      const existing = db
        .prepare('SELECT id FROM users WHERE lower(email) = lower(?)')
        .get(params.email) as { id: string } | undefined;
      if (existing) {
        db.exec('ROLLBACK');
        throw new Error('EMAIL_EXISTS');
      }

      const id = `adm-${crypto.randomBytes(6).toString('hex')}`;
      const createdAt = formatDisplayDate(new Date());
      db.prepare(
        `INSERT INTO users (id, name, email, phone, city, address, role, password_hash, password_salt, created_at)
         VALUES (?, ?, ?, '', 'Lahore', '', 'admin', ?, ?, ?)`
      ).run(id, params.name, params.email.toLowerCase(), params.passwordHash, params.passwordSalt, createdAt);

      db.exec('COMMIT');
      return {
        id,
        name: params.name,
        email: params.email.toLowerCase(),
        phone: '',
        city: 'Lahore',
        address: '',
        role: 'admin',
        createdAt,
      };
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore rollback error
      }
      throw err;
    }
  },

  updateUserProfile(
    userId: string,
    updates: { name: string; phone: string; city: string; address: string }
  ): DbUser | null {
    db.prepare('UPDATE users SET name = ?, phone = ?, city = ?, address = ? WHERE id = ?').run(
      updates.name,
      updates.phone,
      updates.city,
      updates.address,
      userId
    );
    return this.findUserById(userId);
  },

  updateUserRole(userId: string, role: UserRole): DbUser | null {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    return this.findUserById(userId);
  },

  listUsersWithStats(): (DbUser & { orderCount: number; totalSpent: number })[] {
    const rows = db
      .prepare(
        `SELECT u.id, u.name, u.email, u.phone, u.city, u.address, u.role, u.created_at,
                COUNT(o.order_id) as order_count,
                COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total ELSE 0 END), 0) as total_spent
         FROM users u
         LEFT JOIN orders o ON o.user_id = u.id
         GROUP BY u.id
         ORDER BY u.rowid DESC`
      )
      .all() as Record<string, unknown>[];

    return rows.map((row) => ({
      ...mapUserRow(row),
      orderCount: Number(row.order_count ?? 0),
      totalSpent: Number(row.total_spent ?? 0),
    }));
  },

  listProducts(includeInactive = false): AdminProduct[] {
    const query = includeInactive
      ? 'SELECT * FROM products ORDER BY rowid DESC'
      : 'SELECT * FROM products WHERE is_active = 1 ORDER BY rowid ASC';
    const rows = db.prepare(query).all() as Record<string, unknown>[];
    return rows.map(mapProductRow);
  },

  getProductById(id: string): AdminProduct | null {
    const row = db.prepare('SELECT * FROM products WHERE id = ? LIMIT 1').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? mapProductRow(row) : null;
  },

  createProduct(data: {
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
  }): AdminProduct {
    const cat = CATEGORIES.find((c) => c.id === data.categoryId) ?? CATEGORIES[0];
    const id = `prd-${crypto.randomBytes(5).toString('hex')}`;
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO products (
        id, title, price, image, back_image, category_id, category_name, section,
        fabric, fit, color, description, sizes_json, badge, stock, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.title,
      data.price,
      data.image,
      data.backImage || null,
      cat.id,
      cat.title,
      data.section,
      data.fabric,
      data.fit,
      data.color,
      data.description,
      JSON.stringify(data.sizes),
      data.badge || null,
      data.stock,
      data.isActive ? 1 : 0,
      createdAt
    );
    return this.getProductById(id)!;
  },

  updateProduct(
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
  ): AdminProduct | null {
    const existing = this.getProductById(id);
    if (!existing) return null;
    const cat = CATEGORIES.find((c) => c.id === data.categoryId) ?? CATEGORIES[0];

    db.prepare(
      `UPDATE products
       SET title = ?, price = ?, image = ?, back_image = ?, category_id = ?, category_name = ?, section = ?,
           fabric = ?, fit = ?, color = ?, description = ?, sizes_json = ?, badge = ?,
           stock = ?, is_active = ?
       WHERE id = ?`
    ).run(
      data.title,
      data.price,
      data.image,
      data.backImage || null,
      cat.id,
      cat.title,
      data.section,
      data.fabric,
      data.fit,
      data.color,
      data.description,
      JSON.stringify(data.sizes),
      data.badge || null,
      data.stock,
      data.isActive ? 1 : 0,
      id
    );
    return this.getProductById(id);
  },

  deleteProduct(id: string): boolean {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  },

  createOrder(params: {
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
  }): AdminOrderRecord {
    const randomDigits = crypto.randomInt(1000, 9999);
    const orderId = `RZN-2026-${randomDigits}`;
    const now = new Date();
    const createdAt = formatDisplayDate(now);

    db.prepare(
      `INSERT INTO orders (
        order_id, user_id, created_at, created_iso, customer_name, phone, city, address,
        notes, payment_method, items_json, subtotal, shipping_fee, total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')`
    ).run(
      orderId,
      params.userId ?? null,
      createdAt,
      now.toISOString(),
      params.customerName,
      params.phone,
      params.city,
      params.address,
      params.notes ?? null,
      params.paymentMethod,
      JSON.stringify(params.items),
      params.subtotal,
      params.shippingFee,
      params.total
    );

    const decStock = db.prepare(
      'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?'
    );
    for (const item of params.items) {
      decStock.run(item.quantity, item.productId);
    }

    return this.getOrderById(orderId)!;
  },

  getOrderById(orderId: string): AdminOrderRecord | null {
    const row = db
      .prepare('SELECT * FROM orders WHERE lower(order_id) = lower(?) LIMIT 1')
      .get(orderId.trim()) as Record<string, unknown> | undefined;
    return row ? mapOrderRow(row) : null;
  },

  listOrdersByUser(userId: string): AdminOrderRecord[] {
    const rows = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_iso DESC')
      .all(userId) as Record<string, unknown>[];
    return rows.map(mapOrderRow);
  },

  listAllOrders(): AdminOrderRecord[] {
    const rows = db
      .prepare('SELECT * FROM orders ORDER BY created_iso DESC')
      .all() as Record<string, unknown>[];
    return rows.map(mapOrderRow);
  },

  updateOrderStatus(orderId: string, status: PlacedOrder['status']): AdminOrderRecord | null {
    db.prepare('UPDATE orders SET status = ? WHERE order_id = ?').run(status, orderId);
    return this.getOrderById(orderId);
  },

  deleteOrder(orderId: string): boolean {
    const result = db.prepare('DELETE FROM orders WHERE order_id = ?').run(orderId);
    return Number(result.changes) > 0;
  },

  createContactMessage(params: {
    name: string;
    phone: string;
    email?: string;
    message: string;
  }): ContactMessageRecord {
    const id = `msg-${crypto.randomBytes(5).toString('hex')}`;
    const createdAt = formatDisplayDate(new Date());
    db.prepare(
      `INSERT INTO contact_messages (id, name, phone, email, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'New', ?)`
    ).run(id, params.name, params.phone, params.email ?? '', params.message, createdAt);
    return {
      id,
      name: params.name,
      phone: params.phone,
      email: params.email ?? '',
      message: params.message,
      status: 'New',
      createdAt,
    };
  },

  listContactMessages(): ContactMessageRecord[] {
    const rows = db
      .prepare('SELECT * FROM contact_messages ORDER BY rowid DESC')
      .all() as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      message: String(row.message),
      status:
        row.status === 'Replied' || row.status === 'Resolved' ? row.status : 'New',
      createdAt: String(row.created_at),
    }));
  },

  updateContactMessageStatus(
    id: string,
    status: 'New' | 'Replied' | 'Resolved'
  ): ContactMessageRecord | null {
    db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
    const row = db.prepare('SELECT * FROM contact_messages WHERE id = ? LIMIT 1').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      message: String(row.message),
      status:
        row.status === 'Replied' || row.status === 'Resolved' ? row.status : 'New',
      createdAt: String(row.created_at),
    };
  },

  addSubscriber(email: string): SubscriberRecord {
    const normalized = email.trim().toLowerCase();
    const existing = db
      .prepare('SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1')
      .get(normalized) as Record<string, unknown> | undefined;
    if (existing) {
      return {
        id: String(existing.id),
        email: String(existing.email),
        createdAt: String(existing.created_at),
      };
    }
    const id = `sub-${crypto.randomBytes(5).toString('hex')}`;
    const createdAt = formatDisplayDate(new Date());
    db.prepare('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)').run(
      id,
      normalized,
      createdAt
    );
    return { id, email: normalized, createdAt };
  },

  listSubscribers(): SubscriberRecord[] {
    const rows = db
      .prepare('SELECT * FROM newsletter_subscribers ORDER BY rowid DESC')
      .all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      email: String(r.email),
      createdAt: String(r.created_at),
    }));
  },

  getAdminOverview() {
    const orders = this.listAllOrders();
    const products = this.listProducts(true);
    const users = this.listUsersWithStats();
    const messages = this.listContactMessages();
    const subscribers = this.listSubscribers();

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

    const rawDates = db
      .prepare(
        `SELECT substr(created_iso, 1, 10) as day, COUNT(*) as order_count,
                COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total ELSE 0 END), 0) as revenue
         FROM orders
         GROUP BY day
         ORDER BY day ASC`
      )
      .all() as { day: string; order_count: number; revenue: number }[];

    const dayLookup = new Map(rawDates.map((d) => [d.day, d]));
    const revenueTrend: { label: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400000);
      const isoKey = dt.toISOString().slice(0, 10);
      const hit = dayLookup.get(isoKey);
      revenueTrend.push({
        label: dt.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }),
        orders: hit ? Number(hit.order_count) : 0,
        revenue: hit ? Number(hit.revenue) : 0,
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
