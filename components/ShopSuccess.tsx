import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Language } from "../types";
import { useCart } from "./CartContext";

interface OrderItem {
  name: string;
  quantity: number;
  amount: number; // minor units, line total
}

interface OrderShipping {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  currency: string;
  amountTotal: number; // minor units
  vatAmount: string | null; // major units
  customerName: string;
  items: OrderItem[];
  shipping: OrderShipping | null;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      loading: "جارٍ تحميل طلبك…",
      eyebrow: "تأكيد الطلب",
      heading: "شكراً لطلبك",
      body: "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. سنتواصل معك قريباً.",
      reference: "رقم الطلب",
      itemsHeading: "المنتجات المطلوبة",
      qty: "الكمية",
      total: "الإجمالي (شامل الضريبة)",
      includesVat: "تشمل ضريبة القيمة المضافة (5٪)",
      addressHeading: "عنوان التوصيل",
      cta: "متابعة التسوق",
      error:
        "تعذّر تحميل تفاصيل طلبك. يرجى التحقق من بريدك الإلكتروني للحصول على التأكيد، أو تواصل معنا إذا احتجت إلى مساعدة.",
    };
  }
  return {
    loading: "Loading your order…",
    eyebrow: "Order Confirmation",
    heading: "Thank you for your order",
    body: "A confirmation email has been sent to you. We will be in touch shortly.",
    reference: "Order reference",
    itemsHeading: "Items ordered",
    qty: "Qty",
    total: "Total (incl. VAT)",
    includesVat: "Includes VAT (5%)",
    addressHeading: "Delivery address",
    cta: "Continue Shopping",
    error:
      "We couldn't load your order details. Please check your email for confirmation, or contact us if you need help.",
  };
};

const money = (minor: number, currency: string) =>
  `${currency} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const ShopSuccess: React.FC<{ lang: Language }> = ({ lang }) => {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const t = getContent(lang);

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // The order is placed by the time this page is reached, so the cart is emptied regardless of the lookup.
  useEffect(() => {
    clearCart();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as Order;
      })
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const shell = "min-h-screen bg-stone-50 pt-36 pb-24 px-6";
  const dir = lang === "ar" ? "rtl" : "ltr";

  if (status === "loading") {
    return (
      <section dir={dir} className={`${shell} flex items-center justify-center`}>
        <div className="flex items-center gap-3 text-stone-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm tracking-widest uppercase">{t.loading}</span>
        </div>
      </section>
    );
  }

  if (status === "error" || !order) {
    return (
      <section dir={dir} className={`${shell} flex flex-col items-center justify-center text-center gap-8`}>
        <p className="font-serif italic text-stone-500 text-lg max-w-md leading-relaxed">{t.error}</p>
        <Link
          to="/shop"
          className="px-8 py-3 border border-stone-900 text-stone-900 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-stone-900 hover:text-white transition-all duration-300"
        >
          {t.cta}
        </Link>
      </section>
    );
  }

  const reference = `#CS-${order.id.slice(-8).toUpperCase()}`;
  const countryName = order.shipping?.country
    ? (() => {
        try {
          return new Intl.DisplayNames([lang], { type: "region" }).of(order.shipping!.country) ?? order.shipping!.country;
        } catch {
          return order.shipping!.country;
        }
      })()
    : "";
  const addressLines = order.shipping
    ? [
        order.shipping.name,
        order.shipping.line1,
        order.shipping.line2,
        [order.shipping.city, order.shipping.state, order.shipping.postalCode].filter(Boolean).join(", "),
        countryName,
      ].filter(Boolean)
    : [];

  return (
    <section dir={dir} className={shell}>
      <div className="max-w-2xl mx-auto">

        {/* Confirmation */}
        <div className="text-center flex flex-col items-center gap-6 pb-14 border-b border-stone-200">
          <CheckCircle2 size={44} className="text-stone-700" strokeWidth={1.5} />
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-stone-400">{t.eyebrow}</p>
          <h1 className="font-sans font-black text-4xl md:text-6xl uppercase tracking-tighter text-stone-900 leading-[0.9]">
            {t.heading}
          </h1>
          <p className="font-serif italic text-stone-500 text-lg max-w-md leading-relaxed">{t.body}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500">
            {t.reference}: <span className="text-stone-900" dir="ltr">{reference}</span>
          </p>
        </div>

        {/* Items */}
        <div className="py-12 border-b border-stone-200">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">{t.itemsHeading}</h2>
          <div className="flex flex-col gap-5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-6">
                <div className="min-w-0">
                  <p className="font-sans font-bold text-sm uppercase tracking-tight text-stone-900 leading-snug">
                    {item.name}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {t.qty} {item.quantity}
                    </p>
                  )}
                </div>
                <p className="font-sans font-bold text-sm text-stone-900 flex-shrink-0">
                  {money(item.amount, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 mt-8 border-t border-stone-200">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">{t.total}</span>
            <span className="font-sans font-black text-2xl text-stone-900">
              {money(order.amountTotal, order.currency)}
            </span>
          </div>
          {order.vatAmount && (
            <div className="flex justify-between items-center mt-2 text-[11px] text-stone-500">
              <span>{t.includesVat}</span>
              <span>
                {order.currency} {parseFloat(order.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Delivery address */}
        {addressLines.length > 0 && (
          <div className="py-12 border-b border-stone-200">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-6">{t.addressHeading}</h2>
            <div className="text-stone-700 text-[15px] leading-relaxed">
              {addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        <div className="pt-12 flex justify-center">
          <Link
            to="/shop"
            className="px-10 py-4 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-stone-700 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ShopSuccess;
