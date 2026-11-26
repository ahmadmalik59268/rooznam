import React, { useState, useMemo, useEffect } from 'react';
import {
  Check,
  Heart,
  Minus,
  Package,
  Plus,
  Ruler,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ALL_PRODUCTS,
  buildWhatsAppUrl,
  CUSTOMIZED_BANNER_IMAGE,
  formatPKR,
  FREE_DELIVERY_THRESHOLD,
  PlacedOrder,
  POLICY_CONTENT,
  ProductItem,
  SIZE_GUIDE_ROWS,
  WHATSAPP_DISPLAY,
} from '../data/catalog';
import { WhatsAppIcon } from './Icons';
import { SmartImage } from './SmartImage';

export interface CartEntry {
  product: ProductItem;
  size: string;
  quantity: number;
}

interface ProductQuickViewModalProps {
  product: ProductItem | null;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductItem, size: string, qty?: number) => void;
  onBuyNow: (product: ProductItem, size: string, qty: number) => void;
  onToggleWishlist: (product: ProductItem) => void;
}

export function ProductQuickViewModal({
  product,
  isWishlisted,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
}: ProductQuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('4-5 Yrs');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[2] ?? product.sizes[0] ?? '4-5 Yrs');
      setQuantity(1);
      setShowSizeGuide(false);
      setAddedFeedback(false);
    }
  }, [product]);

  const handleAdd = () => {
    if (!product) return;
    onAddToCart(product, selectedSize, quantity);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1200);
  };

  return (
    <AnimatePresence>
      {product && (
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close product preview"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-[#38035e] flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="md:col-span-5 aspect-[3/4] md:aspect-auto md:h-full bg-[#faf8fc]">
              <SmartImage
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between text-left">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                  {product.categoryName}
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#38035e] mt-1.5 leading-snug pr-8">
                  {product.title}
                </h3>
                <p className="text-2xl font-black text-[#55157e] mt-2.5 tabular-nums">
                  {product.priceFormatted}
                </p>

                <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>Fabric: {product.fabric}</span>
                  <span aria-hidden="true">·</span>
                  <span>Fit: {product.fit}</span>
                  <span aria-hidden="true">·</span>
                  <span>Colour: {product.color}</span>
                </div>

                {/* Age Size Selector + Size Guide */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Select Age Size
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#55157e] hover:text-[#d91b7e] underline underline-offset-2 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{showSizeGuide ? 'Hide size guide' : 'Age size guide'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {product.sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#520d75] border-[#520d75] text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-[#55157e] hover:text-[#55157e]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {showSizeGuide && (
                    <div className="mt-3 rounded-2xl border border-purple-100 bg-[#faf8fc] p-3 overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead>
                          <tr className="text-[#38035e] border-b border-purple-100">
                            <th className="pb-1.5 font-extrabold">Age</th>
                            <th className="pb-1.5 font-extrabold">Height</th>
                            <th className="pb-1.5 font-extrabold">Chest</th>
                            <th className="pb-1.5 font-extrabold">Length</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50 text-gray-600 tabular-nums">
                          {SIZE_GUIDE_ROWS.map((row) => (
                            <tr key={row.age}>
                              <td className="py-1 font-bold text-gray-800">{row.age}</td>
                              <td className="py-1">{row.height}</td>
                              <td className="py-1">{row.chest}</td>
                              <td className="py-1">{row.kurtaLength}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Qty
                  </span>
                  <div className="inline-flex items-center border border-gray-200 rounded-full bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-extrabold tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-1 py-3 px-5 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {addedFeedback ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to bag</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onBuyNow(product, selectedSize, quantity)}
                    className="px-5 py-3 rounded-full bg-[#d91b7e] hover:bg-[#be166d] text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Buy now
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isWishlisted
                        ? 'border-[#d91b7e] bg-pink-50 text-[#d91b7e]'
                        : 'border-gray-200 text-gray-500 hover:border-[#d91b7e] hover:text-[#d91b7e]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#d91b7e]' : ''}`} />
                  </button>
                </div>

                <a
                  href={buildWhatsAppUrl(
                    `Assalam-o-Alaikum Rooznam! I would like to order "${product.title}" (${product.priceFormatted}) in size ${selectedSize} (Qty: ${quantity}).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-6 rounded-full border border-[#1faf59] text-[#19994c] hover:bg-[#1faf59] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Order directly on WhatsApp</span>
                </a>

                <p className="text-[11px] text-gray-500 text-center pt-1">
                  Cash on Delivery · Free delivery above Rs. 3,000 · 7-day exchange
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface CartDrawerProps {
  open: boolean;
  items: CartEntry[];
  onClose: () => void;
  onUpdateQty: (productId: string, size: string, delta: number) => void;
  onRemove: (productId: string, size: string) => void;
  onProceedToCheckout: () => void;
  onViewFullCart?: () => void;
}

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  onProceedToCheckout,
  onViewFullCart,
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const whatsappSummary = items
    .map(
      (e) =>
        `• ${e.product.title} (${e.size}) x${e.quantity} — ${formatPKR(
          e.product.price * e.quantity
        )}`
    )
    .join('\n');

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2d024d]/40 backdrop-blur-xs"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#38035e]">Shopping Bag</h3>
                <p className="text-xs text-gray-500">
                  {items.reduce((acc, i) => acc + i.quantity, 0)} items selected
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shopping bag"
                className="p-2 rounded-full text-gray-500 hover:bg-purple-50 hover:text-[#38035e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Delivery Progress */}
            <div className="px-6 py-3 bg-[#faf5fd] border-b border-purple-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#38035e] mb-1.5">
                <Truck className="w-4 h-4 text-[#d91b7e]" />
                {remainingForFreeShipping === 0 && subtotal > 0 ? (
                  <span>You unlocked FREE delivery across Pakistan!</span>
                ) : (
                  <span>
                    Add{' '}
                    <strong className="tabular-nums">{formatPKR(remainingForFreeShipping)}</strong>{' '}
                    more for Free Delivery
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-purple-200/70 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#520d75] to-[#d91b7e] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#faf5fd] text-[#55157e] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-[#38035e]">Your bag is empty</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Explore our eastern wear, western co-ords, and branded kids collections.
                  </p>
                </div>
              ) : (
                items.map((entry) => (
                  <div
                    key={`${entry.product.id}-${entry.size}`}
                    className="flex gap-4 pb-4 border-b border-gray-100"
                  >
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <SmartImage
                        src={entry.product.image}
                        alt={entry.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                          {entry.product.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Size: {entry.size}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-full">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(entry.product.id, entry.size, -1)}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold tabular-nums">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(entry.product.id, entry.size, 1)}
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#55157e] tabular-nums">
                            {formatPKR(entry.product.price * entry.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemove(entry.product.id, entry.size)}
                            aria-label="Remove item"
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-white space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="text-lg font-extrabold text-[#38035e] tabular-nums">
                    {formatPKR(subtotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full py-3 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
                >
                  Proceed to Checkout (COD)
                </button>
                {onViewFullCart && (
                  <button
                    type="button"
                    onClick={onViewFullCart}
                    className="w-full py-2.5 rounded-full border border-[#520d75] text-[#520d75] hover:bg-[#faf5fd] text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Full Cart Page
                  </button>
                )}
                <a
                  href={buildWhatsAppUrl(
                    `Assalam-o-Alaikum Rooznam! I would like to place this order:\n${whatsappSummary}\nTotal: ${formatPKR(
                      subtotal
                    )}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Quick Order on WhatsApp</span>
                </a>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

interface WishlistDrawerProps {
  open: boolean;
  products: ProductItem[];
  onClose: () => void;
  onRemove: (product: ProductItem) => void;
  onMoveToCart: (product: ProductItem) => void;
}

export function WishlistDrawer({
  open,
  products,
  onClose,
  onRemove,
  onMoveToCart,
}: WishlistDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2d024d]/40 backdrop-blur-xs"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#38035e]">Saved Outfits</h3>
                <p className="text-xs text-gray-500">{products.length} favourites</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close wishlist"
                className="p-2 rounded-full text-gray-500 hover:bg-purple-50 hover:text-[#38035e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-pink-50 text-[#d91b7e] flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-[#38035e]">No saved outfits yet</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Tap the heart icon on any product to save it here for later.
                  </p>
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-4 pb-4 border-b border-gray-100 items-center"
                  >
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <SmartImage
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                        {product.title}
                      </p>
                      <p className="text-xs font-bold text-[#55157e] mt-1 tabular-nums">
                        {product.priceFormatted}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => onMoveToCart(product)}
                          className="text-[11px] font-bold text-[#520d75] hover:text-[#d91b7e] cursor-pointer"
                        >
                          Add to bag
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(product)}
                          className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

interface SearchModalProps {
  open: boolean;
  products?: ProductItem[];
  onClose: () => void;
  onSelectProduct: (product: ProductItem) => void;
}

export function SearchModal({
  open,
  products = ALL_PRODUCTS,
  onClose,
  onSelectProduct,
}: SearchModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q)
    );
  }, [query, products]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2d024d]/45 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-[#55157e] shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kurtas, floral co-ords, sherwani, Edenrobe, Outfitters..."
                className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="p-1.5 rounded-full text-gray-400 hover:text-[#38035e] hover:bg-purple-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e] mb-3">
                {query.trim() ? `Results (${results.length})` : 'Popular at Rooznam'}
              </p>

              {results.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No outfits found for &ldquo;{query}&rdquo;. Try searching &ldquo;Kurta&rdquo;,
                  &ldquo;Edenrobe&rdquo;, &ldquo;Floral&rdquo;, or &ldquo;Customized&rdquo;.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProduct(item);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#faf5fd] transition-colors text-left cursor-pointer"
                    >
                      <div className="w-14 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <SmartImage
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-xs font-bold text-[#55157e] mt-1 tabular-nums">
                          {item.priceFormatted}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface CustomizedModalProps {
  open: boolean;
  onClose: () => void;
  onAddCustomToBag: (product: ProductItem, size: string) => void;
}

const EMBROIDERY_OPTIONS = ['Cutwork', 'Sindhi Embroidery', 'Mirror Work', 'Festive Zari'];
const FABRIC_OPTIONS = ['Pure Lawn', 'Cotton Karandi', 'Festive Organza', 'Velvet Festive'];
const CUSTOM_SIZES = ['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs', 'Custom'];

export function CustomizedSuitsModal({
  open,
  onClose,
  onAddCustomToBag,
}: CustomizedModalProps) {
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
    onClose();
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close customized suits builder"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-[#38035e] flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="md:col-span-5 h-56 md:h-auto bg-[#38035e]">
              <SmartImage
                src={CUSTOMIZED_BANNER_IMAGE}
                alt="Customized festive stitched suit"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="md:col-span-7 p-6 sm:p-8 text-left space-y-4">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customized Stitching Studio</span>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#38035e] leading-tight">
                  Design your child&apos;s customized suit
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Tailored in 7–10 working days · Estimated:{' '}
                  <strong className="text-[#55157e] tabular-nums">
                    {formatPKR(estimatedPrice)}
                  </strong>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Embroidery Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EMBROIDERY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEmbroidery(opt)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          embroidery === opt
                            ? 'bg-[#520d75] border-[#520d75] text-white'
                            : 'border-gray-200 text-gray-700 hover:border-[#55157e]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Fabric Choice
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FABRIC_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFabric(opt)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          fabric === opt
                            ? 'bg-[#520d75] border-[#520d75] text-white'
                            : 'border-gray-200 text-gray-700 hover:border-[#55157e]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                      Child&apos;s Age Size
                    </label>
                    <select
                      value={ageSize}
                      onChange={(e) => setAgeSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                    >
                      {CUSTOM_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                      Preferred Colour
                    </label>
                    <input
                      type="text"
                      value={colorPreference}
                      onChange={(e) => setColorPreference(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Custom Measurements / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={measurementNote}
                    onChange={(e) => setMeasurementNote(e.target.value)}
                    placeholder="e.g. Kurta length 24 in, chest 23 in, sleeve 14 in"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full py-3 px-6 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
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
                  className="w-full py-2.5 px-6 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Send Specifications on WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface AccountInfoModalProps {
  open: boolean;
  orders: PlacedOrder[];
  initialOrderId?: string;
  onClose: () => void;
}

export function AccountInfoModal({
  open,
  orders,
  initialOrderId = '',
  onClose,
}: AccountInfoModalProps) {
  const [tab, setTab] = useState<'track' | 'orders'>('track');
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [searchedId, setSearchedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialOrderId) {
      setTab('track');
      setOrderIdInput(initialOrderId);
      setSearchedId(initialOrderId);
    }
  }, [open, initialOrderId]);

  const matchedOrder = useMemo(() => {
    const target = (searchedId ?? '').trim().toLowerCase();
    if (!target) return null;
    return orders.find((o) => o.orderId.toLowerCase() === target) ?? null;
  }, [orders, searchedId]);

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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-left max-h-[88vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account modal"
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-purple-50 hover:text-[#38035e] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
              ROOZNAM CUSTOMER CARE
            </span>
            <h3 className="text-xl font-extrabold text-[#38035e] mt-1 mb-4">
              Orders &amp; Delivery Tracking
            </h3>

            {/* Tabs */}
            <div className="flex gap-1.5 p-1 bg-[#faf5fd] rounded-xl mb-5 border border-purple-100">
              <button
                type="button"
                onClick={() => setTab('track')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tab === 'track'
                    ? 'bg-white text-[#38035e] shadow-xs'
                    : 'text-gray-500 hover:text-[#38035e]'
                }`}
              >
                Track Your Order
              </button>
              <button
                type="button"
                onClick={() => setTab('orders')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tab === 'orders'
                    ? 'bg-white text-[#38035e] shadow-xs'
                    : 'text-gray-500 hover:text-[#38035e]'
                }`}
              >
                My Orders ({orders.length})
              </button>
            </div>

            {tab === 'track' ? (
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (orderIdInput.trim()) setSearchedId(orderIdInput.trim());
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    placeholder="Enter Order ID (e.g. RZN-2026-1042)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 focus:border-[#55157e]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#520d75] hover:bg-[#3f095c] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Track
                  </button>
                </form>

                {matchedOrder ? (
                  <div className="mt-5 p-4 rounded-2xl bg-[#faf8fc] border border-purple-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-[#38035e]">
                          {matchedOrder.orderId}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Placed on {matchedOrder.createdAt} · {matchedOrder.city}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        {matchedOrder.status}
                      </span>
                    </div>

                    {/* Visual Shipment Stepper */}
                    <div className="space-y-2.5 pt-1">
                      {[
                        { label: 'Order Confirmed', done: true },
                        { label: 'Quality Check & Packing at Rooznam Studio', done: true },
                        { label: 'Courier Dispatch Across Pakistan', done: false },
                        { label: 'Doorstep Cash on Delivery', done: false },
                      ].map((step) => (
                        <div key={step.label} className="flex items-center gap-2.5 text-xs">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              step.done
                                ? 'bg-[#520d75] text-white'
                                : 'bg-purple-100 text-purple-400'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </span>
                          <span className={step.done ? 'font-semibold text-gray-800' : 'text-gray-400'}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-purple-100 pt-3 flex justify-between text-xs">
                      <span className="text-gray-500">{matchedOrder.items.length} outfit(s)</span>
                      <span className="font-extrabold text-[#55157e] tabular-nums">
                        {formatPKR(matchedOrder.total)}
                      </span>
                    </div>
                  </div>
                ) : searchedId ? (
                  <div className="mt-4 p-4 rounded-2xl bg-[#faf5fd] border border-purple-100 text-xs text-[#38035e] space-y-2">
                    <p>
                      Order <strong>{searchedId}</strong> was not found on this device. Message our
                      dispatch desk on WhatsApp for instant courier tracking.
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
                      <span>Track via WhatsApp ({WHATSAPP_DISPLAY})</span>
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#faf5fd] text-[#55157e] flex items-center justify-center mx-auto">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-[#38035e]">No orders placed yet</p>
                    <p className="text-xs text-gray-500">
                      Orders you place via Checkout will appear here with instant tracking.
                    </p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.orderId}
                      className="p-4 rounded-2xl border border-purple-100 bg-[#faf8fc] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#38035e]">
                          {order.orderId}
                        </span>
                        <span className="text-xs font-bold text-[#55157e] tabular-nums">
                          {formatPKR(order.total)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {order.createdAt} · {order.city} · {order.items.length} item(s)
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderIdInput(order.orderId);
                          setSearchedId(order.orderId);
                          setTab('track');
                        }}
                        className="text-[11px] font-bold text-[#d91b7e] hover:underline cursor-pointer"
                      >
                        View delivery status
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">WhatsApp Desk</span>
              <a
                href={buildWhatsAppUrl('Hi Rooznam! I need help with my order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#1faf59] hover:underline tabular-nums"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface PolicyInfoModalProps {
  policyKey: string | null;
  onClose: () => void;
}

export function PolicyInfoModal({ policyKey, onClose }: PolicyInfoModalProps) {
  const content = policyKey ? POLICY_CONTENT[policyKey] : null;

  return (
    <AnimatePresence>
      {content && (
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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-left space-y-4"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close information modal"
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-purple-50 hover:text-[#38035e] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
              ROOZNAM KIDSWEAR
            </span>
            <h3 className="text-2xl font-extrabold text-[#38035e]">{content.title}</h3>
            <p className="text-xs font-semibold text-[#55157e]">{content.subtitle}</p>
            <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
              {content.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-gray-100">
              <a
                href={buildWhatsAppUrl(`Hi Rooznam! I have a question regarding ${content.title}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1faf59] hover:underline"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Ask on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#520d75] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
