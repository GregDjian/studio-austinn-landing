import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Language } from "../types";

// Contact details - same as the footer.
const CONTACT_EMAIL = "hello@studioaustinn.com";
const CONTACT_WHATSAPP_DISPLAY = "+971 58 155 8866";
const CONTACT_WHATSAPP_URL = "https://wa.me/971581558866";

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      close: "إغلاق",
      eyebrow: "الوثائق القانونية",
      titleA: "التوصيل",
      titleB: "والإرجاع",
      returnsHeading: "الإرجاع والإلغاء",
      intro1:
        "تُجمَّع مجموعة Studio Austinn وتُنتقى من أتيليه دبي الخاص بنا — بما يجمع بين الإنتاج الداخلي واللوحات الأصلية المرسومة يدوياً وتعاونات الفنانين وقطع مختارة بعناية تحمل توقيعنا.",
      intro2: "نأمل أن تُعجبك قطعتك. وإن لم يكن كل شيء على ما يرام، فنحن نودّ أن نعرف.",
      handcraftedHeading: "القطع المصنوعة يدوياً",
      handcrafted:
        "العديد من قطعنا مصنوعة يدوياً أو مرسومة يدوياً أو تُصنع بالطلب. ولذلك قد تختلف قطعتك قليلاً عن الصور المعروضة على موقعنا — فالاختلافات الطفيفة في اللون أو اللمسة النهائية أو التصميم من الخصائص الطبيعية للأعمال اليدوية ولا تُعدّ عيوباً. وقد تظهر الألوان مختلفة قليلاً أيضاً بحسب شاشة العرض.",
      cancellationsHeading: "الإلغاء",
      cancellations:
        "إذا رغبت في إلغاء طلبك، يُرجى التواصل معنا في أقرب وقت ممكن. لا يُقبل الإلغاء إلا قبل بدء الإنتاج. وبمجرد دخول قطعتك مرحلة الإنتاج، يصبح الطلب نهائياً ولا يمكن إلغاؤه.",
      damagedHeading: "القطع التالفة أو غير المطابقة",
      damaged:
        "نُولي التغليف ومراقبة الجودة عناية كبيرة. ومع ذلك، إذا وصلتك قطعة تالفة أو مختلفة عمّا طلبته، يُرجى التواصل معنا خلال 48 ساعة من استلام طلبك. سندرس كل حالة على حدة ونعمل معك للتوصل إلى الحل المناسب.",
      reportIntro: "للإبلاغ عن مشكلة، يُرجى التواصل عبر:",
      emailLabel: "البريد الإلكتروني",
      whatsappLabel: "واتساب",
      photos:
        "يُرجى إرفاق صور للقطعة والتغليف عند التواصل معنا — فهذا يساعدنا على حل حالتك بأسرع وقت ممكن.",
      deliveryHeading: "التوصيل",
      deliveryIntro:
        "تُراجَع كل الطلبات وتُتحقَّق من قِبل فريقنا قبل إرسالها — فنحن نحرص على أن يكون كل شيء مثالياً قبل وصوله إليك. يُرجى السماح بمدة تصل إلى يوم إلى يومي عمل لمعالجة الطلب. تُعالَج الطلبات المقدَّمة في عطلات نهاية الأسبوع أو العطلات الرسمية في يوم العمل التالي.",
      inStockHeading: "متوفر في المخزون",
      inStock:
        "جاهزة للشحن. بعد التحقق من طلبك والموافقة عليه، يستغرق التوصيل المعتاد داخل الإمارات من 24 إلى 72 ساعة. وفي بعض الحالات، قد يكون التوصيل في اليوم نفسه ممكناً في دبي.",
      madeToOrderHeading: "يُصنع بالطلب",
      madeToOrder:
        "تُصنع خصيصاً لك. مدة التنفيذ المعتادة من أسبوع إلى أربعة أسابيع داخل الإمارات، بحسب ضغط الإنتاج الحالي. سنُبقيك على اطلاع طوال الوقت.",
      gccHeading: "التوصيل إلى دول الخليج",
      gcc: "يمكننا التوصيل إلى دول مجلس التعاون الخليجي. تُحتسب تكاليف الشحن عند إتمام الطلب بحسب موقعك وحجم طلبك.",
      customHeading: "الطلبات الخاصة والدولية",
      custom: "للطلبات الخاصة أو التوصيل خارج الإمارات، يُرجى التواصل معنا مباشرة.",
      ofac:
        "لن تتعامل Studio Austinn مع أي من الدول الخاضعة لعقوبات مكتب مراقبة الأصول الأجنبية (OFAC) ولن تقدّم لها أي خدمات أو منتجات، وذلك وفقاً لقوانين دولة الإمارات العربية المتحدة.",
    };
  }
  return {
    close: "Close",
    eyebrow: "Legal",
    titleA: "Delivery",
    titleB: "& Returns",
    returnsHeading: "Returns & Cancellations",
    intro1:
      "The Studio Austinn collection is assembled and curated from our Dubai Atelier — combining in-house production, hand-painted originals, artist collaborations, and carefully selected pieces finished with our signature.",
    intro2: "We hope you love what you receive. If something isn't right, we want to know.",
    handcraftedHeading: "Handcrafted Pieces",
    handcrafted:
      "Many of our pieces are handcrafted, hand-painted or made to order. As a result, your item may differ slightly from the images shown on our website — slight variations in colour, finish or design are natural characteristics of handmade work and are not considered defects. Colours may also appear slightly different depending on your screen.",
    cancellationsHeading: "Cancellations",
    cancellations:
      "If you wish to cancel your order, please contact us as soon as possible. Cancellations are only accepted before production has begun. Once your piece enters production, the order is final and cannot be cancelled.",
    damagedHeading: "Damaged or Incorrect Items",
    damaged:
      "We take great care in packaging and quality control. However, if your item arrives damaged or is not what you ordered, please contact us within 48 hours of receiving your order. We will review each case individually and work with you to find the right solution.",
    reportIntro: "To report an issue, please reach out via:",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    photos:
      "Please include photos of the item and packaging when contacting us — this helps us resolve your case as quickly as possible.",
    deliveryHeading: "Delivery",
    deliveryIntro:
      "Every order is reviewed and verified by our team before it is dispatched — we want to make sure everything is perfect before it reaches you. Please allow up to 1–2 business days for order processing. Orders placed on weekends or public holidays will be processed on the following business day.",
    inStockHeading: "In Stock",
    inStock:
      "Ready to ship. Once your order has been verified and approved, standard delivery within the UAE is 24–72 hours. In some cases, same-day delivery in Dubai may be possible.",
    madeToOrderHeading: "Made to Order",
    madeToOrder:
      "Crafted specifically for you. Standard lead time is 1–4 weeks within the UAE, depending on current production load. We will keep you updated along the way.",
    gccHeading: "GCC Delivery",
    gcc: "We can deliver across the GCC. Shipping costs are calculated at checkout based on your location and order size.",
    customHeading: "Custom & International Orders",
    custom: "For bespoke commissions or deliveries outside the UAE, please get in touch directly.",
    ofac:
      "Studio Austinn will NOT deal with or provide any services or products to any of OFAC (Office of Foreign Assets Control) sanctions countries in accordance with the law of UAE.",
  };
};


