import type { PlacedOrder, ProductItem } from '../data/catalog';

export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthStatus {
  hasAdminAccount: boolean;
  hasEnvPasscode: boolean;
  needsAdminSetup: boolean;
}

export interface AdminProductItem extends ProductItem {
  stock: number;
  isActive: boolean;
  createdAt?: string;
}

export interface AdminCustomerItem extends AuthUser {
  orderCount: number;
  totalSpent: number;
}

export interface AdminMessageItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: 'New' | 'Replied' | 'Resolved';
  createdAt: string;
}

export interface SubscriberItem {
  id: string;
  email: string;
  createdAt: string;
}

export interface AdminOverviewData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    totalCustomers: number;
    totalAdmins: number;
    unreadMessages: number;
    totalSubscribers: number;
  };
  revenueTrend: { label: string; orders: number; revenue: number }[];
  categorySales: { name: string; revenue: number; units: number }[];
  topCities: { city: string; orders: number; revenue: number }[];
  recentOrders: PlacedOrder[];
  lowStockProducts: AdminProductItem[];
}

export interface ProductMutationPayload {
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

// Keep session token strictly in JS memory (never persisted to localStorage/sessionStorage)
let inMemoryAuthToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryAuthToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryAuthToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryAuthToken) {
    headers.set('Authorization', `Bearer ${inMemoryAuthToken}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  getAuthStatus(): Promise<AuthStatus> {
    return request<AuthStatus>('/api/auth/status');
  },

  adminSetup(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: AuthUser }> {
    return request('/api/auth/admin-setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminPasscodeLogin(passcode: string): Promise<{ token: string; user: AuthUser }> {
    return request('/api/auth/admin-passcode', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    });
  },

  signup(payload: {
    name: string;
    email: string;
    phone: string;
    city: string;
    password: string;
  }): Promise<{ token: string; user: AuthUser }> {
    return request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMe(): Promise<{ user: AuthUser }> {
    return request('/api/auth/me');
  },

  logout(): Promise<{ ok: boolean }> {
    return request('/api/auth/logout', { method: 'POST' });
  },

  updateProfile(payload: {
    name: string;
    phone: string;
    city: string;
    address: string;
  }): Promise<{ user: AuthUser }> {
    return request('/api/my/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getMyOrders(): Promise<{ orders: PlacedOrder[] }> {
    return request('/api/my/orders');
  },

  getProducts(): Promise<{ products: AdminProductItem[] }> {
    return request('/api/products');
  },

  createOrder(payload: {
    customerName: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
    paymentMethod: 'COD' | 'WhatsAppTransfer';
    items: {
      productId: string;
      title: string;
      size: string;
      quantity: number;
      price: number;
      image: string;
    }[];
  }): Promise<{ order: PlacedOrder }> {
    return request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  trackOrder(orderId: string): Promise<{ order: PlacedOrder }> {
    return request(`/api/orders/track/${encodeURIComponent(orderId)}`);
  },

  submitContact(payload: {
    name: string;
    phone: string;
    email?: string;
    message: string;
  }): Promise<{ message: AdminMessageItem }> {
    return request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  subscribeNewsletter(email: string): Promise<{ subscriber: SubscriberItem }> {
    return request('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  adminGetOverview(): Promise<AdminOverviewData> {
    return request('/api/admin/overview');
  },

  adminGetOrders(): Promise<{ orders: PlacedOrder[] }> {
    return request('/api/admin/orders');
  },

  adminUpdateOrderStatus(
    orderId: string,
    status: PlacedOrder['status']
  ): Promise<{ order: PlacedOrder }> {
    return request(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  adminDeleteOrder(orderId: string): Promise<{ ok: boolean }> {
    return request(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });
  },

  adminGetProducts(): Promise<{ products: AdminProductItem[] }> {
    return request('/api/admin/products');
  },

  adminCreateProduct(payload: ProductMutationPayload): Promise<{ product: AdminProductItem }> {
    return request('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminUpdateProduct(
    id: string,
    payload: ProductMutationPayload
  ): Promise<{ product: AdminProductItem }> {
    return request(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adminDeleteProduct(id: string): Promise<{ ok: boolean }> {
    return request(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  adminGetCustomers(): Promise<{ customers: AdminCustomerItem[] }> {
    return request('/api/admin/customers');
  },

  adminUpdateCustomerRole(
    id: string,
    role: UserRole
  ): Promise<{ customer: AdminCustomerItem }> {
    return request(`/api/admin/customers/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  adminGetMessages(): Promise<{ messages: AdminMessageItem[] }> {
    return request('/api/admin/messages');
  },

  adminUpdateMessageStatus(
    id: string,
    status: 'New' | 'Replied' | 'Resolved'
  ): Promise<{ message: AdminMessageItem }> {
    return request(`/api/admin/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  adminGetSubscribers(): Promise<{ subscribers: SubscriberItem[] }> {
    return request('/api/admin/subscribers');
  },
};
