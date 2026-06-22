import React from "react";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Language } from "../types";

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      heading: "تم إلغاء الطلب",
      body: "لم تُكمل عملية الدفع. لا يزال بإمكانك العودة إلى سلتك وإتمام الشراء.",
      cta: "العودة إلى المتجر",
    };
  }
  return {
    heading: "Order Cancelled",
    body: "Your checkout was not completed. You can return to your cart and try again.",
    cta: "Back to Shop",
  };
};

const ShopCancel: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = getContent(lang);

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center gap-8"
    >
      <XCircle size={48} className="text-stone-400" strokeWidth={1.5} />
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

export default ShopCancel;
