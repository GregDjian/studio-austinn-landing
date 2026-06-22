import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Language, Product, ChainConfig } from "../types";
import { getProductBySlug } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import { useCart } from "./CartContext";
import ChainBuilder from "./ChainBuilder";

// Matches actual desktop navbar height: py-4 (1rem) + logo h-20 (5rem) + py-4 (1rem) = 7rem.
// Mobile (logo h-16): 1 + 4 + 1 = 6rem.
const NAV_H_MOBILE  = "pt-24";    // 6rem — logo h-16 + py-4 × 2
const NAV_H_DESKTOP = "md:pt-28"; // 7rem — logo h-20 + py-4 × 2

interface ProductDetailProps {
  lang: Language;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      back:         "العودة إلى المتجر",
      inStock:      "متوفر",
      sold:         "مُباع",
      madeToOrder:  "يُصنع بالطلب",
      addToCart:    "أضف إلى السلة",
      notAvailable: "غير متاح",
      inquire:      "استفسر عن الطلب",
      sku:          "الرمز",
      loading:      "جارٍ التحميل…",
      notFound:     "المنتج غير موجود.",
      added:        "تمت الإضافة ✓",
      perLink:      "/ حلقة",
    };
  }
  return {
    back:         "Back to Shop",
    inStock:      "In Stock",
    sold:         "Sold",
    madeToOrder:  "Made to Order",
    addToCart:    "Add to Cart",
    notAvailable: "Not Available",
    inquire:      "Inquire to Order",
    sku:          "SKU",
    loading:      "Loading…",
    notFound:     "Product not found.",
    added:        "Added ✓",
    perLink:      "/ link",
  };
};

const ProductDetail: React.FC<ProductDetailProps> = ({ lang }) => {
  const { slug }                      = useParams<{ slug: string }>();
  const [product, setProduct]         = useState<Product | null>(null);
  const [fetching, setFetching]       = useState(true);
  const [justAdded, setJustAdded]     = useState(false);
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
    addItem({
      id:           product._id,
      slug:         product.slug.current,
      title:        product.title[lang] ?? product.title.en,
      price:        product.price ?? 0,
      currency:     product.currency,
      image:        product.images?.[0] ? imgUrl.thumb(product.images[0]) : "",
      availability: product.availability,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
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
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors"
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
  // WHY position:fixed instead of position:sticky:
  //   index.html sets `overflow-x: hidden` on html,body. Per the CSS spec, this
  //   implicitly sets overflow-y to `auto`, making <body> a scroll container.
  //   position:sticky sticks relative to its nearest scroll container — which is
  //   now <body>, not the viewport — so it never actually sticks. position:fixed
  //   is always relative to the viewport and is unaffected by parent overflow.
  //
  // Layout:
  //   Desktop (lg+): flex row — left column scrolls images, right column is an
  //     invisible placeholder preserving the 50% width. The info panel is a
  //     separate fixed overlay covering exactly that same right 50%.
  //   Mobile: stacked — back link → images → info panel, all normal flow.
  //
  const isRtl      = lang === "ar";
  // Fixed panel anchors to the reading-end of the viewport (right in LTR, left in RTL).
  const fixedSide  = isRtl ? "lg:left-0" : "lg:right-0";

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
        <div className={`lg:w-1/2 lg:shrink-0 lg:pt-28`}>
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

        {/* ── RIGHT: placeholder + fixed info panel ──────────────────────────
            The outer div (lg:w-1/2) is invisible and only reserves layout space
            so the left image column doesn't expand to full width on desktop.
            The inner div is position:fixed on desktop, normal flow on mobile. */}
        <div className="lg:w-1/2 lg:shrink-0">
          <div
            className={[
              // Mobile: normal padded block
              "px-6 py-10",
              // Desktop: fixed overlay anchored below the navbar, right half of viewport
              `lg:fixed lg:top-28 lg:bottom-0 ${fixedSide}`,
              "lg:w-1/2 lg:overflow-y-auto lg:bg-stone-50",
              "lg:px-16 lg:py-0 lg:pt-12 lg:pb-24",
            ].join(" ")}
          >
            {/* Desktop back link */}
            <Link
              to="/shop"
              className="hidden lg:inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors mb-10"
            >
              <ArrowLeft size={14} />
              {t.back}
            </Link>

            <div className="flex flex-col gap-5">
              {product.sku && (
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400">
                  {t.sku}: {product.sku}
                </p>
              )}

              <h1 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-none">
                {title}
              </h1>

              <p className="font-sans font-bold text-2xl text-stone-900">
                {product.currency} {product.price?.toLocaleString()}
              </p>

              <span className={`self-start text-[9px] font-bold uppercase tracking-[0.2em] border px-3 py-1 ${availBadgeClass}`}>
                {availLabel}
              </span>

              {description && (
                <div className="border-t border-stone-200 pt-5">
                  <p className="font-serif italic text-stone-600 leading-relaxed text-base">
                    {description}
                  </p>
                </div>
              )}

              <div className="pt-2">
                {canBuy ? (
                  <button
                    onClick={handleAddToCart}
                    className={`w-full px-10 py-4 font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-all duration-300 ${
                      justAdded
                        ? "bg-stone-600 text-white"
                        : "bg-stone-900 text-white hover:bg-stone-700"
                    }`}
                  >
                    {justAdded
                      ? t.added
                      : product.availability === "made_to_order"
                      ? t.inquire
                      : t.addToCart}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-10 py-4 font-sans font-bold text-[11px] uppercase tracking-[0.25em] bg-stone-200 text-stone-400 cursor-not-allowed"
                  >
                    {t.notAvailable}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