// ── Policy text ───────────────────────────────────────────────────────────────
const DeliveryReturnsContent: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = getContent(lang);
  const isAr = lang === "ar";

  const h2 = "font-sans font-black text-2xl md:text-3xl uppercase tracking-tighter text-stone-900 leading-none";
  const h3 = "font-sans font-black text-base uppercase tracking-tighter text-stone-900 mb-2";

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="px-6 md:px-14 pt-14 pb-14">
      {/* Header */}
      <div className="mb-12 border-b border-stone-200 pb-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-stone-400 mb-4">{t.eyebrow}</p>
        <h1 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-[0.85]">
          {t.titleA} <span className="text-stone-300">{t.titleB}</span>
        </h1>
      </div>

      <div className="space-y-14 text-stone-600 text-[15px] leading-relaxed">

            {/* ── Returns & Cancellations ─────────────────────────────────── */}
            <div className="space-y-8">
              <h2 className={h2}>{t.returnsHeading}</h2>

              <div className="space-y-3">
                <p>{t.intro1}</p>
                <p className="font-bold text-stone-800">{t.intro2}</p>
              </div>

              <div>
                <h3 className={h3}>{t.handcraftedHeading}</h3>
                <p>{t.handcrafted}</p>
              </div>

              <div>
                <h3 className={h3}>{t.cancellationsHeading}</h3>
                <p>{t.cancellations}</p>
              </div>

              <div>
                <h3 className={h3}>{t.damagedHeading}</h3>
                <p className="mb-4">{t.damaged}</p>
                <p className="mb-2">{t.reportIntro}</p>
                <ul className="space-y-1.5 list-none mb-4">
                  <li className="flex gap-3">
                    <span className="text-stone-300 font-black">—</span>
                    <span>
                      {t.emailLabel}:{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-stone-800 underline underline-offset-4 hover:text-stone-900"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-stone-300 font-black">—</span>
                    <span>
                      {t.whatsappLabel}:{" "}
                      <a
                        href={CONTACT_WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="text-stone-800 underline underline-offset-4 hover:text-stone-900"
                      >
                        {CONTACT_WHATSAPP_DISPLAY}
                      </a>
                    </span>
                  </li>
                </ul>
                <p>{t.photos}</p>
              </div>
            </div>

            {/* ── Delivery ────────────────────────────────────────────────── */}
            <div className="space-y-8 border-t border-stone-200 pt-14">
              <h2 className={h2}>{t.deliveryHeading}</h2>

              <p>{t.deliveryIntro}</p>

              <div>
                <h3 className={h3}>{t.inStockHeading}</h3>
                <p>{t.inStock}</p>
              </div>
              <div>
                <h3 className={h3}>{t.madeToOrderHeading}</h3>
                <p>{t.madeToOrder}</p>
              </div>
              <div>
                <h3 className={h3}>{t.gccHeading}</h3>
                <p>{t.gcc}</p>
              </div>
              <div>
                <h3 className={h3}>{t.customHeading}</h3>
                <p>{t.custom}</p>
              </div>

              <p className="border-t border-stone-200 pt-8">
                {t.ofac}
              </p>
            </div>

      </div>
    </div>
  );
};

// ── Modal + open helper ───────────────────────────────────────────────────────
// One modal for the whole app; any component can open it with useDeliveryPolicy().
const DeliveryPolicyContext = createContext<() => void>(() => {});
export const useDeliveryPolicy = () => useContext(DeliveryPolicyContext);

export const DeliveryPolicyProvider: React.FC<{ lang: Language; children: React.ReactNode }> = ({ lang, children }) => {
  const [open, setOpen] = useState(false);
  const openPolicy = useCallback(() => setOpen(true), []);
  const t = getContent(lang);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <DeliveryPolicyContext.Provider value={openPolicy}>
      {children}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${t.titleA} ${t.titleB}`}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
        >
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full md:max-w-3xl md:mx-4 bg-stone-50 md:rounded-sm shadow-2xl max-h-[85dvh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="sticky top-4 float-right mr-4 z-20 p-2 bg-white hover:bg-stone-900 hover:text-white rounded-full shadow transition-all duration-300"
            >
              <X size={18} />
            </button>
            <DeliveryReturnsContent lang={lang} />
          </div>
        </div>
      )}
    </DeliveryPolicyContext.Provider>
  );
};
