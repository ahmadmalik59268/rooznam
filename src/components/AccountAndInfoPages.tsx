import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  buildWhatsAppUrl,
  CUSTOMIZED_BANNER_IMAGE,
  formatPKR,
  PAKISTAN_CITIES,
  PlacedOrder,
  POLICY_CONTENT,
  ProductItem,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from '../data/catalog';
import { api, AuthUser } from '../lib/api';
import { WhatsAppIcon } from './Icons';
import { SmartImage } from './SmartImage';

/* ============================================================================
 * 1. FULL PAGE: CUSTOMIZED SUITS STUDIO
 * ========================================================================== */

const EMBROIDERY_OPTIONS = ['Cutwork', 'Sindhi Embroidery', 'Mirror Work', 'Festive Zari'];
const FABRIC_OPTIONS = ['Pure Lawn', 'Cotton Karandi', 'Festive Organza', 'Velvet Festive'];
const CUSTOM_SIZES = ['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs', 'Custom'];

interface CustomizedSuitsPageProps {
  onBackHome: () => void;
  onAddCustomToBag: (product: ProductItem, size: string) => void;
}

export function CustomizedSuitsPage({
  onBackHome,
  onAddCustomToBag,
}: CustomizedSuitsPageProps) {
  const [embroidery, setEmbroidery] = useState('Sindhi Embroidery');
  const [fabric, setFabric] = useState('Pure Lawn');
  const [ageSize, setAgeSize] = useState('4-5 Yrs');
  const [colorPreference, setColorPreference] = useState('Deep Maroon & Gold');
  const [measurementNote, setMeasurementNote] = useState('');

  const estimatedPrice =
    fabric === 'Velvet Festive' ? 4950 : fabric === 'Festive Organza' ? 4490 : 3850;

  const handleAddCustom = () => {
    const customProduct: ProductItem = {
      id: `custom-${embroidery.toLowerCase().replace(/\s+/g, '-')}-${fabric
        .toLowerCase()
        .replace(/\s+/g, '-')}`,
      title: `Customized ${embroidery} Suit | ${fabric} (${colorPreference})`,
      price: estimatedPrice,
      priceFormatted: formatPKR(estimatedPrice),
      image: CUSTOMIZED_BANNER_IMAGE,
      categoryId: 'customized-suits',
      categoryName: 'Customized Suits',
      section: 'catalog',
      fabric,
      fit: 'Tailored to Order',
      color: colorPreference,
      description: measurementNote || `Custom stitched ${embroidery} celebration suit.`,
      sizes: CUSTOM_SIZES,
    };
    onAddCustomToBag(customProduct, ageSize);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#faf8fc] pb-20"
    >
      <div className="bg-gradient-to-r from-[#490c6d] via-[#53117c] to-[#38035e] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-200 hover:text-white mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-pink-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MADE FOR CELEBRATIONS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-2">
            Customized Suits Tailoring Studio
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 mt-2 max-w-2xl leading-relaxed">
            Choose embroidery work, soft child-friendly fabric, colour palette, and your child&apos;s
            exact age or custom measurements. Stitched carefully in 7–10 working days.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-[#38035e] min-h-[340px]">
            <SmartImage
              src={CUSTOMIZED_BANNER_IMAGE}
              alt="Customized festive stitched kids suit"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 text-left space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-purple-50 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#38035e]">
                  Configure Your Custom Outfit
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Soft cotton inner lining included on every festive suit.
                </p>
              </div>
              <span className="text-2xl font-black text-[#55157e] tabular-nums">
                {formatPKR(estimatedPrice)}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  1. Embroidery Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {EMBROIDERY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEmbroidery(opt)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        embroidery === opt
                          ? 'bg-[#520d75] border-[#520d75] text-white shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-[#55157e]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  2. Fabric Selection
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FABRIC_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFabric(opt)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        fabric === opt
                          ? 'bg-[#520d75] border-[#520d75] text-white shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-[#55157e]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    3. Age Size
                  </label>
                  <select
                    value={ageSize}
                    onChange={(e) => setAgeSize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-[#55157e]"
                  >
                    {CUSTOM_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    4. Preferred Colour
                  </label>
                  <input
                    type="text"
                    value={colorPreference}
                    onChange={(e) => setColorPreference(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#55157e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  5. Custom Measurements / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={measurementNote}
                  onChange={(e) => setMeasurementNote(e.target.value)}
                  placeholder="e.g. Kurta length 24 in, chest 23 in, sleeve 14 in, sibling matching set"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#55157e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full py-3.5 px-6 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                Add Custom Suit to Bag · {formatPKR(estimatedPrice)}
              </button>
              <a
                href={buildWhatsAppUrl(
                  `Assalam-o-Alaikum Rooznam! I want to order a Customized Suit:\n• Embroidery: ${embroidery}\n• Fabric: ${fabric}\n• Size: ${ageSize}\n• Colour: ${colorPreference}${
                    measurementNote ? `\n• Notes: ${measurementNote}` : ''
                  }`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Discuss on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ============================================================================
 * 2. FULL PAGE: ACCOUNT / MY ORDERS / TRACK ORDER / WISHLIST
 * ========================================================================== */

interface AccountPageProps {
  currentUser: AuthUser | null;
  orders: PlacedOrder[];
  wishlistedProducts: ProductItem[];
  initialTab?: 'track' | 'orders' | 'wishlist';
  initialOrderId?: string;
  onBackHome: () => void;
  onSelectProduct: (product: ProductItem) => void;
  onMoveWishlistToBag: (product: ProductItem) => void;
  onRemoveWishlist: (product: ProductItem) => void;
  onOpenAuth: (tab?: 'login' | 'signup' | 'admin') => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onUserUpdated: (user: AuthUser) => void;
}

export function AccountPage({
  currentUser,
  orders,
  wishlistedProducts,
  initialTab = 'track',
  initialOrderId = '',
  onBackHome,
  onSelectProduct,
  onMoveWishlistToBag,
  onRemoveWishlist,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  onUserUpdated,
}: AccountPageProps) {
  const [tab, setTab] = useState<'track' | 'orders' | 'wishlist'>(initialTab);
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [searchedId, setSearchedId] = useState<string | null>(initialOrderId || null);
  const [serverTrackedOrder, setServerTrackedOrder] = useState<PlacedOrder | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profName, setProfName] = useState(currentUser?.name ?? '');
  const [profPhone, setProfPhone] = useState(currentUser?.phone ?? '');
  const [profCity, setProfCity] = useState(currentUser?.city || 'Lahore');
  const [profAddress, setProfAddress] = useState(currentUser?.address ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setProfName(currentUser?.name ?? '');
    setProfPhone(currentUser?.phone ?? '');
    setProfCity(currentUser?.city || 'Lahore');
    setProfAddress(currentUser?.address ?? '');
  }, [currentUser]);

  const lookupOrder = async (rawId: string) => {
    const clean = rawId.trim();
    if (!clean) return;
    setSearchedId(clean);
    setTrackingLoading(true);
    try {
      const { order } = await api.trackOrder(clean);
      setServerTrackedOrder(order);
    } catch {
      setServerTrackedOrder(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    setTab(initialTab);
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      lookupOrder(initialOrderId);
    }
  }, [initialTab, initialOrderId]);

  const matchedOrder = useMemo(() => {
    if (
      serverTrackedOrder &&
      searchedId &&
      serverTrackedOrder.orderId.toLowerCase() === searchedId.trim().toLowerCase()
    ) {
      return serverTrackedOrder;
    }
    const target = (searchedId ?? '').trim().toLowerCase();
    if (!target) return null;
    return orders.find((o) => o.orderId.toLowerCase() === target) ?? null;
  }, [orders, searchedId, serverTrackedOrder]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const { user } = await api.updateProfile({
        name: profName.trim(),
        phone: profPhone.trim(),
        city: profCity,
        address: profAddress.trim(),
      });
      onUserUpdated(user);
      setEditingProfile(false);
    } catch {
      // ignore
    } finally {
      setSavingProfile(false);
    }
  };

  const getStepDone = (status: PlacedOrder['status'], stepIdx: number) => {
    if (status === 'Cancelled') return false;
    const rank: Record<PlacedOrder['status'], number> = {
      Confirmed: 0,
      Packing: 1,
      Dispatched: 2,
      Delivered: 3,
      Cancelled: -1,
    };
    return rank[status] >= stepIdx;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#faf8fc] min-h-[72vh] pb-20"
    >
      <div className="bg-gradient-to-r from-[#fbf5fd] via-[#f7eefc] to-[#f4e8fa] border-b border-purple-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55157e] hover:text-[#d91b7e] mb-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <span className="block text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
              MY ACCOUNT &amp; ORDERS
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#38035e] mt-1">
              {currentUser ? `Welcome, ${currentUser.name}` : 'Rooznam Customer Hub'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#38035e] hover:bg-[#520d75] text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open Admin Dashboard</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-purple-200 hover:border-rose-300 text-xs font-bold text-gray-700 hover:text-rose-600 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Sign Up</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('admin')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[#38035e] text-[#38035e] hover:bg-[#faf5fd] text-xs font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Logged-in Profile Card */}
        {currentUser && (
          <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-xs mb-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#faf5fd] text-[#520d75] flex items-center justify-center font-black text-lg border border-purple-100">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base font-extrabold text-[#38035e]">
                      {currentUser.name}
                    </p>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        currentUser.role === 'admin'
                          ? 'bg-[#38035e] text-white'
                          : 'bg-purple-50 text-[#520d75]'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {currentUser.email}
                    {currentUser.phone ? ` · ${currentUser.phone}` : ''} · {currentUser.city}
                  </p>
                </div>
              </div>

              {currentUser.id !== 'env-admin' && (
                <button
                  type="button"
                  onClick={() => setEditingProfile((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-200 text-xs font-bold text-[#520d75] hover:bg-[#faf5fd] cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{editingProfile ? 'Close Editor' : 'Edit Delivery Profile'}</span>
                </button>
              )}
            </div>

            {editingProfile && (
              <form
                onSubmit={handleSaveProfile}
                className="mt-5 pt-5 border-t border-purple-50 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Full Name"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm"
                />
                <input
                  type="tel"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  placeholder="Mobile / WhatsApp"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm"
                />
                <select
                  value={profCity}
                  onChange={(e) => setProfCity(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={profAddress}
                  onChange={(e) => setProfAddress(e.target.value)}
                  placeholder="Default Street Address"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm"
                />
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs font-bold cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Segmented Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'track' as const, label: 'Track Your Order' },
            { id: 'orders' as const, label: `My Orders (${orders.length})` },
            { id: 'wishlist' as const, label: `Saved Wishlist (${wishlistedProducts.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[#38035e] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-purple-100 hover:border-[#55157e]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Track Order */}
        {tab === 'track' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs text-left space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#38035e]">Track Your Order</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Enter your Rooznam Order ID (e.g. RZN-2026-4812) to view live packing and dispatch
                progress.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupOrder(orderIdInput);
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-xl"
            >
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter Order ID (e.g. RZN-2026-4812)"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-7 py-3 rounded-xl bg-[#520d75] hover:bg-[#3f095c] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
              >
                {trackingLoading ? 'Searching...' : 'Track Order'}
              </button>
            </form>

            {matchedOrder ? (
              <div className="p-6 rounded-2xl bg-[#faf8fc] border border-purple-100 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-extrabold text-[#38035e]">
                      Order {matchedOrder.orderId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Placed on {matchedOrder.createdAt} · Delivering to {matchedOrder.city}
                    </p>
                  </div>
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                      matchedOrder.status === 'Cancelled'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {matchedOrder.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  {[
                    { label: 'Order Confirmed', done: getStepDone(matchedOrder.status, 0) },
                    { label: 'Packing & QC', done: getStepDone(matchedOrder.status, 1) },
                    { label: 'Courier Dispatched', done: getStepDone(matchedOrder.status, 2) },
                    { label: 'Delivered (COD)', done: getStepDone(matchedOrder.status, 3) },
                  ].map((step) => (
                    <div
                      key={step.label}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        step.done
                          ? 'bg-white border-purple-200 text-[#38035e] font-bold'
                          : 'bg-gray-50/70 border-gray-100 text-gray-400'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          step.done ? 'bg-[#520d75] text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </span>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-purple-100 pt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {matchedOrder.items.length} outfit(s) · {matchedOrder.customerName}
                  </span>
                  <span className="font-black text-[#55157e] tabular-nums">
                    {formatPKR(matchedOrder.total)}
                  </span>
                </div>
              </div>
            ) : searchedId && !trackingLoading ? (
              <div className="p-5 rounded-2xl bg-[#fff9eb] border border-amber-200/80 text-xs sm:text-sm text-gray-700 space-y-2">
                <p>
                  Order <strong>{searchedId}</strong> was not found. Double-check your Order ID or
                  message our Rooznam dispatch desk on WhatsApp for live courier updates.
                </p>
                <a
                  href={buildWhatsAppUrl(
                    `Assalam-o-Alaikum Rooznam! Please share tracking status for order ${searchedId}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#1faf59] hover:underline"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Message WhatsApp Support ({WHATSAPP_DISPLAY})</span>
                </a>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: My Orders */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-[#faf5fd] text-[#55157e] flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-extrabold text-[#38035e]">No orders placed yet</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Once you complete checkout, your order receipt and tracking ID will appear here.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs text-left space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-base font-extrabold text-[#38035e]">{order.orderId}</p>
                      <p className="text-xs text-gray-500">
                        {order.createdAt} · {order.city} · {order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-[#55157e] tabular-nums">
                        {formatPKR(order.total)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderIdInput(order.orderId);
                          setSearchedId(order.orderId);
                          setTab('track');
                        }}
                        className="text-xs font-bold text-[#d91b7e] hover:underline cursor-pointer"
                      >
                        Track status
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items.map((item) => (
                      <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                          <SmartImage
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-xs">
                          <p className="font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                          <p className="text-gray-500">
                            Size {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Saved Wishlist */}
        {tab === 'wishlist' && (
          <div>
            {wishlistedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-pink-50 text-[#d91b7e] flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-extrabold text-[#38035e]">No saved outfits yet</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Tap the heart icon on any product to bookmark it for your little one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {wishlistedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-purple-100 p-4 flex flex-col justify-between text-left"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="block w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 mb-3 cursor-pointer"
                      >
                        <SmartImage
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                        {product.title}
                      </p>
                      <p className="text-sm font-extrabold text-[#55157e] mt-1 tabular-nums">
                        {product.priceFormatted}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => onMoveWishlistToBag(product)}
                        className="flex-1 py-2 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs font-bold cursor-pointer"
                      >
                        Add to bag
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveWishlist(product)}
                        className="px-3 py-2 rounded-full border border-gray-200 text-xs text-gray-500 hover:text-red-500 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ============================================================================
 * 3. FULL PAGE: ABOUT US, CONTACT US & POLICIES
 * ========================================================================== */

interface InfoPageProps {
  pageKey: string;
  onBackHome: () => void;
  onNavigateShop: () => void;
}

export function InfoPage({ pageKey, onBackHome, onNavigateShop }: InfoPageProps) {
  const content = POLICY_CONTENT[pageKey] ?? POLICY_CONTENT.about;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    try {
      await api.submitContact({
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
    } catch {
      // still show confirmation gracefully
    }
    setSent(true);
    setName('');
    setPhone('');
    setMessage('');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#faf8fc] min-h-[70vh] pb-20"
    >
      <div className="bg-gradient-to-r from-[#fbf5fd] via-[#f7eefc] to-[#f4e8fa] border-b border-purple-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55157e] hover:text-[#d91b7e] mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <span className="block text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
            ROOZNAM KIDSWEAR
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#38035e] mt-1">
            {content.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1.5">{content.subtitle}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-10 shadow-xs text-left space-y-4">
          {content.paragraphs.map((p) => (
            <p key={p} className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {p}
            </p>
          ))}

          {pageKey !== 'contact' && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onNavigateShop}
                className="px-7 py-3 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
              >
                Explore All Kidswear
              </button>
            </div>
          )}
        </div>

        {pageKey === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            <div className="md:col-span-5 bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-5">
              <h2 className="text-lg font-extrabold text-[#38035e]">Direct Support</h2>
              <div className="space-y-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#d91b7e] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-gray-900">WhatsApp &amp; Phone</p>
                    <a
                      href={buildWhatsAppUrl('Assalam-o-Alaikum Rooznam!')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#55157e] font-semibold hover:underline tabular-nums"
                    >
                      {WHATSAPP_DISPLAY}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#d91b7e] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-gray-900">Email</p>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-[#55157e] font-semibold hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#d91b7e] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-gray-900">Delivery Coverage</p>
                    <p>Nationwide doorstep delivery across Pakistan</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-extrabold text-[#38035e] mb-4">Send us a message</h2>
              {sent ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>
                    Thank you! Your message has been received. Our parent support team will reply
                    shortly.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name *"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#55157e]"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="WhatsApp number (optional)"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#55157e]"
                    />
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about sizes, custom stitching, or your order *"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#55157e]"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
