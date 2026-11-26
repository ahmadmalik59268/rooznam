import React, { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import {
  buildWhatsAppUrl,
  CATEGORIES,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from '../data/catalog';
import { api } from '../lib/api';
import {
  FacebookIcon,
  InstagramIcon,
  RooznamLogo,
  TikTokIcon,
  WhatsAppIcon,
} from './Icons';

interface WhatsAppAndFooterProps {
  onOpenShopCategory: (categoryId: string | null) => void;
  onOpenCartPage: () => void;
  onOpenCheckoutPage: () => void;
  onOpenAccountTab: (tab: 'track' | 'orders' | 'wishlist') => void;
  onOpenAuth: (tab?: 'login' | 'signup' | 'admin') => void;
  onOpenAdmin: () => void;
  onOpenInfoPage: (pageKey: string) => void;
  onGoHome: () => void;
}

export function WhatsAppAndFooter({
  onOpenShopCategory,
  onOpenCartPage,
  onOpenCheckoutPage,
  onOpenAccountTab,
  onOpenAuth,
  onOpenAdmin,
  onOpenInfoPage,
  onGoHome,
}: WhatsAppAndFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('rooznam_newsletter') === '1';
    } catch {
      return false;
    }
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned) return;
    try {
      await api.subscribeNewsletter(cleaned);
    } catch {
      // gracefully still acknowledge subscription locally
    }
    setSubscribed(true);
    setEmail('');
    try {
      window.localStorage.setItem('rooznam_newsletter', '1');
    } catch {
      // ignore storage errors
    }
  };

  return (
    <>
      {/* WhatsApp Support Banner (Exact dashed cream card from Screenshot 1) */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#fffbf0] border border-dashed border-amber-300/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#38035e] mb-1">
                Need help choosing a size or design?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Send us a message on WhatsApp and we will help you pick the right outfit.
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(
                'Assalam-o-Alaikum Rooznam! I need help choosing a size or design.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#1faf59] hover:bg-[#19994c] text-white text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Chat on WhatsApp</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Dark Purple Newsletter & Support Section */}
      <section className="bg-[#38035e] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Newsletter Form */}
            <div className="lg:col-span-7">
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">Join the Rooznam family</h3>
              <p className="text-xs sm:text-sm text-purple-200 mb-5">
                Be the first to hear about new arrivals, festive collections and special offers.
              </p>

              {subscribed ? (
                <div className="max-w-md flex items-center gap-2.5 bg-white/12 border border-purple-400/30 rounded-lg px-4 py-3 text-xs sm:text-sm text-white">
                  <Check className="w-4 h-4 text-[#25d366] shrink-0" />
                  <span>
                    Welcome to the Rooznam family! You&apos;re on our list for new arrivals.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-md">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address for Rooznam newsletter"
                    className="w-full px-4 py-2.5 rounded-l-md bg-white text-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d91b7e] border-0 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-gray-900 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-r-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Subscribe
                  </button>
                </form>
              )}

              <p className="text-[10px] text-purple-300 mt-2.5">
                By subscribing you agree to our{' '}
                <button
                  type="button"
                  onClick={() => onOpenInfoPage('terms')}
                  className="underline hover:text-white transition-colors cursor-pointer"
                >
                  Terms &amp; Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => onOpenInfoPage('privacy')}
                  className="underline hover:text-white transition-colors cursor-pointer"
                >
                  Privacy &amp; Cookies Policy
                </button>
                .
              </p>
            </div>

            {/* Right: Customer Support Number */}
            <div className="lg:col-span-5 text-left lg:text-right border-t lg:border-t-0 border-purple-800 pt-6 lg:pt-0">
              <p className="text-base sm:text-lg font-bold">Need help?</p>
              <a
                href={buildWhatsAppUrl('Hi Rooznam Support!')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-2xl sm:text-3xl font-black text-white hover:text-pink-200 transition-colors my-1 tabular-nums"
              >
                {WHATSAPP_DISPLAY}
              </a>
              <p className="text-xs text-purple-200">
                WhatsApp or call us. Email:{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="underline hover:text-white transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main White 5-Column Footer (Exact Screenshot 1 Structure) */}
      <footer
        id="footer-info"
        className="bg-white text-gray-600 pt-16 pb-12 border-t border-gray-100 text-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand Summary Column (2 cols on md+) */}
            <div className="col-span-2 space-y-4">
              <button
                type="button"
                onClick={onGoHome}
                className="group cursor-pointer text-left"
                aria-label="Rooznam Home"
              >
                <RooznamLogo variant="footer" />
              </button>
              <p className="font-bold text-gray-900 text-xs">Little Styles, Big Smiles.</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  WhatsApp:{' '}
                  <a
                    href={buildWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#38035e] hover:underline tabular-nums"
                  >
                    {WHATSAPP_DISPLAY}
                  </a>
                </p>
                <p>
                  Email:{' '}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-[#38035e] font-semibold hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>

              {/* Colored Brand Social Icons (Exact match to Screenshot 1) */}
              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenInfoPage('contact')}
                  aria-label="Rooznam on Facebook"
                  className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoPage('contact')}
                  aria-label="Rooznam on Instagram"
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoPage('contact')}
                  aria-label="Rooznam on TikTok"
                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <TikTokIcon className="w-3.5 h-3.5" />
                </button>
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Rooznam on WhatsApp"
                  className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Information Column */}
            <div>
              <h4 className="font-bold text-gray-900 text-xs mb-4">Information</h4>
              <ul className="space-y-2.5 text-gray-600">
                {[
                  { label: 'About Us', key: 'about' },
                  { label: 'Contact Us', key: 'contact' },
                  { label: 'Shipping Policy', key: 'shipping' },
                  { label: 'Exchange & Return Policy', key: 'exchange' },
                  { label: 'Terms & Conditions', key: 'terms' },
                  { label: 'Privacy Policy', key: 'privacy' },
                ].map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => onOpenInfoPage(link.key)}
                      className="hover:text-[#55157e] transition-colors cursor-pointer text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Column */}
            <div>
              <h4 className="font-bold text-gray-900 text-xs mb-4">Account</h4>
              <ul className="space-y-2.5 text-gray-600">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAccountTab('orders')}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    My Account
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAccountTab('orders')}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    My Orders
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAccountTab('track')}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    Track Your Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    Sign In / Sign Up
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="font-semibold text-[#55157e] hover:text-[#d91b7e] transition-colors cursor-pointer"
                  >
                    Admin Dashboard
                  </button>
                </li>
              </ul>
            </div>

            {/* Shop Column (Dedicated column matching Screenshot 1) */}
            <div>
              <h4 className="font-bold text-gray-900 text-xs mb-4">Shop</h4>
              <ul className="space-y-2.5 text-gray-600">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenShopCategory(null)}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenShopCategory('new-arrivals')}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    New Arrivals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenCartPage}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    Cart
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenCheckoutPage}
                    className="hover:text-[#55157e] transition-colors cursor-pointer"
                  >
                    Checkout
                  </button>
                </li>
              </ul>
            </div>

            {/* Categories Column */}
            <div>
              <h4 className="font-bold text-gray-900 text-xs mb-4">Categories</h4>
              <ul className="space-y-2.5 text-gray-600">
                {CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => onOpenShopCategory(category.id)}
                      className="hover:text-[#55157e] transition-colors cursor-pointer text-left"
                    >
                      {category.id === 'customized-suits' ? 'Customized' : category.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright Subfooter */}
          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-3">
            <p>© 2026 Rooznam Kidswear. All rights reserved. Powered by Formonix Marketers.</p>
            <div className="flex items-center space-x-2">
              <span>Secure Online Shopping</span>
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex items-center shadow-2xl rounded-full bg-white pl-3.5 sm:pl-4 pr-1 py-1 border border-gray-100 hover:scale-105 transition-transform duration-200"
      >
        <a
          href={buildWhatsAppUrl(
            'Assalam-o-Alaikum Rooznam! I would like to ask about kids outfits.'
          )}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Rooznam on WhatsApp"
          className="flex items-center"
        >
          <span className="text-xs font-bold text-gray-800 mr-2.5 hidden sm:inline-block">
            Contact us
          </span>
          <span className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
            <WhatsAppIcon className="w-5 h-5" />
          </span>
        </a>
      </motion.div>
    </>
  );
}
