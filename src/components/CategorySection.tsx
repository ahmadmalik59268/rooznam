import React from 'react';
import { motion } from 'motion/react';
import { CATEGORIES, CategoryItem } from '../data/catalog';
import { SmartImage } from './SmartImage';

interface CategorySectionProps {
  activeCategoryId: string | null;
  onSelectCategory: (category: CategoryItem) => void;
}

export function CategorySection({
  activeCategoryId,
  onSelectCategory,
}: CategorySectionProps) {
  const row1 = CATEGORIES.filter((c) => c.row === 1);
  const row2 = CATEGORIES.filter((c) => c.row === 2);

  return (
    <section id="categories" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
            SHOP BY CATEGORY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#38035e] mt-2 mb-3 text-balance">
            Find the perfect outfit
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">
            From everyday eastern wear to festive branded suits, everything is picked for comfort
            and for little smiles.
          </p>
        </motion.div>

        {/* Row 1: 4 Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          {row1.map((category, index) => {
            const isSelected = activeCategoryId === category.id;
            return (
              <motion.button
                key={category.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => onSelectCategory(category)}
                className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl w-full h-[215px] sm:h-[310px] lg:h-[340px] bg-gray-100 cursor-pointer text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#55157e] ${
                  isSelected ? 'ring-3 ring-[#d91b7e] ring-offset-2' : ''
                }`}
              >
                <SmartImage
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover object-top card-zoom-img"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#38035e]/90 via-[#38035e]/25 to-transparent flex flex-col justify-end p-3.5 sm:p-5">
                  <h3 className="text-white font-bold text-xs sm:text-base leading-snug">
                    {category.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-purple-200 font-medium mt-0.5">
                    {category.countLabel}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Row 2: 3 Wider Category Cards (Exact same height as Row 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          {row2.map((category, index) => {
            const isSelected = activeCategoryId === category.id;
            return (
              <motion.button
                key={category.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => onSelectCategory(category)}
                className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl w-full h-[250px] sm:h-[310px] lg:h-[340px] bg-gray-100 cursor-pointer text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#55157e] ${
                  isSelected ? 'ring-3 ring-[#d91b7e] ring-offset-2' : ''
                }`}
              >
                <SmartImage
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover object-top card-zoom-img"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#38035e]/90 via-[#38035e]/30 to-transparent flex flex-col justify-end p-5">
                  <h3 className="text-white font-bold text-base sm:text-lg leading-snug">
                    {category.title}
                  </h3>
                  <p className="text-xs text-purple-200 font-medium mt-0.5">
                    {category.countLabel}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
