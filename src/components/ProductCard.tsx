import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductItem } from '../data/catalog';
import { SmartImage } from './SmartImage';

interface ProductCardProps {
  product: ProductItem;
  isWishlisted: boolean;
  onToggleWishlist: (product: ProductItem) => void;
  onQuickView: (product: ProductItem) => void;
  onQuickAdd: (product: ProductItem) => void;
  surfaceBg?: 'white' | 'gray';
  index?: number;
}

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onQuickAdd,
  surfaceBg = 'white',
  index = 0,
}: ProductCardProps) {
  const hasBackImage = Boolean(product.backImage && product.backImage !== product.image);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.45,
        delay: (index % 4) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group flex flex-col text-left"
    >
      <div
        className={`relative ${
          surfaceBg === 'white' ? 'bg-white' : 'bg-gray-50'
        } rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300 w-full aspect-[3/4] mb-3`}
      >
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`View ${product.title}`}
          className="relative block w-full h-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[#55157e]"
        >
          {/* Base Front Photo Layer (Always visible underneath so never flashes blank) */}
          <div className="absolute inset-0 w-full h-full">
            <SmartImage
              src={product.image}
              alt={product.title}
              className={`w-full h-full object-cover object-top transition-transform duration-500 ease-out ${
                hasBackImage ? 'group-hover:scale-[1.03]' : 'card-zoom-img'
              }`}
            />
          </div>

          {/* Matching Back Photo Layer (Fades smoothly over front on hover) */}
          {hasBackImage && product.backImage && (
            <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
              <SmartImage
                src={product.backImage}
                alt={`${product.title} back view`}
                priority
                className="w-full h-full object-cover object-top transition-transform duration-500 ease-out scale-[1.02] group-hover:scale-100"
              />
            </div>
          )}
        </button>

        {/* Wishlist Toggle Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          aria-label={
            isWishlisted
              ? `Remove ${product.title} from wishlist`
              : `Add ${product.title} to wishlist`
          }
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer ${
            isWishlisted
              ? 'bg-white text-[#d91b7e] scale-105'
              : 'bg-white/85 hover:bg-white text-gray-500 hover:text-[#d91b7e]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#d91b7e]' : ''}`} />
        </button>

        {/* Subtle Hover Quick Add Action */}
        <div className="absolute inset-x-2.5 sm:inset-x-3 bottom-2.5 sm:bottom-3 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="w-full py-2 px-3 rounded-full bg-[#38035e]/92 hover:bg-[#520d75] text-white text-[11px] font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-md backdrop-blur-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to bag</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="text-left text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.4rem] hover:text-[#55157e] transition-colors cursor-pointer leading-snug"
      >
        {product.title}
      </button>
      <p className="text-xs sm:text-sm font-bold text-[#55157e] mt-1 tabular-nums">
        {product.priceFormatted}
      </p>
    </motion.article>
  );
}
