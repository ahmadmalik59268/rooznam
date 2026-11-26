import React from 'react';
import { motion } from 'motion/react';
import { CUSTOMIZED_BANNER_IMAGE } from '../data/catalog';
import { SmartImage } from './SmartImage';

interface CustomizedBannerProps {
  onExplore: () => void;
}

export function CustomizedBanner({ onExplore }: CustomizedBannerProps) {
  return (
    <section id="customized" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12 group"
        >
          {/* Left: Purple Gradient Promotional Content */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#490c6d] via-[#53117c] to-[#38035e] p-8 sm:p-12 lg:p-14 flex flex-col justify-center text-left text-white">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-pink-300 mb-3">
              MADE FOR CELEBRATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold leading-[1.12] tracking-tight mb-4 text-balance">
              Customized suits, stitched in your child&apos;s size
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/95 max-w-lg leading-relaxed mb-8">
              Pick a design with cutwork or Sindhi embroidery, choose the age size and we will
              stitch it for you. Message us on WhatsApp for custom colours or measurements.
            </p>
            <div>
              <button
                type="button"
                onClick={onExplore}
                className="inline-block px-7 py-3 rounded-full bg-white text-[#490c6d] hover:bg-purple-50 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 shadow-md cursor-pointer"
              >
                Explore customized suits
              </button>
            </div>
          </div>

          {/* Right: Editorial Festive Photography */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[440px] bg-[#38035e] overflow-hidden">
            <SmartImage
              src={CUSTOMIZED_BANNER_IMAGE}
              alt="Child wearing customized embroidered festive suit"
              className="w-full h-full object-cover object-top card-zoom-img"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
