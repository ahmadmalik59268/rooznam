import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Clock,
  Download,
  Edit3,
  Eye,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ALL_PRODUCTS,
  buildWhatsAppUrl,
  CATEGORIES,
  formatPKR,
  PlacedOrder,
  ProductItem,
} from '../data/catalog';
import {
  AdminCustomerItem,
  AdminMessageItem,
  AdminOverviewData,
  AdminProductItem,
  api,
  AuthUser,
  ProductMutationPayload,
  SubscriberItem,
} from '../lib/api';
import { RooznamLogo, WhatsAppIcon } from './Icons';
import { SmartImage } from './SmartImage';

type AdminSection = 'overview' | 'orders' | 'products' | 'customers' | 'inbox';

interface AdminDashboardProps {
  currentUser: AuthUser;
  onExitToStore: () => void;
  onLogout: () => void;
  onCatalogMutated: () => void;
  onNotify: (msg: string) => void;
}

const ORDER_STATUSES: PlacedOrder['status'][] = [
  'Confirmed',
  'Packing',
  'Dispatched',
  'Delivered',
  'Cancelled',
];

const AGE_SIZE_OPTIONS = ['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs'];

const IMAGE_PRESETS = ALL_PRODUCTS.slice(0, 8).map((p) => ({
  label: p.title.split('|')[0].trim(),
  url: p.image,
}));

function statusPillClasses(status: PlacedOrder['status']): string {
  switch (status) {
    case 'Confirmed':
      return 'bg-purple-50 text-[#520d75] border-purple-200';
    case 'Packing':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Dispatched':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Cancelled':
      return 'bg-red-50 text-red-700 border-red-200';
  }
}

