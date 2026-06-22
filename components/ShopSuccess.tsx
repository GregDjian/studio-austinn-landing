import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Language } from "../types";
import { useCart } from "./CartContext";

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      heading: "شكراً لك",
      body: "تم استلام طلبك بنجاح. ستتلقى تأكيداً على بريدك الإلكتروني قريباً.",
      cta: "العودة إلى المتجر",
    };
  }
  return {
    heading: "Thank You",
    body: "Your order has been received. A confirmation will be sent to your email shortly.",
    cta: "Back to Shop",
  };
};

const ShopSuccess: React.FC<{ lang: Language }> = ({ lang }) => {
  const { clearCart } = useCart();
  const t = getContent(lang);

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center gap-8"
    >
      <CheckCircle2 size={48} className="text-stone-700" strokeWidth={1.5} />
      <h1 className="font-sans font-black text-5xl uppercase tracking-tighter text-stone-900">
        {t.heading}
      </h1>
      <p className="font-serif italic text-stone-500 text-lg max-w-sm leading-relaxed">
        {t.body}
      </p>
      <Link
        to="/shop"
        className="px-8 py-3 border border-stone-900 text-stone-900 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-stone-900 hover:text-white transition-all duration-300"
      >
        {t.cta}
      </Link>
    </section>
  );
};

export default ShopSuccess;
