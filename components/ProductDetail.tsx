import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { SiApplepay } from "react-icons/si";
import { Language, Product, ChainConfig } from "../types";
import { getProductBySlug } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import { useCart } from "./CartContext";
import ChainBuilder from "./ChainBuilder";
import Footer from "./Footer";

// Matches actual desktop navbar height: py-4 (1rem) + logo h-20 (5rem) + py-4 (1rem) = 7rem.
// Mobile (logo h-16): 1 + 4 + 1 = 6rem.
const NAV_H_MOBILE  = "pt-24";    // 6rem — logo h-16 + py-4 × 2
const NAV_H_DESKTOP = "md:pt-28"; // 7rem — logo h-20 + py-4 × 2

interface ProductDetailProps {
  lang: Language;
  onOpenCheckout?: () => void;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      back:            "العودة إلى المتجر",
      inStock:         "متوفر",
      sold:            "مُباع",
      madeToOrder:     "يُصنع بالطلب",
      addToCart:       "أضف إلى السلة",
      notAvailable:    "غير متاح",
      inquire:         "استفسر عن الطلب",
      sku:             "الرمز",
      loading:         "جارٍ التحميل…",
      notFound:        "المنتج غير موجود.",
      added:           "تمت الإضافة ✓",
      perLink:         "/ حلقة",
      quickBuy:        "دفع سريع",
      trustPrefix:     "بإتمام طلبك، أنت توافق على",
      termsLink:       "شروط الخدمة",
      dimensionsLabel: "الأبعاد",
      materialsLabel:  "المواد",
      noDetails:       "لا تفاصيل متاحة.",
      hookColor:       "لون الخطاف",
      gold:            "ذهبي",
      silver:          "فضي",
      tabs: {
        description: "الوصف",
        dimensions:  "الأبعاد والمواد",
        delivery:    "التسليم والإرجاع",
      },
      deliveryContent: [
        "نشحن إلى جميع أنحاء الإمارات العربية المتحدة ودول مجلس التعاون الخليجي.",
        "جميع القطع مصنوعة بالطلب. يبدأ الإنتاج فور تأكيد الطلب — لا يمكن قبول الإلغاء بعد هذه المرحلة.",
        "التسليم المتوقع: من أسبوعين إلى أربعة أسابيع داخل الإمارات، ومن ثلاثة إلى ستة أسابيع لدول مجلس التعاون الخليجي. الشحن الدولي متاح عند الطلب.",
        "نظراً لأن كل قطعة تُصنع خصيصاً، فإننا لا نقبل الإرجاع أو الاستبدال.",
      ],
    };
  }
  return {
    back:            "Back to Shop",
    inStock:         "In Stock",
    sold:            "Sold",
    madeToOrder:     "Made to Order",
    addToCart:       "Add to Cart",
    notAvailable:    "Not Available",
    inquire:         "Inquire to Order",
    sku:             "SKU",
    loading:         "Loading…",
    notFound:        "Product not found.",
    added:           "Added ✓",
    perLink:         "/ link",
    quickBuy:        "Express Payment",
    trustPrefix:     "By placing your order you agree to the",
    termsLink:       "terms of service",
    dimensionsLabel: "Dimensions",
    materialsLabel:  "Materials",
    noDetails:       "No details available.",
    hookColor:       "Hook colour",
    gold:            "Gold",
    silver:          "Silver",
    tabs: {
      description: "Description",
      dimensions:  "Dimensions & Materials",
      delivery:    "Delivery & Returns",
    },
    deliveryContent: [
      "We ship across the UAE and the GCC region.",
      "All pieces are crafted to order. Production begins immediately upon order confirmation — cancellations cannot be accepted after this point.",
      "Estimated delivery: 2–4 weeks within the UAE, 3–6 weeks across the GCC. International shipping is available on request.",
      "As every item is made to order, we do not accept returns or exchanges.",
    ],
  };
};

