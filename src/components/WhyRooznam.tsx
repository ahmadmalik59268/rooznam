import React from 'react';
import { PackageOpen, Palette, Ruler, Shirt } from 'lucide-react';
import { motion } from 'motion/react';

const FEATURES = [
  {
    icon: Shirt,
    title: 'Soft, child-friendly fabrics',
    description: 'Lawn, cotton, khaddar and wash-and-wear picked for comfort through the day.',
    borderClass: 'border-pink-500',
    iconBgClass: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Palette,
    title: 'Eastern, western and branded',
    description: 'Everyday kurtas, co-ord sets, party wear and branded suits in one place.',
    borderClass: 'border-purple-600',
    iconBgClass: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Ruler,
    title: 'Sizes by age',
    description:
      'Choose the age on every product page. Ready-to-stitch and customized suits are made in your size.',
    borderClass: 'border-blue-600',
    iconBgClass: 'bg-blue-50 text-blue-600',
  },
  {
    icon: PackageOpen,
    title: 'Easy delivery and exchange',
    description: 'Cash on Delivery across Pakistan and a 7-day exchange for eligible items.',
    borderClass: 'border-emerald-500',
    iconBgClass: 'bg-emerald-50 text-emerald-600',
  },
];

export function WhyRooznam() {
  return (
    <section id="why-rooznam" className="py-16 bg-[#faf5fd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
            WHY ROOZNAM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#38035e] mt-2 mb-12 text-balance">
            Shopping that is easy for parents
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -3 }}
                className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border-t-4 ${feature.borderClass} flex flex-col justify-between`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl ${feature.iconBgClass} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
