/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ALL_PRODUCTS,
  CategoryItem,
  PlacedOrder,
  ProductItem,
} from './data/catalog';
import { api, AuthUser, setAuthToken } from './lib/api';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CategorySection } from './components/CategorySection';
import { ProductCard } from './components/ProductCard';
import { CustomizedBanner } from './components/CustomizedBanner';
import { WhyRooznam } from './components/WhyRooznam';
import { WhatsAppAndFooter } from './components/WhatsAppAndFooter';
import { ShopCatalogView } from './components/ShopCatalogView';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartPage, CheckoutPage } from './components/CartAndCheckoutPages';
import { AccountPage, CustomizedSuitsPage, InfoPage } from './components/AccountAndInfoPages';
import { CartDrawer, CartEntry, SearchModal } from './components/StoreOverlays';
import { AuthPage, AuthTab } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';

type PageView =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'customized'
  | 'account'
  | 'info'
  | 'auth'
  | 'admin';

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [view, setView] = useState<PageView>('home');
  const [previousView, setPreviousView] = useState<'home' | 'shop'>('home');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [accountTab, setAccountTab] = useState<'track' | 'orders' | 'wishlist'>('track');
  const [trackOrderId, setTrackOrderId] = useState('');
  const [infoPageKey, setInfoPageKey] = useState('about');
  const [authTab, setAuthTab] = useState<AuthTab>('login');

  // Auth user held strictly in React state (token lives only in memory in src/lib/api.ts)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Live storefront catalog synchronized with SQLite backend
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(ALL_PRODUCTS);

  const [cart, setCart] = useState<CartEntry[]>(() => loadStored('rooznam_cart_v1', []));
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    loadStored('rooznam_wishlist_v1', [])
  );
  const [orders, setOrders] = useState<PlacedOrder[]>(() => loadStored('rooznam_orders_v1', []));

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLiveCatalog = useCallback(async () => {
    try {
      const { products } = await api.getProducts();
      if (Array.isArray(products) && products.length > 0) {
        setCatalogProducts(products);
      }
    } catch {
      // Keep bundled catalog as fallback if server is restarting
    }
  }, []);

  useEffect(() => {
    fetchLiveCatalog();
  }, [fetchLiveCatalog]);

  useEffect(() => {
    try {
      window.localStorage.setItem('rooznam_cart_v1', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem('rooznam_wishlist_v1', JSON.stringify(wishlistIds));
    } catch {
      // ignore storage errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem('rooznam_orders_v1', JSON.stringify(orders));
    } catch {
      // ignore storage errors
    }
  }, [orders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const homeNewArrivals = useMemo(
    () => catalogProducts.filter((p) => p.section === 'new-arrivals').slice(0, 8),
    [catalogProducts]
  );

  const homeBrandedRTW = useMemo(
    () => catalogProducts.filter((p) => p.section === 'branded-ready-to-wear').slice(0, 4),
    [catalogProducts]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0),
    [cart]
  );

  const wishlistedProducts = useMemo(
    () => catalogProducts.filter((p) => wishlistIds.includes(p.id)),
    [catalogProducts, wishlistIds]
  );

  const navigateHome = () => {
    setView('home');
    setActiveCategoryId(null);
    scrollToTop();
  };

  const navigateShopCategory = (categoryId: string | null) => {
    if (categoryId === 'customized-suits') {
      setView('customized');
      scrollToTop();
      return;
    }
    setActiveCategoryId(categoryId);
    setView('shop');
    scrollToTop();
  };

  const navigateProduct = (product: ProductItem) => {
    if (view === 'home' || view === 'shop') {
      setPreviousView(view);
    }
    setSelectedProduct(product);
    setView('product');
    scrollToTop();
  };

  const navigateCartPage = () => {
    setCartDrawerOpen(false);
    setView('cart');
    scrollToTop();
  };

  const navigateCheckoutPage = () => {
    setCartDrawerOpen(false);
    setView('checkout');
    scrollToTop();
  };

  const navigateAccountPage = (tab: 'track' | 'orders' | 'wishlist' = 'orders', orderId = '') => {
    setAccountTab(tab);
    setTrackOrderId(orderId);
    setView('account');
    scrollToTop();
  };

  const navigateAuthPage = (tab: AuthTab = 'login') => {
    setAuthTab(tab);
    setView('auth');
    scrollToTop();
  };

  const navigateAdminDashboard = () => {
    if (currentUser?.role === 'admin') {
      setView('admin');
      scrollToTop();
    } else {
      navigateAuthPage('admin');
    }
  };

  const navigateInfoPage = (pageKey: string) => {
    setInfoPageKey(pageKey);
    setView('info');
    scrollToTop();
  };

  const handleAuthSuccess = async (
    user: AuthUser,
    token: string,
    redirectToAdmin = false
  ) => {
    setAuthToken(token);
    setCurrentUser(user);
    showToast(`Welcome, ${user.name}!`);

    try {
      const { orders: myOrders } = await api.getMyOrders();
      if (myOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, PlacedOrder>();
          myOrders.forEach((o) => map.set(o.orderId, o));
          prev.forEach((o) => {
            if (!map.has(o.orderId)) map.set(o.orderId, o);
          });
          return Array.from(map.values());
        });
      }
    } catch {
      // ignore if passcode admin has no customer orders
    }

    if (redirectToAdmin && user.role === 'admin') {
      setView('admin');
    } else {
      setAccountTab('orders');
      setView('account');
    }
    scrollToTop();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    }
    setAuthToken(null);
    setCurrentUser(null);
    showToast('Signed out successfully');
    if (view === 'admin') {
      setView('home');
    }
    scrollToTop();
  };

  const handleToggleWishlist = (product: ProductItem) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        showToast('Removed from saved outfits');
        return prev.filter((id) => id !== product.id);
      }
      showToast('Saved to wishlist');
      return [...prev, product.id];
    });
  };

  const handleAddToCart = (product: ProductItem, size = '4-5 Yrs', qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id && item.size === size);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { product, size, quantity: qty }];
    });
    showToast(`Added "${product.title.split('|')[0].trim()}" to bag`);
  };

  const handleBuyNow = (product: ProductItem, size: string, qty: number) => {
    handleAddToCart(product, size, qty);
    navigateCheckoutPage();
  };

  const handleUpdateQty = (productId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.product.id === productId && entry.size === size
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((entry) => !(entry.product.id === productId && entry.size === size))
    );
  };

  const handleOrderConfirmed = (order: PlacedOrder) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    showToast(`Order ${order.orderId} confirmed!`);
  };

  const handleCategoryCardClick = (category: CategoryItem) => {
    navigateShopCategory(category.id);
  };

  // Dedicated full-screen Admin Dashboard mode
  if (view === 'admin' && currentUser?.role === 'admin') {
    return (
      <MotionConfig reducedMotion="user">
        <AdminDashboard
          currentUser={currentUser}
          onExitToStore={navigateHome}
          onLogout={handleLogout}
          onCatalogMutated={fetchLiveCatalog}
          onNotify={showToast}
        />
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 left-6 z-50 bg-[#38035e] text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold"
              role="status"
              aria-live="polite"
            >
              <Check className="w-3.5 h-3.5 text-[#25d366]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white text-gray-800 antialiased flex flex-col">
        <Header
          cartCount={cartCount}
          cartTotal={cartTotal}
          wishlistCount={wishlistIds.length}
          currentUser={currentUser}
          onGoHome={navigateHome}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenCart={() => setCartDrawerOpen(true)}
          onOpenAccount={() => navigateAccountPage('orders')}
          onOpenAuth={navigateAuthPage}
          onOpenAdmin={navigateAdminDashboard}
          onLogout={handleLogout}
          onOpenShopCategory={navigateShopCategory}
          onOpenInfoPage={navigateInfoPage}
        />

        <main className="flex-1">
          {view === 'home' && (
            <>
              {/* Hero Banner + Deep Purple Trust Strip */}
              <HeroSection onShopNow={() => navigateShopCategory('new-arrivals')} />

              {/* Shop by Category (4 + 3 Grid) */}
              <CategorySection
                activeCategoryId={activeCategoryId}
                onSelectCategory={handleCategoryCardClick}
              />

              {/* New Arrivals Section */}
              <section id="new-arrivals" className="py-14 bg-[#faf8fc] border-t border-purple-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                        JUST LANDED
                      </span>
                      <h2 className="text-3xl font-extrabold text-[#38035e] mt-1">New arrivals</h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateShopCategory(null)}
                      className="text-xs sm:text-sm font-bold text-[#55157e] hover:text-[#d91b7e] transition-colors underline underline-offset-4 cursor-pointer"
                    >
                      View all products
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {homeNewArrivals.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        surfaceBg="white"
                        isWishlisted={wishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickView={navigateProduct}
                        onQuickAdd={(p) => handleAddToCart(p)}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Customized Suits Horizontal Banner */}
              <CustomizedBanner
                onExplore={() => {
                  setView('customized');
                  scrollToTop();
                }}
              />

              {/* Branded Ready To Wear Section */}
              <section id="branded" className="py-14 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-end justify-between gap-4 mb-8">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d91b7e]">
                        FESTIVE FAVOURITES
                      </span>
                      <h2 className="text-3xl font-extrabold text-[#38035e] mt-1">
                        Branded ready to wear
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateShopCategory('branded-rtw')}
                      className="text-xs sm:text-sm font-bold text-[#55157e] hover:text-[#d91b7e] transition-colors underline underline-offset-4 cursor-pointer whitespace-nowrap"
                    >
                      See the collection
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {homeBrandedRTW.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        surfaceBg="gray"
                        isWishlisted={wishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickView={navigateProduct}
                        onQuickAdd={(p) => handleAddToCart(p)}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Why Rooznam Section */}
              <WhyRooznam />
            </>
          )}

          {view === 'shop' && (
            <ShopCatalogView
              products={catalogProducts}
              selectedCategoryId={activeCategoryId}
              wishlistIds={wishlistIds}
              onChangeCategory={(catId) => setActiveCategoryId(catId)}
              onBackHome={navigateHome}
              onToggleWishlist={handleToggleWishlist}
              onQuickView={navigateProduct}
              onQuickAdd={(p) => handleAddToCart(p)}
              onOpenCustomStudio={() => {
                setView('customized');
                scrollToTop();
              }}
            />
          )}

          {view === 'product' && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              products={catalogProducts}
              wishlistIds={wishlistIds}
              onBack={() => {
                setView(previousView);
                scrollToTop();
              }}
              onSelectCategory={(catId) => navigateShopCategory(catId)}
              onSelectProduct={navigateProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          {view === 'cart' && (
            <CartPage
              items={cart}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemoveFromCart}
              onContinueShopping={() => navigateShopCategory(null)}
              onProceedToCheckout={navigateCheckoutPage}
            />
          )}

          {view === 'checkout' && (
            <CheckoutPage
              items={cart}
              currentUser={currentUser}
              onBackToCart={navigateCartPage}
              onContinueShopping={() => navigateShopCategory(null)}
              onOrderConfirmed={handleOrderConfirmed}
              onTrackOrder={(orderId) => navigateAccountPage('track', orderId)}
            />
          )}

          {view === 'customized' && (
            <CustomizedSuitsPage
              onBackHome={navigateHome}
              onAddCustomToBag={(customProduct, size) => {
                handleAddToCart(customProduct, size, 1);
                navigateCartPage();
              }}
            />
          )}

          {view === 'account' && (
            <AccountPage
              currentUser={currentUser}
              orders={orders}
              wishlistedProducts={wishlistedProducts}
              initialTab={accountTab}
              initialOrderId={trackOrderId}
              onBackHome={navigateHome}
              onSelectProduct={navigateProduct}
              onMoveWishlistToBag={(product) => {
                handleAddToCart(product, '4-5 Yrs', 1);
                navigateCartPage();
              }}
              onRemoveWishlist={handleToggleWishlist}
              onOpenAuth={navigateAuthPage}
              onOpenAdmin={navigateAdminDashboard}
              onLogout={handleLogout}
              onUserUpdated={(u) => {
                setCurrentUser(u);
                showToast('Profile saved!');
              }}
            />
          )}

          {view === 'auth' && (
            <AuthPage
              initialTab={authTab}
              onAuthSuccess={handleAuthSuccess}
              onBackHome={navigateHome}
              onOpenInfoPage={navigateInfoPage}
            />
          )}

          {view === 'info' && (
            <InfoPage
              pageKey={infoPageKey}
              onBackHome={navigateHome}
              onNavigateShop={() => navigateShopCategory(null)}
            />
          )}

          {/* Persistent Rooznam WhatsApp Banner, Newsletter & 5-Column Footer */}
          <WhatsAppAndFooter
            onOpenShopCategory={navigateShopCategory}
            onOpenCartPage={navigateCartPage}
            onOpenCheckoutPage={navigateCheckoutPage}
            onOpenAccountTab={(tab) => navigateAccountPage(tab)}
            onOpenAuth={navigateAuthPage}
            onOpenAdmin={navigateAdminDashboard}
            onOpenInfoPage={navigateInfoPage}
            onGoHome={navigateHome}
          />
        </main>

        {/* Quick Cart Drawer */}
        <CartDrawer
          open={cartDrawerOpen}
          items={cart}
          onClose={() => setCartDrawerOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemove={handleRemoveFromCart}
          onProceedToCheckout={navigateCheckoutPage}
          onViewFullCart={navigateCartPage}
        />

        {/* Instant Search Modal */}
        <SearchModal
          open={searchOpen}
          products={catalogProducts}
          onClose={() => setSearchOpen(false)}
          onSelectProduct={navigateProduct}
        />

        {/* Subtle Action Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 left-6 z-40 bg-[#38035e] text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold"
              role="status"
              aria-live="polite"
            >
              <Check className="w-3.5 h-3.5 text-[#25d366]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