const ProductDetail: React.FC<ProductDetailProps> = ({ lang, onOpenCheckout }) => {
  const { slug }                      = useParams<{ slug: string }>();
  const [product, setProduct]         = useState<Product | null>(null);
  const [fetching, setFetching]       = useState(true);
  const [justAdded, setJustAdded]     = useState(false);
  const [activeTab, setActiveTab]     = useState<"description" | "dimensions" | "delivery">("description");
  // Bundle-branch hook colour — free choice, defaults to gold. Only used when isArtLinks.
  const [hookColor, setHookColor]     = useState<"gold" | "silver">("gold");
  const { addItem, addLooseLinkItem } = useCart();
  const t = getContent(lang);

  useEffect(() => {
    if (!slug) return;
    setFetching(true);
    getProductBySlug(slug)
      .then(setProduct)
      .finally(() => setFetching(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || product.availability === "sold") return;
    const isArtLinks = (product.collection ?? "art-links") === "art-links";
    addItem({
      productId:    product._id,
      slug:         product.slug.current,
      title:        product.title[lang] ?? product.title.en,
      price:        product.price ?? 0,
      currency:     product.currency,
      image:        product.images?.[0] ? imgUrl.thumb(product.images[0]) : "",
      availability: product.availability,
      weightKg:     product.weightKg,
      size:         product.size,
      hookColor:    isArtLinks ? hookColor : undefined,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleQuickBuy = () => {
    if (!product || product.availability === "sold") return;
    const isArtLinks = (product.collection ?? "art-links") === "art-links";
    addItem({
      productId:    product._id,
      slug:         product.slug.current,
      title:        product.title[lang] ?? product.title.en,
      price:        product.price ?? 0,
      currency:     product.currency,
      image:        product.images?.[0] ? imgUrl.thumb(product.images[0]) : "",
      availability: product.availability,
      weightKg:     product.weightKg,
      size:         product.size,
      hookColor:    isArtLinks ? hookColor : undefined,
    });
    onOpenCheckout?.();
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-stone-50 flex items-center justify-center gap-3 text-stone-400"
      >
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm tracking-widest uppercase">{t.loading}</span>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={`min-h-screen bg-stone-50 ${NAV_H_MOBILE} ${NAV_H_DESKTOP} px-6 md:px-12`}
      >
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors mb-12"
        >
          <ArrowLeft size={14} />
          {t.back}
        </Link>
        <p className="text-stone-400 text-sm uppercase tracking-widest">{t.notFound}</p>
      </div>
    );
  }

  const title       = product.title?.[lang]       ?? product.title?.en       ?? "";
  const description = product.description?.[lang] ?? product.description?.en ?? "";
  const images      = product.images ?? [];

  const availLabel =
    product.availability === "in_stock"   ? t.inStock
    : product.availability === "sold"     ? t.sold
    : t.madeToOrder;

  const availBadgeClass =
    product.availability === "in_stock"
      ? "text-stone-600 border-stone-400"
      : product.availability === "sold"
      ? "text-stone-400 border-stone-300"
      : "text-amber-700 border-amber-400";

  const canBuy = product.availability !== "sold";

  // Hook colour choice only applies to the Art Links collection.
  // Missing collection defaults to "art-links" (matches Shop.tsx's resolveCollection).
  const isArtLinks = (product.collection ?? "art-links") === "art-links";

  // ── Loose-link: compact header + builder ─────────────────────────────────────
  if (product.productType === "loose-link") {
    return (
      <section
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-stone-50"
      >
        <div className={`${NAV_H_MOBILE} ${NAV_H_DESKTOP} px-6 md:px-12`}>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors mt-8"
          >
            <ArrowLeft size={14} />
            {t.back}
          </Link>

          <div className="mt-4 pb-5 border-b border-stone-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {product.sku && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-1">
                    {t.sku}: {product.sku}
                  </p>
                )}
                <h1 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-tighter text-stone-900 leading-none">
                  {title}
                </h1>
                <p className="font-sans font-bold text-sm text-stone-500 mt-1.5">
                  {product.currency} {product.pricePerLink?.toLocaleString()} {t.perLink}
                </p>
              </div>
              <span className={`self-start text-[9px] font-bold uppercase tracking-[0.2em] border px-3 py-1 ${availBadgeClass}`}>
                {availLabel}
              </span>
            </div>

            {description && (
              <p className="font-serif italic text-stone-500 text-sm mt-3 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>

          <div className="mt-6 pb-16">
            <ChainBuilder
              colorOptions={product.colorOptions ?? []}
              pricePerLink={product.pricePerLink ?? 0}
              currency={product.currency}
              lang={lang}
              justAdded={justAdded}
              showHookColor={isArtLinks}
              onAddToCart={(config: ChainConfig) => {
                addLooseLinkItem({
                  productId:     product._id,
                  productType:   "loose-link",
                  title:         product.title[lang] ?? product.title.en,
                  currency:      product.currency,
                  configuration: { columns: config.columns },
                  totalLinks:    config.totalLinks,
                  pricePerLink:  product.pricePerLink ?? 0,
                  lineTotal:     config.lineTotal,
                  colorSummary:  config.colorSummary,
                  hookColor:     config.hookColor,
                  weightKg:      product.weightKg,
                  size:          product.size,
                });
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 2000);
              }}
            />
          </div>
        </div>
      </section>
    );
  }

  // ── Bundle: two-column layout ─────────────────────────────────────────────────
  //
  // Layout (desktop lg+):
  //   flex row — left column is the image gallery in normal flow; right column
  //   outer div (lg:w-1/2) is a flex child whose height equals the left column
  //   via align-items:stretch. The inner div is position:sticky, pinned below
  //   the navbar for exactly (100vh − navbar) tall.
  //
  //   Sticky releases naturally when the outer right div ends — i.e. when the
  //   image gallery finishes — so anything placed after the flex row (footer,
  //   related products, etc.) starts cleanly with no overlap.
  //
  // WHY overflow-x:clip (not hidden) in index.html:
  //   overflow-x:hidden implicitly sets overflow-y:auto on the element, making
  //   <body> a scroll container. position:sticky sticks relative to its nearest
  //   scroll container — if that's <body> instead of the viewport, sticky has
  //   zero effect. overflow-x:clip clips visually without creating a scroll
  //   container, so sticky works correctly against the viewport.
  //
  // Mobile: stacked — back link → images → info panel, all normal flow.
  //
  const isRtl = lang === "ar";

  const subtitle   = product.subtitle?.[lang]   ?? product.subtitle?.en   ?? "";
  const dimensions = product.dimensions?.[lang] ?? product.dimensions?.en ?? "";
  const materials  = product.materials?.[lang]  ?? product.materials?.en  ?? "";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-stone-50 min-h-screen"
    >
      {/* Mobile-only navbar clearance + back link */}
      <div className={`lg:hidden px-6 pb-6 ${NAV_H_MOBILE} ${NAV_H_DESKTOP}`}>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={14} />
          {t.back}
        </Link>
      </div>

      {/* Two-column flex — stacks on mobile, side-by-side on desktop */}
      <div className="lg:flex">

        {/* ── LEFT: image stack ──────────────────────────────────────────────
            On desktop: starts exactly at the navbar bottom (md:pt-28 = 7rem).
            On mobile:  flows after the back-link div above, no extra top gap. */}
        <div className="lg:w-1/2 lg:shrink-0 lg:pt-28">
          {images.length > 0 ? (
            images.map((img: any, i: number) => (
              <div
                key={i}
                className="w-full aspect-[3/4] overflow-hidden bg-stone-100"
              >
                <img
                  src={imgUrl.full(img)}
                  alt={i === 0 ? title : `${title} — ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="w-full aspect-[3/4] bg-stone-100 flex items-center justify-center text-stone-300 text-xs uppercase tracking-widest">
              No image
            </div>
          )}
        </div>

        {/* ── RIGHT: sticky info panel ───────────────────────────────────────
            Outer div (lg:w-1/2) is a flex child that stretches to match the
            left image column height — this is the sticky containing block.
            Inner div is position:sticky, pinned to viewport top (below navbar),
            and releases automatically when the outer div's bottom edge is
            reached (i.e. when the last image scrolls past). */}
        <div className="lg:w-1/2 lg:shrink-0">
          <div
            className={[
              // Mobile: normal padded block
              "px-6 py-10",
              // Desktop: sticky panel, full height minus navbar, scrollable internally
              "lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)]",
              "lg:overflow-y-auto lg:bg-stone-50",
              "lg:px-16 lg:flex lg:flex-col lg:py-12",
            ].join(" ")}
          >
            {/* Desktop back link */}
            <Link
              to="/shop"
              className="hidden lg:inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft size={14} />
              {t.back}
            </Link>

            <div className="flex flex-col lg:my-auto lg:py-8">

              {/* ── Title row: title/subtitle left · availability badge right ── */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <h1 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-none">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="font-serif italic text-stone-500 text-sm leading-snug">
                      {subtitle}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] border px-3 py-1 ${availBadgeClass}`}>
                  {availLabel}
                </span>
              </div>

              {/* Hook colour — free choice, defaults to gold. Art Links collection only. */}
              {isArtLinks && (
                <div className="flex flex-col gap-2 mt-6">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
                    {t.hookColor}
                  </span>
                  <div className="flex items-center gap-3">
                    {(["gold", "silver"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setHookColor(option)}
                        aria-label={option === "gold" ? t.gold : t.silver}
                        aria-pressed={hookColor === option}
                        title={option === "gold" ? t.gold : t.silver}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          hookColor === option
                            ? "border-stone-700 ring-2 ring-offset-2 ring-stone-400"
                            : "border-stone-300 hover:border-stone-500"
                        }`}
                        style={{ backgroundColor: option === "gold" ? "#C9A24B" : "#B7BABD" }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Add to Cart (label left · price right) + trust microcopy */}
              <div className="mt-20">
                {canBuy ? (
                  <button
                    onClick={handleAddToCart}
                    className={`w-full h-[52px] px-6 rounded-md font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-between gap-4 ${
                      justAdded
                        ? "bg-stone-600 text-white"
                        : "bg-stone-900 text-white hover:bg-stone-700"
                    }`}
                  >
                    <span>
                      {justAdded
                        ? t.added
                        : product.availability === "made_to_order"
                        ? t.inquire
                        : t.addToCart}
                    </span>
                    <span className="opacity-75 font-bold">
                      {product.currency} {product.price?.toLocaleString()}
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full h-[52px] px-6 rounded-md font-sans font-bold text-[11px] uppercase tracking-[0.25em] bg-stone-200 text-stone-400 cursor-not-allowed flex items-center justify-between gap-4"
                  >
                    <span>{t.notAvailable}</span>
                    <span className="opacity-60">
                      {product.currency} {product.price?.toLocaleString()}
                    </span>
                  </button>
                )}

                {/* Quick Buy */}
                {canBuy && (
                  <button
                    onClick={handleQuickBuy}
                    className="w-full mt-2 h-[52px] px-6 rounded-md font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-between gap-4 border border-stone-300 text-stone-900 hover:bg-stone-100 hover:border-stone-400"
                  >
                    <span>{t.quickBuy}</span>
                    <span className="flex items-center gap-2 opacity-60">
                      <SiApplepay size={26} />
                      <CreditCard size={16} strokeWidth={1.75} />
                    </span>
                  </button>
                )}

                {/* Trust microcopy */}
                <p className="text-[10px] text-stone-400 mt-2.5 leading-relaxed">
                  {t.trustPrefix}{" "}
                  <Link
                    to="/terms-of-service"
                    className="underline underline-offset-2 hover:text-stone-600 transition-colors"
                  >
                    {t.termsLink}
                  </Link>
                </p>
              </div>

              {/* ── Tabbed section ───────────────────────────────────────── */}
              <div className="border-t border-stone-200 mt-20 pt-6">

                {/* Tab bar */}
                <div
                  role="tablist"
                  className="flex gap-6 border-b border-stone-200 overflow-x-auto pb-px"
                >
                  {(["description", "dimensions", "delivery"] as const).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      className={[
                        "pb-3 text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors",
                        "border-b-2 -mb-px",
                        activeTab === tab
                          ? "text-stone-900 border-stone-900"
                          : "text-stone-400 border-transparent hover:text-stone-600",
                      ].join(" ")}
                    >
                      {t.tabs[tab]}
                    </button>
                  ))}
                </div>

                {/* Tab panels */}
                <div role="tabpanel" className="pt-5">

                  {activeTab === "description" && (
                    description
                      ? <p className="font-serif italic text-stone-600 leading-relaxed text-base">{description}</p>
                      : <p className="text-stone-300 text-sm">—</p>
                  )}

                  {activeTab === "dimensions" && (
                    <div className="flex flex-col gap-5">
                      {dimensions && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-1.5">
                            {t.dimensionsLabel}
                          </p>
                          <p className="font-serif text-stone-600 text-sm leading-relaxed">
                            {dimensions}
                          </p>
                        </div>
                      )}
                      {materials && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-1.5">
                            {t.materialsLabel}
                          </p>
                          <p className="font-serif text-stone-600 text-sm leading-relaxed">
                            {materials}
                          </p>
                        </div>
                      )}
                      {!dimensions && !materials && (
                        <p className="text-stone-400 text-sm italic">{t.noDetails}</p>
                      )}
                    </div>
                  )}

                  {activeTab === "delivery" && (
                    <div className="flex flex-col gap-3">
                      {t.deliveryContent.map((para, i) => (
                        <p key={i} className="font-serif text-stone-600 text-sm leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ── TEMP boundary test — remove once scroll behaviour confirmed ── */}
      <div className="w-full py-10 flex items-center justify-center bg-amber-100 border-t-2 border-amber-400">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-700">
          ✓ sticky released — content below starts here
        </p>
      </div>
      {/* ── END TEMP ─────────────────────────────────────────────────────── */}

      <Footer lang={lang} />

    </div>
  );
};

export default ProductDetail;
