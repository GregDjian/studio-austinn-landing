import React, { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { Language } from "../types";
import { useCart, isLooseLinkItem } from "./CartContext";
import { getDeliveryZones, DeliveryZone, WeightTier, SizeTier } from "../lib/sanityQueries";

// ── Static geo data ───────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: "AE", en: "United Arab Emirates", ar: "الإمارات العربية المتحدة", zoneKey: "uae" as const },
  { value: "SA", en: "Saudi Arabia",         ar: "المملكة العربية السعودية", zoneKey: "gcc" as const },
  { value: "OM", en: "Oman",                 ar: "عُمان",                    zoneKey: "gcc" as const },
  { value: "BH", en: "Bahrain",              ar: "البحرين",                  zoneKey: "gcc" as const },
  { value: "KW", en: "Kuwait",               ar: "الكويت",                   zoneKey: "gcc" as const },
  { value: "QA", en: "Qatar",                ar: "قطر",                      zoneKey: "gcc" as const },
];

const UAE_EMIRATES = [
  { value: "dubai",          en: "Dubai",          ar: "دبي"        },
  { value: "abu-dhabi",      en: "Abu Dhabi",      ar: "أبوظبي"     },
  { value: "sharjah",        en: "Sharjah",        ar: "الشارقة"    },
  { value: "ajman",          en: "Ajman",          ar: "عجمان"      },
  { value: "ras-al-khaimah", en: "Ras Al Khaimah", ar: "رأس الخيمة" },
  { value: "fujairah",       en: "Fujairah",       ar: "الفجيرة"    },
  { value: "umm-al-quwain",  en: "Umm Al Quwain",  ar: "أم القيوين" },
];

// ── i18n ──────────────────────────────────────────────────────────────────────

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      title:           "إتمام طلبك",
      close:           "إغلاق",
      orderSummary:    "ملخص الطلب",
      deliveryDetails: "تفاصيل التوصيل",
      country:         "الدولة",
      emirate:         "الإمارة",
      selectCountry:   "اختر الدولة",
      selectEmirate:   "اختر الإمارة",
      delivery:        "رسوم التوصيل",
      subtotal:        "المجموع الفرعي",
      total:           "الإجمالي",
      proceed:         "المتابعة إلى الدفع",
      processing:      "جاري المعالجة…",
      deliveryPending: "اختر الوجهة لعرض رسوم التوصيل",
      customChain:     "سلسلة مخصصة",
      links:           "حلقات",
      columns:         "أعمدة",
      qty:             "الكمية",
      installTitle:    "التركيب الاحترافي",
      installDesc:     "تركيب الأعمال الفنية وتثبيتها (دبي فقط)",
      installation:    "التركيب",
      addressNote:     "سيتم إدخال عنوان الشحن الكامل في صفحة الدفع — يجب أن يكون داخل الدولة المحددة.",
      noRefundTitle:   "جميع المبيعات نهائية",
      noRefundText:    "منتجاتنا مصنوعة حسب الطلب. بمجرد بدء الإنتاج، لا يمكن إلغاء الطلبات أو إرجاعها أو استرداد قيمتها.",
      zonesError:      "تعذّر تحميل رسوم التوصيل. يرجى المحاولة مجدداً.",
      checkoutError:   "حدث خطأ. يرجى المحاولة مجدداً.",
    };
  }
  return {
    title:           "Complete Your Order",
    close:           "Close",
    orderSummary:    "Order Summary",
    deliveryDetails: "Delivery Details",
    country:         "Country",
    emirate:         "Emirate",
    selectCountry:   "Select a country",
    selectEmirate:   "Select an emirate",
    delivery:        "Delivery",
    subtotal:        "Subtotal",
    total:           "Total",
    proceed:         "Proceed to Payment",
    processing:      "Processing…",
    deliveryPending: "Select a destination to see delivery rate",
    customChain:     "Custom Chain",
    links:           "links",
    columns:         "columns",
    qty:             "qty",
    installTitle:    "Professional Installation",
    installDesc:     "Artwork mounting & fitting (Dubai only)",
    installation:    "Installation",
    addressNote:     "Your full shipping address is collected on the payment page — it must be within the selected country.",
    noRefundTitle:   "All Sales Are Final",
    noRefundText:    "Our products are custom-made to order. Once production begins, orders cannot be cancelled, returned, or refunded.",
    zonesError:      "Could not load delivery rates. Please try again.",
    checkoutError:   "Something went wrong. Please try again.",
  };
};

// ── Delivery rate helpers ─────────────────────────────────────────────────────

