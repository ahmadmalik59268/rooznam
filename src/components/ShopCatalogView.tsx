import React, { useMemo, useState } from 'react';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { ALL_PRODUCTS, CATEGORIES, ProductItem } from '../data/catalog';
import { ProductCard } from './ProductCard';

interface ShopCatalogViewProps {
  products?: ProductItem[];
  selectedCategoryId: string | null;
  wishlistIds: string[];
  onChangeCategory: (categoryId: string | null) => void;
  onBackHome: () => void;
  onToggleWishlist: (product: ProductItem) => void;
  onQuickView: (product: ProductItem) => void;
  onQuickAdd: (product: ProductItem) => void;
  onOpenCustomStudio: () => void;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc';

const AGE_FILTERS = ['All Ages', '2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs', '6-7 Yrs', '7-8 Yrs'];

export function ShopCatalogView({
  products = ALL_PRODUCTS,
  selectedCategoryId,
  wishlistIds,
  onChangeCategory,
  onBackHome,
  onToggleWishlist,
  onQuickView,
  onQuickAdd,
  onOpenCustomStudio,
}: ShopCatalogViewProps) {
  const [selectedAge, setSelectedAge] = useState<string>('All Ages');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null,
    [selectedCategoryId]
  );

  const isNewArrivalsView = selectedCategoryId === 'new-arrivals';

  const filteredProducts = useMemo(() => {
    let list = isNewArrivalsView
      ? products.filter((p) => p.section === 'new-arrivals')
      : selectedCategoryId
        ? products.filter((p) => p.categoryId === selectedCategoryId)
        : products;

    if (selectedAge !== 'All Ages') {
      list = list.filter((p) => p.sizes.includes(selectedAge));
    }

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, selectedCategoryId, isNewArrivalsView, selectedAge, sortBy]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#faf8fc] min-h-[75vh] pb-20"
    >
      {/* Top Collection Header */}
      <div className="bg-gradient-to-r from-[#fbf5fd] via-[#f7eefc] to-[#f4e8fa] border-b border-purple-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55157e] hover:text-[#d91b7e] transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                {isNewArrivalsView ? 'JUST LANDED' : 'ROOZNAM COLLECTION'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#38035e] mt-1">
                {isNewArrivalsView
                  ? 'New Arrivals'
                  : activeCategory
                    ? activeCategory.title
                    : 'All Kids Outfits'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
                {isNewArrivalsView
                  ? 'Our freshest eastern khaddar suits, branded boys wear, and everyday kidswear just landed.'
                  : activeCategory
                    ? activeCategory.description
                    : 'Explore eastern wear, western co-ords, branded ready-to-wear, and custom-stitched celebration suits for ages 2 to 8.'}
              </p>
            </div>

            {selectedCategoryId === 'customized-suits' && (
              <button
                type="button"
                onClick={onOpenCustomStudio}
                className="self-start md:self-auto px-6 py-2.5 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs font-bold shadow-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Request Custom Measurements
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Filter Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap items-center gap-2 pb-5 border-b border-purple-100">
          <button
            type="button"
            onClick={() => onChangeCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryId === null
                ? 'bg-[#38035e] text-white shadow-sm'
                : 'bg-white text-gray-700 border border-purple-100 hover:border-[#55157e] hover:text-[#55157e]'
            }`}
          >
            All Outfits ({products.length})
          </button>
          {CATEGORIES.map((category) => {
            const active = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChangeCategory(category.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#38035e] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-purple-100 hover:border-[#55157e] hover:text-[#55157e]'
                }`}
              >
                {category.title}
              </button>
            );
          })}
        </div>

        {/* Age Size + Sort Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#55157e]" />
              Age:
            </span>
            {AGE_FILTERS.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => setSelectedAge(age)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedAge === age
                    ? 'bg-[#d91b7e] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#d91b7e] hover:text-[#d91b7e]'
                }`}
              >
                {age}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-gray-500 tabular-nums">
              Showing <strong className="text-[#38035e]">{filteredProducts.length}</strong> outfits
            </span>
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3.5 py-2 rounded-xl bg-white border border-purple-100 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#55157e]/30 cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-xs my-6">
            <h3 className="text-lg font-extrabold text-[#38035e]">No outfits match that filter</h3>
            <p className="text-xs text-gray-500 mt-1.5">
              Try resetting your age or category filter to view all available styles.
            </p>
            <button
              type="button"
              onClick={() => {
                onChangeCategory(null);
                setSelectedAge('All Ages');
              }}
              className="mt-5 px-6 py-2.5 rounded-full bg-[#520d75] text-white text-xs font-bold cursor-pointer"
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                surfaceBg="white"
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onQuickView}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
