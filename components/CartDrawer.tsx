import React from "react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Language } from "../types";
import { useCart, isLooseLinkItem } from "./CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
  onCheckout: () => void;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      title: "سلة التسوق",
      empty: "سلتك فارغة.",
      subtotal: "المجموع",
      checkout: "إتمام الشراء",
      remove: "إزالة",
      close: "إغلاق",
      customChain: "سلسلة مخصصة",
      columns: "أعمدة",
      links: "حلقات",
      perLink: "/ حلقة",
    };
  }
  return {
    title: "Cart",
    empty: "Your cart is empty.",
    subtotal: "Subtotal",
    checkout: "Checkout",
    remove: "Remove",
    close: "Close",
    customChain: "Custom Chain",
    columns: "columns",
    links: "links",
    perLink: "/ link",
  };
};

const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose, lang, onCheckout }) => {
  const { items, totalPrice, removeItem, updateQuantity } = useCart();
  const t = getContent(lang);
  const currency = items[0]?.currency ?? "AED";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-stone-900/40 z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl
          transition-transform duration-500 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
          rtl:right-auto rtl:left-0 ${open ? "rtl:translate-x-0" : "rtl:-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-stone-700" />
            <h2 className="font-sans font-black text-sm uppercase tracking-[0.2em] text-stone-900">
              {t.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="text-stone-500 hover:text-stone-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <p className="text-stone-400 text-sm uppercase tracking-widest text-center mt-16">
              {t.empty}
            </p>
          ) : (
            items.map((item) => {
              /* ── Loose-link line item ─────────────────────────────────── */
              if (isLooseLinkItem(item)) {
                const columnCount = item.configuration.columns.length;
                const summaryText = item.colorSummary
                  .map((s) => `${s.count}× ${s.colorName}`)
                  .join(", ");

                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    {/* Chain icon placeholder */}
                    <div className="w-14 h-14 flex-shrink-0 bg-stone-100 flex items-center justify-center">
                      <span className="text-[18px]">⛓</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-black text-xs uppercase tracking-tight text-stone-900 leading-snug">
                        {t.customChain}
                      </p>
                      <p className="text-stone-500 text-xs mt-0.5">
                        {item.totalLinks} {t.links} · {columnCount} {t.columns}
                      </p>
                      <p className="text-stone-400 text-[10px] mt-1 leading-snug break-words">
                        {summaryText}
                      </p>
                      <p className="text-stone-500 text-[10px] mt-1">
                        {item.currency} {item.pricePerLink.toLocaleString()} {t.perLink}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="mt-2 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                      >
                        {t.remove}
                      </button>
                    </div>

                    {/* Line total */}
                    <p className="text-xs font-bold text-stone-900 flex-shrink-0">
                      {item.currency} {item.lineTotal.toLocaleString()}
                    </p>
                  </div>
                );
              }

              /* ── Bundle line item (existing UI — unchanged) ───────────── */
              return (
                <div key={item.id} className="flex gap-4 items-start">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 object-cover flex-shrink-0 bg-stone-100"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-black text-xs uppercase tracking-tight text-stone-900 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-stone-500 text-xs mt-1">
                      {item.currency} {item.price.toLocaleString()}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 border border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-900 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-stone-900 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 border border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-900 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors ml-2"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <p className="text-xs font-bold text-stone-900 flex-shrink-0">
                    {item.currency} {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 px-6 py-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                {t.subtotal}
              </span>
              <span className="font-sans font-black text-lg text-stone-900">
                {currency} {totalPrice.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-stone-900 text-white font-sans font-bold text-[11px] uppercase tracking-[0.25em] hover:bg-stone-700 transition-colors"
            >
              {t.checkout}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
