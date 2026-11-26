import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ALL_PRODUCTS,
  buildWhatsAppUrl,
  ProductItem,
  SIZE_GUIDE_ROWS,
} from '../data/catalog';
import { WhatsAppIcon } from './Icons';
import { ProductCard } from './ProductCard';
import { SmartImage } from './SmartImage';

interface ProductDetailPageProps {
  product: ProductItem;
  products?: ProductItem[];
  wishlistIds: string[];
  onBack: () => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem, size: string, qty: number) => void;
  onBuyNow: (product: ProductItem, size: string, qty: number) => void;
  onToggleWishlist: (product: ProductItem) => void;
}

export function ProductDetailPage({
  product,
  products = ALL_PRODUCTS,
  wishlistIds,
  onBack,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
}: ProductDetailPageProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[2] ?? '4-5 Yrs');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const gallery = useMemo(() => {
    const list: { label: string; src: string }[] = [{ label: 'Primary photo', src: product.image }];
    if (product.backImage && product.backImage !== product.image) {
      list.push({ label: 'Back photo', src: product.backImage });
    }
    return list;
  }, [product]);

  useEffect(() => {
    setSelectedSize(product.sizes[2] ?? product.sizes[0] ?? '4-5 Yrs');
    setQuantity(1);
    setShowSizeGuide(false);
    setAdded(false);
    setActivePhotoIndex(0);
    setLightboxOpen(false);
  }, [product]);

  const isWishlisted = wishlistIds.includes(product.id);
  const currentPhoto = gallery[activePhotoIndex] ?? gallery[0];

  const relatedProducts = useMemo(() => {
    const source = products.length > 0 ? products : ALL_PRODUCTS;
    const sameCategory = source.filter(
      (p) => p.categoryId === product.categoryId && p.id !== product.id
    );
    if (sameCategory.length >= 4) return sameCategory.slice(0, 4);
    const others = source.filter(
      (p) => p.id !== product.id && !sameCategory.some((s) => s.id === p.id)
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [product, products]);

  const handleAdd = () => {
    onAddToCart(product, selectedSize, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  const handleCyclePhoto = (dir: -1 | 1) => {
    if (gallery.length <= 1) return;
    setActivePhotoIndex((prev) => (prev + dir + gallery.length) % gallery.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white pb-16 sm:pb-20"
    >
      {/* Breadcrumb Bar */}
      <div className="bg-[#faf8fc] border-b border-purple-100/80 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-500 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-bold text-[#55157e] hover:text-[#d91b7e] cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onSelectCategory(product.categoryId)}
              className="hover:text-[#55157e] cursor-pointer truncate"
            >
              {product.categoryName}
            </button>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline text-gray-800 font-semibold truncate max-w-xs">
              {product.title}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
            In Stock · Ships across Pakistan
          </span>
        </div>
      </div>

      {/* Main Product Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Clean Front & Back Photo Gallery (Matches reference layout) */}
          <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-3.5">
            <div className="relative rounded-3xl overflow-hidden bg-[#faf8fc] border border-purple-100/80 shadow-sm aspect-[3/4]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhoto.src}
                  initial={{ opacity: 0.25 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.25 }}
                  transition={{ duration: 0.22 }}
                  className="w-full h-full"
                >
                  <SmartImage
                    src={currentPhoto.src}
                    alt={`${product.title} — ${currentPhoto.label}`}
                    priority
                    className="w-full h-full object-cover object-top"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Expand Fullscreen Icon (Clean top-right white circle matching reference) */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Zoom product photo"
                className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/92 hover:bg-white text-gray-700 hover:text-[#38035e] shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Prev/Next Controls when Back Photo exists */}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleCyclePhoto(-1)}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#38035e] shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCyclePhoto(1)}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#38035e] shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Clean Square-Rounded Thumbnail Strip Below Main Photo (No text overlays) */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-3">
                {gallery.map((item, idx) => {
                  const active = idx === activePhotoIndex;
                  return (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      aria-label={`View ${item.label}`}
                      className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-[#faf8fc] ${
                        active
                          ? 'border-[#38035e] ring-2 ring-[#38035e]/20 shadow-sm'
                          : 'border-gray-200 hover:border-purple-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <SmartImage
                        src={item.src}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Purchase Module */}
          <div className="lg:col-span-6 text-left space-y-6">
            <div>
              <button
                type="button"
                onClick={() => onSelectCategory(product.categoryId)}
                className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e] hover:underline cursor-pointer"
              >
                {product.categoryName}
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#38035e] mt-2 leading-tight">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-baseline gap-3 mt-3">
                <span className="text-2xl sm:text-3xl font-black text-[#55157e] tabular-nums">
                  {product.priceFormatted}
                </span>
                <span className="text-xs text-gray-500">Tax included · COD available</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

            {/* Quick Product Details */}
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700 list-disc pl-5">
              <li>
                <span className="font-semibold text-gray-900">Age:</span>{' '}
                {product.sizes[0]} – {product.sizes[product.sizes.length - 1]}
              </li>
              <li>
                <span className="font-semibold text-gray-900">Fabric:</span> {product.fabric}
              </li>
              <li>
                <span className="font-semibold text-gray-900">Color:</span> {product.color}
              </li>
              <li>
                <span className="font-semibold text-gray-900">Style / Fit:</span> {product.fit}
              </li>
            </ul>

            <div>
              <span className="inline-block px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                In Stock
              </span>
            </div>

            {/* Age Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5 gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                  Select Child&apos;s Age Size:{' '}
                  <span className="text-[#55157e]">{selectedSize}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55157e] hover:text-[#d91b7e] underline underline-offset-2 cursor-pointer shrink-0"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{showSizeGuide ? 'Hide size guide' : 'Size chart'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {product.sizes.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                <div className="mt-4 rounded-2xl border border-purple-100 bg-[#faf8fc] p-4 overflow-x-auto">
                  <p className="text-xs font-extrabold text-[#38035e] mb-2">
                    Rooznam Age Size Chart (Inches)
                  </p>
                  <table className="w-full text-xs text-left min-w-[340px]">
                    <thead>
                      <tr className="text-[#55157e] border-b border-purple-100">
                        <th className="pb-2 font-bold">Age</th>
                        <th className="pb-2 font-bold">Height</th>
                        <th className="pb-2 font-bold">Chest</th>
                        <th className="pb-2 font-bold">Waist</th>
                        <th className="pb-2 font-bold">Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50 text-gray-600 tabular-nums">
                      {SIZE_GUIDE_ROWS.map((row) => (
                        <tr key={row.age}>
                          <td className="py-1.5 font-bold text-gray-800">{row.age}</td>
                          <td className="py-1.5">{row.height}</td>
                          <td className="py-1.5">{row.chest}</td>
                          <td className="py-1.5">{row.waist}</td>
                          <td className="py-1.5">{row.kurtaLength}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quantity + Primary Purchase Actions */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center border border-gray-200 rounded-lg bg-white h-12 px-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-10 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-extrabold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="w-9 h-10 flex items-center justify-center text-gray-600 hover:text-[#38035e] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 min-w-[160px] h-12 px-6 rounded-lg bg-[#6a0dad] hover:bg-[#520d75] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  aria-label={isWishlisted ? 'Remove from saved outfits' : 'Save outfit'}
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'border-[#d91b7e] bg-pink-50 text-[#d91b7e]'
                      : 'border-gray-200 text-gray-600 hover:border-[#d91b7e] hover:text-[#d91b7e]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#d91b7e]' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onBuyNow(product, selectedSize, quantity)}
                className="w-full h-11 px-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-bold transition-colors cursor-pointer"
              >
                Buy Now
              </button>

              <div>
                <a
                  href={buildWhatsAppUrl(
                    `Assalam-o-Alaikum Rooznam! I would like to order:\n• ${product.title}\n• Price: ${product.priceFormatted}\n• Size: ${selectedSize}\n• Qty: ${quantity}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-[#1faf59] hover:bg-[#19994c] text-white text-sm font-bold transition-colors shadow-xs"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Trust & Care Highlights Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-purple-100 bg-[#faf8fc]/70">
              <div className="flex items-start gap-2.5 text-xs">
                <Truck className="w-4 h-4 text-[#55157e] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">Delivery all over Pakistan</p>
                  <p className="text-gray-500 text-[11px]">Free above Rs. 3,000</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <RotateCcw className="w-4 h-4 text-[#55157e] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">7-Day Exchange</p>
                  <p className="text-gray-500 text-[11px]">Easy age size swaps</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#55157e] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">Cash on Delivery</p>
                  <p className="text-gray-500 text-[11px]">Pay when it arrives</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-purple-100">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                YOU MAY ALSO LIKE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#38035e] mt-1">
                More little styles
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((item, idx) => (
              <ProductCard
                key={item.id}
                product={item}
                index={idx}
                surfaceBg="gray"
                isWishlisted={wishlistIds.includes(item.id)}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onSelectProduct}
                onQuickAdd={(p) => onAddToCart(p, '4-5 Yrs', 1)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close zoom view"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative max-w-xl w-full max-h-[88vh] flex flex-col items-center gap-4">
              <img
                src={currentPhoto.src}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="max-h-[76vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
              {gallery.length > 1 && (
                <div className="flex items-center gap-3">
                  {gallery.map((item, idx) => (
                    <button
                      key={item.src}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-14 h-18 rounded-lg overflow-hidden border-2 cursor-pointer ${
                        idx === activePhotoIndex ? 'border-white scale-105' : 'border-white/30 opacity-70'
                      }`}
                    >
                      <img
                        src={item.src}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
