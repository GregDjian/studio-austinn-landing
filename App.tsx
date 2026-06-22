import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import Header from './components/Header';
import HomePage from './components/HomePage';
import Shop from './components/Shop';
import ProductDetail from './components/ProductDetail';
import ShopSuccess from './components/ShopSuccess';
import ShopCancel from './components/ShopCancel';
import ChatWidget from './components/ChatWidget';
import Preloader from './components/Preloader';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import { CartProvider } from './components/CartContext';
import { Language } from './types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppInner() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleOpenCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <main className={`w-full relative ${lang === 'ar' ? 'font-sans' : ''}`}>
      <div className="bg-noise"></div>

      <ScrollToTop />
      <Preloader onComplete={() => setLoading(false)} lang={lang} />

      <Header lang={lang} setLang={setLang} onCartOpen={() => setCartOpen(true)} />

      <Routes>
        <Route path="/"               element={<HomePage      lang={lang} />} />
        <Route path="/shop"           element={<Shop          lang={lang} />} />
        <Route path="/shop/:slug"     element={<ProductDetail lang={lang} />} />
        <Route path="/shop/success"   element={<ShopSuccess   lang={lang} />} />
        <Route path="/shop/cancel"    element={<ShopCancel    lang={lang} />} />
      </Routes>

      <ChatWidget lang={lang} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lang={lang}
        onCheckout={handleOpenCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        lang={lang}
      />
    </main>
  );
}

function App() {
  return (
    <CartProvider>
      <AppInner />
    </CartProvider>
  );
}

export default App;