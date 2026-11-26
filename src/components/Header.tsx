import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CATEGORIES, formatPKR } from '../data/catalog';
import type { AuthUser } from '../lib/api';
import { RooznamLogo } from './Icons';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  currentUser: AuthUser | null;
  onGoHome: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenAuth: (tab?: 'login' | 'signup' | 'admin') => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenShopCategory: (categoryId: string | null) => void;
  onOpenInfoPage: (pageKey: string) => void;
}

const NAV_DROPDOWNS = {
  shop: [
    { label: 'All Products', categoryId: null },
    { label: 'New Arrivals', categoryId: 'new-arrivals' },
    { label: 'Branded Ready To Wear', categoryId: 'branded-rtw' },
    { label: 'Branded Ready To Stitch', categoryId: 'branded-rts' },
    { label: 'Customized Suits', categoryId: 'customized-suits' },
  ],
  girls: CATEGORIES.filter((c) => c.group === 'girls').map((c) => ({
    label: c.title,
    categoryId: c.id,
  })),
  boys: CATEGORIES.filter((c) => c.group === 'boys').map((c) => ({
    label: c.title,
    categoryId: c.id,
  })),
};

export function Header({
  cartCount,
  cartTotal,
  wishlistCount,
  currentUser,
  onGoHome,
  onOpenSearch,
  onOpenCart,
  onOpenAccount,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  onOpenShopCategory,
  onOpenInfoPage,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<'shop' | 'girls' | 'boys' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<'shop' | 'girls' | 'boys' | null>(
    null
  );
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (categoryId: string | null) => {
    setOpenMenu(null);
    setSidebarOpen(false);
    onOpenShopCategory(categoryId);
  };

  const handleHomeClick = () => {
    setOpenMenu(null);
    setSidebarOpen(false);
    onGoHome();
  };

  const handleInfoSelect = (pageKey: string) => {
    setOpenMenu(null);
    setSidebarOpen(false);
    onOpenInfoPage(pageKey);
  };

  return (
    <>
      {/* Top Announcement Strip */}
      <div className="bg-[#3c0764] text-white text-[11px] md:text-xs py-2 px-4 tracking-wider font-semibold text-center uppercase">
        FREE DELIVERY ON ORDERS ABOVE RS. 3,000
      </div>

      {/* Main Sticky Header */}
      <header className="bg-white/98 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 grid grid-cols-3 items-center">
          {/* Left: Always-Visible Sidebar Hamburger Button + Desktop Navigation */}
          <div className="flex items-center gap-2 sm:gap-5" ref={navRef}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Rooznam menu"
              className="p-2 -ml-1 sm:-ml-2 text-gray-800 hover:text-[#55157e] hover:bg-[#faf5fd] transition-colors rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-[#55157e]"
            >
              <Menu className="w-5 h-5 stroke-[1.9]" />
            </button>

            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center space-x-5 lg:space-x-6 text-xs font-bold uppercase tracking-wider text-gray-800"
            >
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeClick();
                }}
                className="hover:text-[#55157e] transition-colors whitespace-nowrap shrink-0 py-2"
              >
                HOME
              </a>

              {(['shop', 'girls', 'boys'] as const).map((key) => {
                const isOpen = openMenu === key;
                return (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(key)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenu(isOpen ? null : key)}
                      aria-expanded={isOpen}
                      className="flex items-center gap-1 hover:text-[#55157e] transition-colors uppercase whitespace-nowrap shrink-0 py-2 cursor-pointer"
                    >
                      <span>{key}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#55157e]' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-0 top-full pt-1.5 w-56 z-50"
                        >
                          <div className="bg-white rounded-xl shadow-xl border border-purple-100/80 py-2 overflow-hidden">
                            {NAV_DROPDOWNS[key].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => handleCategorySelect(item.categoryId)}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold normal-case tracking-normal text-gray-700 hover:bg-[#faf5fd] hover:text-[#55157e] transition-colors cursor-pointer"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Center: Brand Logo */}
          <div className="flex justify-center">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                handleHomeClick();
              }}
              className="group focus-visible:outline-2 focus-visible:outline-[#55157e] rounded-lg px-2 py-1"
              aria-label="Rooznam Home"
            >
              <RooznamLogo size="md" />
            </a>
          </div>

          {/* Right: Action Icons (Admin chip when admin, Account, Search, Shopping Bag) */}
          <div className="flex items-center justify-end space-x-2.5 sm:space-x-4 text-gray-700">
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#38035e] hover:bg-[#520d75] text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={currentUser ? onOpenAccount : () => onOpenAuth('login')}
              aria-label={
                currentUser
                  ? `${currentUser.name} account and orders`
                  : 'Sign in or create account'
              }
              title={currentUser ? `${currentUser.name} (${currentUser.role})` : 'Sign in / Sign up'}
              className="relative p-1.5 hover:text-[#55157e] transition-colors cursor-pointer rounded-full hover:bg-[#faf5fd]"
            >
              <User className="w-[18px] h-[18px] sm:w-5 sm:h-5 stroke-[1.8]" />
              {currentUser ? (
                <span
                  aria-label="Signed in"
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
                />
              ) : wishlistCount > 0 ? (
                <span
                  aria-label={`${wishlistCount} saved outfits`}
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#d91b7e]"
                />
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search products"
              className="p-1.5 hover:text-[#55157e] transition-colors cursor-pointer rounded-full hover:bg-[#faf5fd]"
            >
              <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 stroke-[1.9]" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Shopping bag, ${cartCount} items, ${formatPKR(cartTotal)}`}
              className="flex items-center space-x-1.5 text-xs font-semibold text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer py-1 pl-1"
            >
              <span className="hidden sm:inline tabular-nums whitespace-nowrap">
                {formatPKR(cartTotal)}
              </span>
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-gray-700 stroke-[1.9]" />
                <span className="absolute -top-1.5 -right-2 bg-[#38035e] text-white rounded-full text-[10px] min-w-[17px] h-[17px] px-1 flex items-center justify-center font-bold tabular-nums">
                  {cartCount}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop + Mobile Slide-Out Sidebar Navigation Drawer (Matches Uploaded Screenshots 3 & 4) */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[310px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5">
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="group cursor-pointer text-left"
                  aria-label="Rooznam Home"
                >
                  <RooznamLogo size="sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Drawer Scrollable Menu */}
              <div className="flex-1 overflow-y-auto px-6 pb-8">
                {/* Main Menu Section */}
                <div className="pb-5">
                  <p className="text-xs font-extrabold text-gray-900 mb-3">Main Menu</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handleHomeClick}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Home
                    </button>

                    {(
                      [
                        { key: 'shop', label: 'Shop' },
                        { key: 'girls', label: 'Girls' },
                        { key: 'boys', label: 'Boys' },
                      ] as const
                    ).map(({ key, label }) => {
                      const isExpanded = expandedAccordion === key;
                      return (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => setExpandedAccordion(isExpanded ? null : key)}
                            aria-expanded={isExpanded}
                            className="w-full flex items-center justify-between py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                          >
                            <span>{label}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-[#55157e]' : ''
                              }`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden pl-3 border-l border-purple-100 ml-1 mb-1"
                              >
                                {NAV_DROPDOWNS[key].map((item) => (
                                  <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => handleCategorySelect(item.categoryId)}
                                    className="w-full text-left py-2 text-[13px] text-gray-600 hover:text-[#55157e] transition-colors cursor-pointer"
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-2" />

                {/* Categories Section (Exact list from Screenshots 3 & 4) */}
                <div className="pt-4">
                  <p className="text-xs font-extrabold text-gray-900 mb-3">Categories</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('new-arrivals')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      New Arrivals
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('girls-eastern')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Girls Eastern Wear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('girls-western')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Girls Western Wear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('boys-eastern')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Boys Eastern Wear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('boys-western')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Boys Western Wear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('branded-rtw')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Branded Ready To Wear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('branded-rts')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Branded Ready To Stitch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('customized-suits')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Customized
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInfoSelect('about')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      About Us
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInfoSelect('contact')}
                      className="w-full text-left py-2.5 text-[14px] font-medium text-gray-800 hover:text-[#55157e] transition-colors cursor-pointer"
                    >
                      Contact Us
                    </button>
                  </div>
                </div>

                {/* Account & Admin Portal Section */}
                <div className="border-t border-gray-100 mt-5 pt-5 space-y-2">
                  <p className="text-xs font-extrabold text-gray-900 mb-2">Account &amp; Portal</p>
                  {currentUser ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-[#faf5fd] border border-purple-100">
                        <p className="text-xs font-extrabold text-[#38035e] truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full flex items-center gap-2 py-2 text-[13px] font-semibold text-gray-800 hover:text-[#55157e] cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#55157e]" />
                        <span>My Account &amp; Orders</span>
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSidebarOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-[#38035e] text-white text-xs font-bold cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Open Admin Dashboard</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 py-2 text-[13px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          onOpenAuth('login');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#520d75] hover:bg-[#3f095c] text-white text-xs font-bold cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In / Sign Up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          onOpenAuth('admin');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#38035e] text-[#38035e] hover:bg-[#faf5fd] text-xs font-bold cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
