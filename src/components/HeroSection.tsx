import React from 'react';
import { RotateCcw, Truck, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { buildWhatsAppUrl, HERO_IMAGES, WHATSAPP_DISPLAY } from '../data/catalog';
import { WhatsAppIcon } from './Icons';
import { SmartImage } from './SmartImage';

interface HeroSectionProps {
  onShopNow: () => void;
}

const TRUST_BENEFITS = [
  {
    icon: Truck,
    title: 'Free delivery',
    subtitle: 'On orders above Rs. 3,000',
  },
  {
    icon: Wallet,
    title: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
  },
  {
    icon: RotateCcw,
    title: '7-day exchange',
    subtitle: 'For eligible items',
  },
];

export function HeroSection({ onShopNow }: HeroSectionProps) {
  return (
    <>
      <section
        id="top"
        className="bg-gradient-to-r from-[#fdfbf8] via-[#f9f2fc] to-[#f4e6fa] pt-10 sm:pt-14 pb-14 sm:pb-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-5 sm:space-y-6"
            >
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                NEW COLLECTION · KIDSWEAR
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-[#38035e] tracking-tight leading-[1.08] text-balance">
                Little Styles,
                <br />
                <span className="text-[#d91b7e]">Big Smiles.</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-lg leading-relaxed">
                Eastern wear, western wear, branded suits and customized outfits for girls and boys.
                Soft fabrics, happy colours and doorstep delivery all over Pakistan.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1">
                <button
                  type="button"
                  onClick={onShopNow}
                  className="px-7 py-3 rounded-full bg-[#520d75] hover:bg-[#3f095c] text-white text-xs sm:text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  Shop new arrivals
                </button>
                <a
                  href={buildWhatsAppUrl('Assalam-o-Alaikum Rooznam! I would like to place an order.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full border border-[#520d75] text-[#520d75] hover:bg-[#520d75] hover:text-white text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Order on WhatsApp
                </a>
              </div>

              {/* Service Highlights below CTAs */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-medium text-gray-600">
                <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-purple-100/80 shadow-xs">
                  Cash on Delivery
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-purple-100/80 shadow-xs">
                  Free delivery above Rs. 3,000
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-purple-100/80 shadow-xs">
                  7-day exchange
                </span>
              </div>
            </motion.div>

            {/* Hero Right Editorial Collage (Exact tilted equal-size style from reference) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative flex justify-center lg:justify-end items-center py-4 lg:py-2"
            >
              <div className="relative grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-[540px] items-start">
                {/* Left Gently Tilted Portrait Card */}
                <div className="relative w-full aspect-[3/4] rounded-[24px] -rotate-2 hover:-rotate-1 hover:-translate-y-1 transition-transform duration-300 ease-out overflow-hidden shadow-[0_22px_50px_rgba(56,3,94,0.14)] bg-[#f7f2fa]">
                  <SmartImage
                    src={HERO_IMAGES.leftArch}
                    alt="Girls Eastern and Western Kidswear"
                    priority
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Right Gently Tilted Portrait Card (Equal size, stylish editorial step) */}
                <div className="relative w-full aspect-[3/4] rounded-[24px] rotate-2 hover:rotate-1 hover:-translate-y-1 transition-transform duration-300 ease-out overflow-hidden shadow-[0_22px_50px_rgba(56,3,94,0.14)] bg-[#f7f2fa] mt-8 sm:mt-11">
                  <SmartImage
                    src={HERO_IMAGES.rightArch}
                    alt="Boys Traditional and Casual Kidswear"
                    priority
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Overlapping Circular Pink Promotional Badge */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] rounded-full bg-[#d91b7e] text-white flex flex-col items-center justify-center font-bold shadow-[0_14px_30px_rgba(217,27,126,0.38)] border-[3px] border-white text-center leading-tight select-none"
                >
                  <span className="text-[11px] sm:text-xs font-semibold opacity-95">Ages</span>
                  <span className="text-sm sm:text-base font-extrabold tracking-tight">2 to 8</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deep Purple Trust Strip Ribbon */}
      <section className="bg-[#38035e] text-white py-4 border-y border-[#4a087a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {TRUST_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex items-center space-x-3">
                  <div className="text-purple-300 shrink-0">
                    <Icon className="w-5 h-5 stroke-[1.9]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold leading-tight truncate">
                      {benefit.title}
                    </p>
                    <p className="text-[11px] text-purple-200 truncate">{benefit.subtitle}</p>
                  </div>
                </div>
              );
            })}

            <a
              href={buildWhatsAppUrl('Hi Rooznam! I need support with my order.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 group"
            >
              <div className="text-purple-300 group-hover:text-[#25d366] transition-colors shrink-0">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold leading-tight truncate">
                  WhatsApp support
                </p>
                <p className="text-[11px] text-purple-200 group-hover:text-white transition-colors tabular-nums truncate">
                  {WHATSAPP_DISPLAY}
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