function lookupWeightTier(tiers: WeightTier[], totalKg: number): number {
  const sorted = [...tiers].sort((a, b) => b.minKg - a.minKg);
  return sorted.find(
    (t) => totalKg >= t.minKg && (t.maxKg == null || totalKg < t.maxKg)
  )?.rate ?? 0;
}

function lookupSizeTier(tiers: SizeTier[], size: "small" | "medium" | "large"): number {
  return tiers.find((t) => t.size === size)?.rate ?? 0;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose, lang }) => {
  const { items, totalPrice } = useCart();
  const t = getContent(lang);

  const [country,         setCountry]         = useState("");
  const [emirate,         setEmirate]         = useState("");
  const [addInstallation, setAddInstallation] = useState(false);
  const [zones,           setZones]           = useState<DeliveryZone[]>([]);
  const [zonesLoading,    setZonesLoading]    = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // Fetch delivery zones once when modal first opens
  useEffect(() => {
    if (!open || zones.length > 0) return;
    setZonesLoading(true);
    getDeliveryZones()
      .then(setZones)
      .catch(() => setError(t.zonesError))
      .finally(() => setZonesLoading(false));
  }, [open]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setCountry("");
      setEmirate("");
      setAddInstallation(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedCountry  = COUNTRIES.find((c) => c.value === country) ?? null;
  const isUAE            = country === "AE";
  const selectedZone     = selectedCountry
    ? (zones.find((z) => z.zoneKey === selectedCountry.zoneKey) ?? null)
    : null;
  const currency  = items[0]?.currency ?? "AED";
  const subtotal  = totalPrice;

  // Per-item delivery cost: each line item is rated independently then summed.
  // Bundle: rate is looked up per unit then multiplied by quantity.
  // Loose-link: one shipment — tier lookup uses full chain weight, units = 1.
  // Untagged items default weightKg → 0, size → "large" (safe overcharge).
  const deliveryRate = selectedZone
    ? items.reduce((sum, item) => {
        const wKg        = item.weightKg ?? 0;
        const itemSize   = (item.size ?? "large") as "small" | "medium" | "large";
        const itemWeight = isLooseLinkItem(item) ? wKg * item.totalLinks : wKg;
        const units      = isLooseLinkItem(item) ? 1 : item.quantity;
        const wRate      = lookupWeightTier(selectedZone.weightTiers ?? [], itemWeight);
        const sRate      = lookupSizeTier(selectedZone.sizeTiers ?? [], itemSize);
        return sum + Math.max(wRate, sRate) * units;
      }, 0)
    : 0;

  const installFee       = selectedZone?.installationFee ?? 0;
  const showInstallation = emirate === "dubai" && installFee > 0;
  const orderTotal       = subtotal
    + (selectedZone ? deliveryRate : 0)
    + (showInstallation && addInstallation ? installFee : 0);
  const canProceed       = country !== "" && (!isUAE || emirate !== "") && !submitting && !zonesLoading;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleProceed = async () => {
    if (!canProceed || !selectedZone) return;
    setSubmitting(true);
    setError(null);

    const cartItems = items.map((i) => {
      if (isLooseLinkItem(i)) {
        const summaryText = i.colorSummary.map((s) => `${s.count}× ${s.colorName}`).join(", ");
        const colCount = i.configuration.columns.length;
        const hookLabel = i.hookColor === "gold" ? "Gold" : "Silver";
        return {
          title:    `Custom chain — ${colCount} col${colCount !== 1 ? "s" : ""}: ${summaryText} — ${hookLabel} hook`,
          price:    i.pricePerLink,
          currency: i.currency,
          quantity: i.totalLinks,
          image:    undefined as string | undefined,
        };
      }
      const hookSuffix = i.hookColor ? ` — ${i.hookColor === "gold" ? "Gold" : "Silver"} hook` : "";
      return {
        title:    `${i.title}${hookSuffix}`,
        price:    i.price,
        currency: i.currency,
        quantity: i.quantity,
        image:    i.image || undefined,
      };
    });

    const deliveryPayload = {
      label:    `Delivery — ${selectedZone.zoneName.en}`,
      amount:   deliveryRate,
      currency,
    };

    const installationPayload =
      showInstallation && addInstallation
        ? { label: "Professional Installation (Dubai)", amount: installFee, currency }
        : null;

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items:            cartItems,
          origin:           window.location.origin,
          delivery:         deliveryPayload,
          installation:     installationPayload,
          selectedCountry:  country,
          selectedEmirate:  emirate,
          lang,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? t.checkoutError);
      }
    } catch (err: any) {
      setError(err?.message ?? t.checkoutError);
      setSubmitting(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const selectCls =
    "w-full border border-stone-300 text-stone-900 text-sm py-2.5 px-3 bg-white " +
    "appearance-none focus:outline-none focus:border-stone-900 transition-colors " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-stone-900/40 z-[60] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={`
          fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[60] flex flex-col shadow-2xl
          transition-transform duration-500 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
          rtl:right-auto rtl:left-0 ${open ? "rtl:translate-x-0" : "rtl:-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 flex-shrink-0">
          <h2 className="font-sans font-black text-sm uppercase tracking-[0.2em] text-stone-900">
            {t.title}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="text-stone-500 hover:text-stone-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

          {/* ── Order summary ─────────────────────────────────────────── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-4">
              {t.orderSummary}
            </h3>
            <div className="flex flex-col gap-3">
              {items.map((item) => {
                if (isLooseLinkItem(item)) {
                  const colCount = item.configuration.columns.length;
                  return (
                    <div key={item.id} className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-tight text-stone-900">
                          {t.customChain}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {item.totalLinks} {t.links} · {colCount} {t.columns}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-stone-900 flex-shrink-0">
                        {item.currency} {item.lineTotal.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-tight text-stone-900 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {t.qty} {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-stone-900 flex-shrink-0">
                      {item.currency} {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Delivery details ──────────────────────────────────────── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-4">
              {t.deliveryDetails}
            </h3>
            <div className="flex flex-col gap-4">

              {/* Country */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                  {t.country}
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setEmirate(""); }}
                    disabled={zonesLoading}
                    className={selectCls}
                  >
                    <option value="" disabled>
                      {zonesLoading ? "…" : t.selectCountry}
                    </option>
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {lang === "ar" ? c.ar : c.en}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none rtl:right-auto rtl:left-3"
                  />
                </div>
              </div>

              {/* Emirate — UAE only */}
              {isUAE && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
                    {t.emirate}
                  </label>
                  <div className="relative">
                    <select
                      value={emirate}
                      onChange={(e) => {
                        setEmirate(e.target.value);
                        if (e.target.value !== "dubai") setAddInstallation(false);
                      }}
                      className={selectCls}
                    >
                      <option value="" disabled>{t.selectEmirate}</option>
                      {UAE_EMIRATES.map((em) => (
                        <option key={em.value} value={em.value}>
                          {lang === "ar" ? em.ar : em.en}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none rtl:right-auto rtl:left-3"
                    />
                  </div>
                </div>
              )}

              {/* Address-match note — shown once a country is selected */}
              {selectedCountry && (
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {t.addressNote}
                </p>
              )}

              {/* Installation add-on — Dubai only */}
              {showInstallation && (
                <label className="flex items-start gap-3 p-4 border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={addInstallation}
                    onChange={(e) => setAddInstallation(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-stone-900 flex-shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900">{t.installTitle}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{t.installDesc}</p>
                  </div>
                  <span className="text-xs font-bold text-stone-900 flex-shrink-0">
                    + {currency} {installFee.toLocaleString()}
                  </span>
                </label>
              )}
            </div>
          </section>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-xs">{error}</p>
          )}
        </div>

        {/* Footer — cost breakdown + CTA */}
        <div className="border-t border-stone-200 px-6 py-6 flex flex-col gap-4 flex-shrink-0">

          {/* Cost breakdown */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                {t.subtotal}
              </span>
              <span className="text-sm text-stone-700">
                {currency} {subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                {t.delivery}
              </span>
              {selectedZone ? (
                <span className="text-sm text-stone-700">
                  {currency} {deliveryRate.toLocaleString()}
                </span>
              ) : (
                <span className="text-[10px] italic text-stone-400">
                  {t.deliveryPending}
                </span>
              )}
            </div>

            {showInstallation && addInstallation && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  {t.installation}
                </span>
                <span className="text-sm text-stone-700">
                  {currency} {installFee.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">
                {t.total}
              </span>
              <span className="font-sans font-black text-lg text-stone-900">
                {selectedZone ? `${currency} ${orderTotal.toLocaleString()}` : "—"}
              </span>
            </div>
          </div>

          {/* Non-refundable disclosure */}
          <div className="bg-stone-50 border border-stone-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-1">
              {t.noRefundTitle}
            </p>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {t.noRefundText}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-white font-sans font-bold text-[11px] uppercase
              tracking-[0.25em] hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t.processing}
              </>
            ) : (
              t.proceed
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;
