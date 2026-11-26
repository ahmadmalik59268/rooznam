import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  buildWhatsAppUrl,
  formatPKR,
  FREE_DELIVERY_THRESHOLD,
  PAKISTAN_CITIES,
  PlacedOrder,
  STANDARD_DELIVERY_FEE,
} from '../data/catalog';
import { api, AuthUser } from '../lib/api';
import { WhatsAppIcon } from './Icons';
import { SmartImage } from './SmartImage';
import { CartEntry } from './StoreOverlays';

interface CartPageProps {
  items: CartEntry[];
  onUpdateQty: (productId: string, size: string, delta: number) => void;
  onRemove: (productId: string, size: string) => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
}

export function CartPage({
  items,
  onUpdateQty,
  onRemove,
  onContinueShopping,
  onProceedToCheckout,
}: CartPageProps) {
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = items.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shippingFee =
    discountedSubtotal === 0 || discountedSubtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : STANDARD_DELIVERY_FEE;
  const total = discountedSubtotal + shippingFee;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - discountedSubtotal);
  const progressPct = Math.min(100, (discountedSubtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code === 'ROOZNAM10' || code === 'WELCOME10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponApplied(false);
      setCouponError('Try code ROOZNAM10 for 10% family discount.');
    }
  };

  const whatsappSummary = items
    .map(
      (e) =>
        `• ${e.product.title} (${e.size}) x${e.quantity} — ${formatPKR(
          e.product.price * e.quantity
        )}`
    )
    .join('\n');

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#faf8fc] min-h-[72vh] pb-20"
    >
      <div className="bg-gradient-to-r from-[#fbf5fd] via-[#f7eefc] to-[#f4e8fa] border-b border-purple-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onContinueShopping}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55157e] hover:text-[#d91b7e] mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#38035e]">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Review your selected kids outfits before proceeding to Cash on Delivery checkout.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-purple-100 p-14 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#faf5fd] text-[#55157e] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-[#38035e]">Your Rooznam cart is empty</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Browse our eastern wear, western co-ords, branded sets, and customized outfits.
            </p>
            <button
              type="button"
              onClick={onContinueShopping}
              className="mt-6 px-7 py-3 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Delivery Banner */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#38035e] mb-2">
                  <Truck className="w-4 h-4 text-[#d91b7e]" />
                  {remainingForFree === 0 ? (
                    <span>Congratulations! Your order qualifies for FREE delivery across Pakistan.</span>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="text-[#d91b7e] tabular-nums">
                        {formatPKR(remainingForFree)}
                      </strong>{' '}
                      more to unlock FREE delivery!
                    </span>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#520d75] to-[#d91b7e] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Item Cards */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
                {items.map((entry) => (
                  <div
                    key={`${entry.product.id}-${entry.size}`}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                  >
                    <div className="w-24 h-28 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-purple-50">
                      <SmartImage
                        src={entry.product.image}
                        alt={entry.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#d91b7e]">
                        {entry.product.categoryName}
                      </p>
                      <h3 className="text-sm sm:text-base font-bold text-[#38035e] mt-0.5">
                        {entry.product.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Age Size: <strong className="text-gray-800">{entry.size}</strong> · Unit
                        Price: <span className="tabular-nums">{entry.product.priceFormatted}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-5">
                      <div className="inline-flex items-center border border-gray-200 rounded-full">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(entry.product.id, entry.size, -1)}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-extrabold tabular-nums">
                          {entry.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(entry.product.id, entry.size, 1)}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[76px]">
                        <p className="text-sm font-black text-[#55157e] tabular-nums">
                          {formatPKR(entry.product.price * entry.quantity)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(entry.product.id, entry.size)}
                        aria-label="Remove item"
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs space-y-5 text-left">
                <h2 className="text-lg font-extrabold text-[#38035e]">Order Summary</h2>

                {/* Promo Code */}
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#d91b7e]" />
                    Promo Code (Try ROOZNAM10)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#55157e]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-[11px] font-semibold text-emerald-600">
                      10% Rooznam family discount applied!
                    </p>
                  )}
                  {couponError && <p className="text-[11px] text-amber-700">{couponError}</p>}
                </form>

                <div className="space-y-2.5 text-xs sm:text-sm border-t border-purple-50 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold tabular-nums">{formatPKR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount (10%)</span>
                      <span className="font-bold tabular-nums">-{formatPKR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Nationwide Delivery</span>
                    <span
                      className={`font-bold tabular-nums ${
                        shippingFee === 0 ? 'text-emerald-600' : 'text-gray-800'
                      }`}
                    >
                      {shippingFee === 0 ? 'FREE' : formatPKR(shippingFee)}
                    </span>
                  </div>
                  <div className="border-t border-purple-100 pt-3 flex justify-between text-base">
                    <span className="font-extrabold text-[#38035e]">Total</span>
                    <span className="font-black text-[#55157e] tabular-nums">
                      {formatPKR(total)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onProceedToCheckout}
                    className="w-full py-3.5 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Proceed to Checkout (COD)
                  </button>
                  <a
                    href={buildWhatsAppUrl(
                      `Assalam-o-Alaikum Rooznam! I would like to order:\n${whatsappSummary}\nTotal: ${formatPKR(
                        total
                      )}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Order on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

interface CheckoutPageProps {
  items: CartEntry[];
  currentUser?: AuthUser | null;
  onBackToCart: () => void;
  onContinueShopping: () => void;
  onOrderConfirmed: (order: PlacedOrder) => void;
  onTrackOrder: (orderId: string) => void;
}

export function CheckoutPage({
  items,
  currentUser = null,
  onBackToCart,
  onContinueShopping,
  onOrderConfirmed,
  onTrackOrder,
}: CheckoutPageProps) {
  const [customerName, setCustomerName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [city, setCity] = useState(currentUser?.city || 'Lahore');
  const [address, setAddress] = useState(currentUser?.address ?? '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'WhatsAppTransfer'>('COD');
  const [confirmedOrder, setConfirmedOrder] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim() || items.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { order } = await api.createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        city,
        address: address.trim(),
        notes: notes.trim() || undefined,
        paymentMethod,
        items: items.map((entry) => ({
          productId: entry.product.id,
          title: entry.product.title,
          size: entry.size,
          quantity: entry.quantity,
          price: entry.product.price,
          image: entry.product.image,
        })),
      });
      onOrderConfirmed(order);
      setConfirmedOrder(order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to place order right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const buildOrderWhatsAppMessage = (order: PlacedOrder) => {
    const lines = order.items
      .map((i) => `• ${i.title} (${i.size}) x${i.quantity} — ${formatPKR(i.price * i.quantity)}`)
      .join('\n');
    return `Assalam-o-Alaikum Rooznam!\nOrder ID: ${order.orderId}\nName: ${order.customerName}\nPhone: ${order.phone}\nCity: ${order.city}\nAddress: ${order.address}\nPayment: ${
      order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank / EasyPaisa / JazzCash'
    }\n\nItems:\n${lines}\n\nTotal: ${formatPKR(order.total)}`;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#faf8fc] min-h-[75vh] pb-20"
    >
      <div className="bg-[#38035e] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            {!confirmedOrder && (
              <button
                type="button"
                onClick={onBackToCart}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-200 hover:text-white mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Cart</span>
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-pink-300" />
              <span>{confirmedOrder ? 'Order Confirmed' : 'Secure Checkout'}</span>
            </h1>
          </div>
          <p className="text-xs text-purple-200">
            Nationwide Cash on Delivery · 7-day easy size exchange
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {confirmedOrder ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-purple-100 p-8 sm:p-10 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                THANK YOU FOR SHOPPING WITH ROOZNAM
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#38035e] mt-1">
                Order {confirmedOrder.orderId} Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                Estimated doorstep delivery to <strong>{confirmedOrder.city}</strong> in 2–4 working
                days.
              </p>
            </div>

            <div className="bg-[#faf8fc] rounded-2xl p-5 border border-purple-100 text-left space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Recipient</span>
                <span className="font-bold text-gray-800">{confirmedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mobile</span>
                <span className="font-bold text-gray-800 tabular-nums">{confirmedOrder.phone}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Delivery Address</span>
                <span className="font-semibold text-gray-800 text-right">
                  {confirmedOrder.address}, {confirmedOrder.city}
                </span>
              </div>
              <div className="border-t border-purple-100 pt-3 flex justify-between text-base">
                <span className="font-extrabold text-[#38035e]">
                  Total ({confirmedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Transfer'})
                </span>
                <span className="font-black text-[#55157e] tabular-nums">
                  {formatPKR(confirmedOrder.total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={buildWhatsAppUrl(buildOrderWhatsAppMessage(confirmedOrder))}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Send Order Copy on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => onTrackOrder(confirmedOrder.orderId)}
                className="w-full sm:w-auto px-7 py-3 rounded-full border border-[#520d75] text-[#520d75] hover:bg-[#520d75] hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Track Your Order
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center max-w-lg mx-auto">
            <h2 className="text-xl font-extrabold text-[#38035e]">Your cart is empty</h2>
            <p className="text-xs text-gray-500 mt-1.5">Add outfits to your bag before checking out.</p>
            <button
              type="button"
              onClick={onContinueShopping}
              className="mt-5 px-7 py-3 rounded-full bg-[#520d75] text-white text-xs font-bold cursor-pointer"
            >
              Shop Outfits
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Left: Delivery & Payment Details */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#38035e] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d91b7e]" />
                  <span>Delivery Details</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  We deliver across all major and regional cities in Pakistan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Complete Street Address *
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street #, Block / Sector / Area"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Order Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gift wrapping request, measurement note, or delivery instruction"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-2.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-[#520d75] bg-[#faf5fd] ring-1 ring-[#520d75]'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-[#38035e]">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Pay cash at your doorstep when your parcel arrives
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('WhatsAppTransfer')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'WhatsAppTransfer'
                        ? 'border-[#520d75] bg-[#faf5fd] ring-1 ring-[#520d75]'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-[#38035e]">
                      JazzCash / EasyPaisa / Bank
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Confirm transfer details directly on WhatsApp
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Sticky Checkout Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs space-y-5">
                <h2 className="text-lg font-extrabold text-[#38035e]">Your Order</h2>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((entry) => (
                    <div
                      key={`${entry.product.id}-${entry.size}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-14 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-purple-50">
                        <SmartImage
                          src={entry.product.image}
                          alt={entry.product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                          {entry.product.title}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Size {entry.size} · Qty {entry.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#55157e] tabular-nums shrink-0">
                        {formatPKR(entry.product.price * entry.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-purple-100 pt-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold tabular-nums">{formatPKR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span
                      className={`font-bold tabular-nums ${
                        shippingFee === 0 ? 'text-emerald-600' : 'text-gray-800'
                      }`}
                    >
                      {shippingFee === 0 ? 'FREE' : formatPKR(shippingFee)}
                    </span>
                  </div>
                  <div className="border-t border-purple-100 pt-3 flex justify-between text-base">
                    <span className="font-extrabold text-[#38035e]">Grand Total</span>
                    <span className="text-lg font-black text-[#55157e] tabular-nums">
                      {formatPKR(total)}
                    </span>
                  </div>
                </div>

                {submitError && (
                  <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-[#520d75] hover:bg-[#3f095c] disabled:opacity-60 text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
                >
                  {submitting ? 'Confirming Order...' : `Place Order · ${formatPKR(total)}`}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pay safely on delivery · 7-day size exchange</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </motion.section>
  );
}