export function AdminDashboard({
  currentUser,
  onExitToStore,
  onLogout,
  onCatalogMutated,
  onNotify,
}: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [messages, setMessages] = useState<AdminMessageItem[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);

  // Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | PlacedOrder['status']>('All');
  const [selectedOrder, setSelectedOrder] = useState<PlacedOrder | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [customerSearch, setCustomerSearch] = useState('');

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [ov, ordRes, prodRes, custRes, msgRes, subRes] = await Promise.all([
        api.adminGetOverview(),
        api.adminGetOrders(),
        api.adminGetProducts(),
        api.adminGetCustomers(),
        api.adminGetMessages(),
        api.adminGetSubscribers(),
      ]);
      setOverview(ov);
      setOrders(ordRes.orders);
      setProducts(prodRes.products);
      setCustomers(custRes.customers);
      setMessages(msgRes.messages);
      setSubscribers(subRes.subscribers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  const handleOrderStatusChange = async (orderId: string, status: PlacedOrder['status']) => {
    try {
      const { order } = await api.adminUpdateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? order : o)));
      setSelectedOrder((prev) => (prev?.orderId === orderId ? order : prev));
      onNotify(`Order ${orderId} updated to ${status}`);
      api.adminGetOverview().then(setOverview).catch(() => {});
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.adminDeleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      setSelectedOrder((prev) => (prev?.orderId === orderId ? null : prev));
      onNotify(`Order ${orderId} removed`);
      api.adminGetOverview().then(setOverview).catch(() => {});
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  const handleSaveProduct = async (payload: ProductMutationPayload, existingId?: string) => {
    if (existingId) {
      const { product } = await api.adminUpdateProduct(existingId, payload);
      setProducts((prev) => prev.map((p) => (p.id === existingId ? product : p)));
      onNotify(`Updated "${product.title.split('|')[0].trim()}"`);
    } else {
      const { product } = await api.adminCreateProduct(payload);
      setProducts((prev) => [product, ...prev]);
      onNotify(`Added "${product.title.split('|')[0].trim()}" to store`);
    }
    setProductModalOpen(false);
    setEditingProduct(null);
    onCatalogMutated();
    api.adminGetOverview().then(setOverview).catch(() => {});
  };

  const handleDeleteProduct = async (product: AdminProductItem) => {
    try {
      await api.adminDeleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      onCatalogMutated();
      onNotify(`Deleted "${product.title.split('|')[0].trim()}"`);
      api.adminGetOverview().then(setOverview).catch(() => {});
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleToggleRole = async (cust: AdminCustomerItem) => {
    const nextRole = cust.role === 'admin' ? 'customer' : 'admin';
    try {
      const { customer } = await api.adminUpdateCustomerRole(cust.id, nextRole);
      setCustomers((prev) =>
        prev.map((c) => (c.id === cust.id ? { ...c, role: customer.role } : c))
      );
      onNotify(`${cust.name} is now ${nextRole === 'admin' ? 'an Admin' : 'a Customer'}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to update role');
    }
  };

  const handleUpdateMessageStatus = async (
    id: string,
    status: 'New' | 'Replied' | 'Resolved'
  ) => {
    try {
      const { message } = await api.adminUpdateMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => (m.id === id ? message : m)));
      onNotify(`Message marked as ${status}`);
      api.adminGetOverview().then(setOverview).catch(() => {});
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update message');
    }
  };

  const handleExportSubscribers = () => {
    const rows = ['Email,Subscribed Date', ...subscribers.map((s) => `${s.email},${s.createdAt}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rooznam-subscribers.csv';
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported newsletter subscribers CSV');
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productCategoryFilter !== 'all' && p.categoryId !== productCategoryFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q)
      );
    });
  }, [products, productSearch, productCategoryFilter]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: overview?.kpis.pendingOrders || undefined,
    },
    { id: 'products', label: 'Products & Stock', icon: Package },
    { id: 'customers', label: 'Customers & Roles', icon: Users },
    {
      id: 'inbox',
      label: 'Messages & Family',
      icon: MessageSquare,
      badge: overview?.kpis.unreadMessages || undefined,
    },
  ];

  const maxTrendRevenue = Math.max(
    1,
    ...(overview?.revenueTrend.map((d) => d.revenue) ?? [1])
  );

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5 border-b border-white/10">
        <div className="bg-white rounded-2xl px-3.5 py-2 inline-block shadow-sm">
          <RooznamLogo size="sm" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-pink-300 mt-3">
          Store Admin Panel
        </p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-white text-[#38035e] shadow-md'
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                    active ? 'bg-[#d91b7e] text-white' : 'bg-[#d91b7e] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          type="button"
          onClick={onExitToStore}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Store className="w-4 h-4" />
          <span>View Live Storefront</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/15 hover:bg-red-500/20 text-purple-100 hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f3fa] flex text-left">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#38035e] text-white sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="relative w-64 bg-[#38035e] text-white h-full shadow-2xl"
            >
              {renderSidebarContent()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Admin Bar */}
        <header className="bg-white border-b border-purple-100 sticky top-0 z-30">
          <div className="px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open admin menu"
                className="lg:hidden p-2 rounded-lg text-[#38035e] hover:bg-[#faf5fd] cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-[#38035e] leading-tight">
                  {navItems.find((n) => n.id === section)?.label}
                </h1>
                <p className="text-[11px] text-gray-500 hidden sm:block">
                  Rooznam Kidswear · Live Store Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => loadAllData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-100 bg-white hover:bg-[#faf5fd] text-xs font-bold text-[#38035e] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={onExitToStore}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#faf5fd] hover:bg-purple-100/70 text-xs font-bold text-[#520d75] cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Storefront</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#38035e] text-white flex items-center justify-center text-xs font-extrabold">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden md:block leading-tight">
                  <p className="text-xs font-bold text-gray-800">{currentUser.name}</p>
                  <p className="text-[10px] font-semibold text-[#d91b7e] uppercase">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => loadAllData(true)}
                className="underline font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-3xl bg-white border border-purple-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* ============================================================
                  SECTION 1: OVERVIEW & ANALYTICS
                 ============================================================ */}
              {section === 'overview' && overview && (
                <div className="space-y-6">
                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Total Revenue</span>
                        <span className="w-9 h-9 rounded-2xl bg-purple-50 text-[#520d75] flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-[#38035e] mt-3 tabular-nums">
                        {formatPKR(overview.kpis.totalRevenue)}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        {overview.kpis.deliveredOrders} delivered orders
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Total Orders</span>
                        <span className="w-9 h-9 rounded-2xl bg-pink-50 text-[#d91b7e] flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-[#38035e] mt-3 tabular-nums">
                        {overview.kpis.totalOrders}
                      </p>
                      <p className="text-[11px] text-amber-700 font-semibold mt-1">
                        {overview.kpis.pendingOrders} awaiting dispatch
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Catalog Products</span>
                        <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-[#38035e] mt-3 tabular-nums">
                        {overview.kpis.activeProducts}
                        <span className="text-sm font-semibold text-gray-400">
                          {' '}
                          / {overview.kpis.totalProducts}
                        </span>
                      </p>
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        {overview.kpis.lowStockCount} low stock alerts
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Rooznam Family</span>
                        <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-[#38035e] mt-3 tabular-nums">
                        {overview.kpis.totalCustomers}
                      </p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-1">
                        {overview.kpis.totalSubscribers} newsletter · {overview.kpis.unreadMessages}{' '}
                        new msgs
                      </p>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 7-Day Revenue Bar Chart */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-base font-extrabold text-[#38035e] flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[#d91b7e]" />
                            <span>7-Day Sales Performance</span>
                          </h2>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Daily revenue across Pakistan COD &amp; transfer orders
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#520d75] bg-[#faf5fd] px-3 py-1 rounded-full">
                          Last 7 Days
                        </span>
                      </div>

                      <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-48 pt-4">
                        {overview.revenueTrend.map((point) => {
                          const heightPct =
                            point.revenue > 0
                              ? Math.max(14, Math.round((point.revenue / maxTrendRevenue) * 100))
                              : 6;
                          return (
                            <div
                              key={point.label}
                              className="flex flex-col items-center justify-end h-full gap-2 group"
                            >
                              <div className="text-[10px] font-bold text-[#38035e] opacity-80 tabular-nums text-center">
                                {point.revenue > 0
                                  ? `${Math.round(point.revenue / 100) / 10}k`
                                  : '0'}
                              </div>
                              <div className="w-full flex-1 flex items-end justify-center">
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full max-w-[38px] rounded-t-xl transition-all duration-300 ${
                                    point.revenue > 0
                                      ? 'bg-gradient-to-t from-[#38035e] via-[#6d169c] to-[#d91b7e] group-hover:opacity-90'
                                      : 'bg-purple-100/70'
                                  }`}
                                  title={`${point.label}: ${formatPKR(point.revenue)} (${point.orders} orders)`}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                                {point.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Cities & Categories */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs space-y-5">
                      <div>
                        <h2 className="text-base font-extrabold text-[#38035e]">
                          Top Performing Categories
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Revenue breakdown by kidswear collection
                        </p>
                      </div>

                      <div className="space-y-3.5">
                        {overview.categorySales.length === 0 ? (
                          <p className="text-xs text-gray-400">No sales recorded yet.</p>
                        ) : (
                          overview.categorySales.slice(0, 5).map((cat) => {
                            const pct =
                              overview.kpis.totalRevenue > 0
                                ? Math.min(
                                    100,
                                    Math.round((cat.revenue / overview.kpis.totalRevenue) * 100)
                                  )
                                : 0;
                            return (
                              <div key={cat.name} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-gray-700 truncate pr-2">
                                    {cat.name}
                                  </span>
                                  <span className="font-extrabold text-[#38035e] tabular-nums shrink-0">
                                    {formatPKR(cat.revenue)} · {cat.units} pcs
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-purple-50 overflow-hidden">
                                  <div
                                    style={{ width: `${Math.max(8, pct)}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#520d75] to-[#d91b7e]"
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {overview.topCities.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">
                            Top Delivery Cities
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {overview.topCities.map((c) => (
                              <span
                                key={c.city}
                                className="px-3 py-1.5 rounded-xl bg-[#faf5fd] border border-purple-100 text-xs font-bold text-[#38035e]"
                              >
                                {c.city}{' '}
                                <span className="text-[#d91b7e] tabular-nums">({c.orders})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Recent Orders + Low Stock */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 bg-white rounded-3xl border border-purple-100/80 shadow-xs overflow-hidden">
                      <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100">
                        <div>
                          <h2 className="text-base font-extrabold text-[#38035e]">Recent Orders</h2>
                          <p className="text-xs text-gray-500">
                            Update order statuses directly — reflects live on Track Order
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSection('orders')}
                          className="text-xs font-bold text-[#d91b7e] hover:underline cursor-pointer"
                        >
                          Manage all →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-[#faf8fc] text-gray-500 uppercase text-[10px]">
                            <tr>
                              <th className="py-3 px-4 font-bold">Order ID</th>
                              <th className="py-3 px-4 font-bold">Customer</th>
                              <th className="py-3 px-4 font-bold">City</th>
                              <th className="py-3 px-4 font-bold">Total</th>
                              <th className="py-3 px-4 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {overview.recentOrders.map((ord) => (
                              <tr key={ord.orderId} className="hover:bg-[#faf8fc]/70">
                                <td className="py-3.5 px-4 font-extrabold text-[#38035e]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(ord)}
                                    className="hover:underline cursor-pointer"
                                  >
                                    {ord.orderId}
                                  </button>
                                </td>
                                <td className="py-3.5 px-4">
                                  <p className="font-bold text-gray-800">{ord.customerName}</p>
                                  <p className="text-[11px] text-gray-400">{ord.createdAt}</p>
                                </td>
                                <td className="py-3.5 px-4 text-gray-600">{ord.city}</td>
                                <td className="py-3.5 px-4 font-extrabold text-[#520d75] tabular-nums">
                                  {formatPKR(ord.total)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <select
                                    value={ord.status}
                                    onChange={(e) =>
                                      handleOrderStatusChange(
                                        ord.orderId,
                                        e.target.value as PlacedOrder['status']
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${statusPillClasses(
                                      ord.status
                                    )}`}
                                  >
                                    {ORDER_STATUSES.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-[#38035e] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Low Stock Alerts</span>
                        </h2>
                        <button
                          type="button"
                          onClick={() => setSection('products')}
                          className="text-xs font-bold text-[#520d75] hover:underline cursor-pointer"
                        >
                          Inventory
                        </button>
                      </div>

                      {overview.lowStockProducts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-500">
                          All active outfits have healthy inventory!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {overview.lowStockProducts.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#faf8fc] border border-purple-100/60"
                            >
                              <div className="w-11 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                                <SmartImage
                                  src={p.image}
                                  alt={p.title}
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 line-clamp-1">
                                  {p.title}
                                </p>
                                <p className="text-[11px] text-rose-600 font-bold mt-0.5">
                                  Only {p.stock} left in stock
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProductModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-[11px] font-bold text-[#38035e] hover:bg-[#38035e] hover:text-white transition-colors cursor-pointer"
                              >
                                Restock
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  SECTION 2: ORDERS MANAGEMENT
                 ============================================================ */}
              {section === 'orders' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by Order ID, customer name, phone, or city..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#55157e]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['All', ...ORDER_STATUSES] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            orderStatusFilter === st
                              ? 'bg-[#38035e] text-white'
                              : 'bg-[#faf5fd] text-gray-700 hover:bg-purple-100/70'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-purple-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-[#faf8fc] text-gray-500 uppercase text-[10px]">
                          <tr>
                            <th className="py-3.5 px-4 font-bold">Order ID</th>
                            <th className="py-3.5 px-4 font-bold">Customer &amp; Phone</th>
                            <th className="py-3.5 px-4 font-bold">City &amp; Payment</th>
                            <th className="py-3.5 px-4 font-bold">Items</th>
                            <th className="py-3.5 px-4 font-bold">Total</th>
                            <th className="py-3.5 px-4 font-bold">Status</th>
                            <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-500">
                                No orders match your search criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((ord) => (
                              <tr key={ord.orderId} className="hover:bg-[#faf8fc]/70">
                                <td className="py-3.5 px-4">
                                  <p className="font-extrabold text-[#38035e]">{ord.orderId}</p>
                                  <p className="text-[11px] text-gray-400">{ord.createdAt}</p>
                                </td>
                                <td className="py-3.5 px-4">
                                  <p className="font-bold text-gray-800">{ord.customerName}</p>
                                  <p className="text-[11px] text-gray-500 tabular-nums">
                                    {ord.phone}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4">
                                  <p className="font-semibold text-gray-700">{ord.city}</p>
                                  <p className="text-[11px] text-gray-400">
                                    {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Transfer'}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4 text-gray-600 tabular-nums">
                                  {ord.items.reduce((s, i) => s + i.quantity, 0)} outfit(s)
                                </td>
                                <td className="py-3.5 px-4 font-extrabold text-[#520d75] tabular-nums">
                                  {formatPKR(ord.total)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <select
                                    value={ord.status}
                                    onChange={(e) =>
                                      handleOrderStatusChange(
                                        ord.orderId,
                                        e.target.value as PlacedOrder['status']
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${statusPillClasses(
                                      ord.status
                                    )}`}
                                  >
                                    {ORDER_STATUSES.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrder(ord)}
                                      className="p-2 rounded-lg text-[#520d75] hover:bg-purple-50 cursor-pointer"
                                      title="View order details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOrder(ord.orderId)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                      title="Delete order"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  SECTION 3: PRODUCTS & INVENTORY CRUD
                 ============================================================ */}
              {section === 'products' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search outfits, fabrics, colours..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#55157e]"
                        />
                      </div>
                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white font-semibold text-gray-700 focus:outline-none focus:border-[#55157e]"
                      >
                        <option value="all">All Categories ({products.length})</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#d91b7e] hover:bg-[#be166d] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Outfit</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-purple-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-[#faf8fc] text-gray-500 uppercase text-[10px]">
                          <tr>
                            <th className="py-3.5 px-4 font-bold">Product</th>
                            <th className="py-3.5 px-4 font-bold">Category</th>
                            <th className="py-3.5 px-4 font-bold">Section</th>
                            <th className="py-3.5 px-4 font-bold">Price</th>
                            <th className="py-3.5 px-4 font-bold">Stock</th>
                            <th className="py-3.5 px-4 font-bold">Visibility</th>
                            <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-[#faf8fc]/70">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3 min-w-[240px]">
                                  <div className="w-12 h-15 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-purple-50">
                                    <SmartImage
                                      src={p.image}
                                      alt={p.title}
                                      className="w-full h-full object-cover object-top"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-gray-800 line-clamp-1">
                                      {p.title}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      {p.fabric} · {p.color}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-700">
                                {p.categoryName}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2.5 py-1 rounded-full bg-[#faf5fd] text-[#520d75] text-[10px] font-bold">
                                  {p.section === 'new-arrivals'
                                    ? 'New Arrivals'
                                    : p.section === 'branded-ready-to-wear'
                                      ? 'Branded RTW'
                                      : 'Catalog'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-extrabold text-[#38035e] tabular-nums">
                                {formatPKR(p.price)}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums ${
                                    p.stock === 0
                                      ? 'bg-red-50 text-red-700'
                                      : p.stock <= 8
                                        ? 'bg-amber-50 text-amber-800'
                                        : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {p.stock} pcs
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-[11px] font-bold ${
                                    p.isActive ? 'text-emerald-600' : 'text-gray-400'
                                  }`}
                                >
                                  {p.isActive ? 'Live' : 'Hidden'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setProductModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-[#520d75] hover:bg-purple-50 cursor-pointer"
                                    title="Edit product"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  SECTION 4: CUSTOMERS & ROLES
                 ============================================================ */}
              {section === 'customers' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search registered users by name, email, city..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#55157e]"
                      />
                    </div>
                    <p className="text-xs font-bold text-gray-500">
                      Total Accounts:{' '}
                      <span className="text-[#38035e]">{customers.length}</span>
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-purple-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-[#faf8fc] text-gray-500 uppercase text-[10px]">
                          <tr>
                            <th className="py-3.5 px-4 font-bold">Member</th>
                            <th className="py-3.5 px-4 font-bold">Contact &amp; City</th>
                            <th className="py-3.5 px-4 font-bold">Role</th>
                            <th className="py-3.5 px-4 font-bold">Orders</th>
                            <th className="py-3.5 px-4 font-bold">Total Spent</th>
                            <th className="py-3.5 px-4 font-bold text-right">Access Control</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredCustomers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-gray-500">
                                No registered accounts found yet.
                              </td>
                            </tr>
                          ) : (
                            filteredCustomers.map((c) => (
                              <tr key={c.id} className="hover:bg-[#faf8fc]/70">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#faf5fd] text-[#520d75] font-extrabold flex items-center justify-center shrink-0">
                                      {c.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-800">{c.name}</p>
                                      <p className="text-[11px] text-gray-400">{c.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <p className="font-semibold text-gray-700">{c.city}</p>
                                  <p className="text-[11px] text-gray-400 tabular-nums">
                                    {c.phone || 'No phone saved'}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      c.role === 'admin'
                                        ? 'bg-[#38035e] text-white'
                                        : 'bg-purple-50 text-[#520d75]'
                                    }`}
                                  >
                                    {c.role === 'admin' && <Shield className="w-3 h-3" />}
                                    <span>{c.role === 'admin' ? 'Admin' : 'Customer'}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-gray-700 tabular-nums">
                                  {c.orderCount}
                                </td>
                                <td className="py-3.5 px-4 font-extrabold text-[#520d75] tabular-nums">
                                  {formatPKR(c.totalSpent)}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRole(c)}
                                    className="px-3 py-1.5 rounded-xl border border-purple-200 hover:bg-[#38035e] hover:text-white text-[11px] font-bold text-[#38035e] transition-colors cursor-pointer"
                                  >
                                    {c.role === 'admin' ? 'Set Customer' : 'Promote to Admin'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  SECTION 5: MESSAGES & NEWSLETTER SUBSCRIBERS
                 ============================================================ */}
              {section === 'inbox' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Messages */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-extrabold text-[#38035e]">
                        Customer Support Inquiries ({messages.length})
                      </h2>
                    </div>

                    {messages.length === 0 ? (
                      <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 text-xs text-gray-500">
                        No contact messages yet.
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100/80 shadow-xs space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-extrabold text-[#38035e]">{msg.name}</p>
                              <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{msg.createdAt}</span>
                                {msg.phone && <span>· {msg.phone}</span>}
                                {msg.email && <span>· {msg.email}</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(['New', 'Replied', 'Resolved'] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateMessageStatus(msg.id, st)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors ${
                                    msg.status === st
                                      ? st === 'New'
                                        ? 'bg-[#d91b7e] text-white border-[#d91b7e]'
                                        : st === 'Replied'
                                          ? 'bg-sky-600 text-white border-sky-600'
                                          : 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#55157e]'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-[#faf8fc] p-4 rounded-2xl border border-purple-50">
                            {msg.message}
                          </p>

                          {msg.phone && (
                            <div className="pt-1">
                              <a
                                href={buildWhatsAppUrl(
                                  `Assalam-o-Alaikum ${msg.name}! Regarding your message on Rooznam: `
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1faf59] hover:underline"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span>Reply on WhatsApp</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Newsletter Subscribers */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-extrabold text-[#38035e]">
                        Newsletter ({subscribers.length})
                      </h2>
                      <button
                        type="button"
                        onClick={handleExportSubscribers}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-[11px] font-bold text-[#38035e] hover:bg-[#38035e] hover:text-white transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-purple-100/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
                      {subscribers.length === 0 ? (
                        <p className="p-8 text-center text-xs text-gray-400">
                          No subscribers yet.
                        </p>
                      ) : (
                        subscribers.map((sub) => (
                          <div
                            key={sub.id}
                            className="px-5 py-3.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-semibold text-gray-800 truncate flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[#d91b7e] shrink-0" />
                              <span className="truncate">{sub.email}</span>
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {sub.createdAt}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ====================================================================
          ORDER DETAIL MODAL
         ==================================================================== */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-[#2d024d]/45 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                    Order Details
                  </p>
                  <h3 className="text-xl font-extrabold text-[#38035e]">
                    {selectedOrder.orderId}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Placed {selectedOrder.createdAt} ·{' '}
                    {selectedOrder.paymentMethod === 'COD'
                      ? 'Cash on Delivery'
                      : 'Bank / Mobile Transfer'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full text-gray-400 hover:bg-purple-50 hover:text-[#38035e] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#faf8fc] p-4 rounded-2xl border border-purple-100 text-xs">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Customer</p>
                  <p className="font-bold text-gray-800 mt-0.5">{selectedOrder.customerName}</p>
                  <p className="text-gray-600 tabular-nums">{selectedOrder.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Delivery Address</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {selectedOrder.address}, {selectedOrder.city}
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-[11px] text-[#520d75] mt-1">Note: {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-extrabold text-[#38035e] uppercase tracking-wider">
                  Ordered Outfits ({selectedOrder.items.length})
                </p>
                {selectedOrder.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100"
                  >
                    <div className="w-12 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <SmartImage
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-gray-800 line-clamp-1">{item.title}</p>
                      <p className="text-gray-500">
                        Size {item.size} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-extrabold text-[#520d75] tabular-nums">
                      {formatPKR(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPKR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">
                    {selectedOrder.shippingFee === 0 ? 'FREE' : formatPKR(selectedOrder.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#38035e] pt-1">
                  <span>Grand Total</span>
                  <span className="tabular-nums">{formatPKR(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Status:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleOrderStatusChange(
                        selectedOrder.orderId,
                        e.target.value as PlacedOrder['status']
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${statusPillClasses(
                      selectedOrder.status
                    )}`}
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <a
                  href={buildWhatsAppUrl(
                    `Assalam-o-Alaikum ${selectedOrder.customerName}! Update for your Rooznam Order ${selectedOrder.orderId}: Current status is ${selectedOrder.status}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Message Customer</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          ADD / EDIT PRODUCT MODAL
         ==================================================================== */}
      <ProductEditorModal
        open={productModalOpen}
        product={editingProduct}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

/* ==========================================================================
 * PRODUCT EDITOR MODAL (CREATE & EDIT)
 * ======================================================================== */

interface ProductEditorModalProps {
  open: boolean;
  product: AdminProductItem | null;
  onClose: () => void;
  onSave: (payload: ProductMutationPayload, existingId?: string) => Promise<void>;
}

function ProductEditorModal({ open, product, onClose, onSave }: ProductEditorModalProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [section, setSection] = useState<ProductItem['section']>('new-arrivals');
  const [price, setPrice] = useState('2190');
  const [stock, setStock] = useState('20');
  const [fabric, setFabric] = useState('Soft Printed Cotton');
  const [fit, setFit] = useState('Regular Fit');
  const [color, setColor] = useState('Pastel Pink');
  const [badge, setBadge] = useState('');
  const [image, setImage] = useState(IMAGE_PRESETS[0].url);
  const [backImage, setBackImage] = useState('');
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState<string[]>(AGE_SIZE_OPTIONS);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrMsg(null);
    if (product) {
      setTitle(product.title);
      setCategoryId(product.categoryId);
      setSection(product.section);
      setPrice(String(product.price));
      setStock(String(product.stock));
      setFabric(product.fabric);
      setFit(product.fit);
      setColor(product.color);
      setBadge(product.badge ?? '');
      setImage(product.image);
      setBackImage(product.backImage ?? '');
      setDescription(product.description);
      setSizes(product.sizes.length > 0 ? product.sizes : AGE_SIZE_OPTIONS);
      setIsActive(product.isActive);
    } else {
      setTitle('');
      setCategoryId(CATEGORIES[0].id);
      setSection('new-arrivals');
      setPrice('2190');
      setStock('25');
      setFabric('Soft Printed Lawn');
      setFit('Regular Comfort Fit');
      setColor('Festive Pink');
      setBadge('New Arrival');
      setImage(IMAGE_PRESETS[0].url);
      setBackImage('');
      setDescription('Soft child-friendly outfit tailored for everyday comfort and festive smiles.');
      setSizes(AGE_SIZE_OPTIONS);
      setIsActive(true);
    }
  }, [open, product]);

  const toggleSize = (sz: string) => {
    setSizes((prev) => (prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          categoryId,
          section,
          price: Number(price),
          stock: Number(stock),
          fabric: fabric.trim(),
          fit: fit.trim(),
          color: color.trim(),
          badge: badge.trim() || undefined,
          image: image.trim(),
          backImage: backImage.trim() || undefined,
          description: description.trim(),
          sizes: sizes.length > 0 ? sizes : AGE_SIZE_OPTIONS,
          isActive,
        },
        product?.id
      );
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2d024d]/45 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto text-left"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                  ROOZNAM CATALOG
                </span>
                <h3 className="text-xl font-extrabold text-[#38035e]">
                  {product ? 'Edit Kidswear Product' : 'Add New Kidswear Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:bg-purple-50 hover:text-[#38035e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {errMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Girls Festive Lawn Suit | Lilac Floral"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#55157e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Homepage Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value as ProductItem['section'])}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="new-arrivals">New Arrivals</option>
                    <option value="branded-ready-to-wear">Branded Ready To Wear</option>
                    <option value="catalog">Shop Catalog Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. New Arrival, Eid Pick"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={250000}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fabric</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Colour</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                <div className="sm:col-span-9 space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Front Photo URL (HTTPS or Rooznam asset path) *
                    </label>
                    <input
                      type="text"
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="/src/assets/images/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Back / Hover Photo URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={backImage}
                      onChange={(e) => setBackImage(e.target.value)}
                      placeholder="/src/assets/images/na-mustard-back.jpg"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {IMAGE_PRESETS.slice(0, 5).map((preset, idx) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImage(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-[#faf5fd] hover:bg-purple-100 text-[10px] font-bold text-[#520d75] cursor-pointer"
                      >
                        Photo #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-3 flex sm:flex-col items-center justify-center gap-2">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border border-purple-100 bg-gray-50">
                    <SmartImage
                      src={image}
                      alt="Front Preview"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  {backImage && (
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-purple-100 bg-gray-50">
                      <SmartImage
                        src={backImage}
                        alt="Back Preview"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Available Age Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {AGE_SIZE_OPTIONS.map((sz) => {
                    const active = sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#520d75] border-[#520d75] text-white'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#55157e]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#520d75]"
                  />
                  <span>Visible on live storefront</span>
                </label>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-[#38035e] hover:bg-[#2a0247] disabled:opacity-60 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : product ? 'Save Changes' : 'Publish Outfit'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
