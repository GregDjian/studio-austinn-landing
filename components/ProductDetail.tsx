import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Globe, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { SiApplepay } from "react-icons/si";
import { Language, Product, ChainConfig } from "../types";
import { getProductBySlug } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import { useCart } from "./CartContext";
import ChainBuilder from "./ChainBuilder";
import ProductImageCarousel from "./ProductImageCarousel";
import ArWallButton from "./ArWallButton";
import { useDeliveryPolicy } from "./DeliveryReturnsModal";
import Footer from "./Footer";

// Matches actual desktop navbar height: py-4 (1rem) + logo h-20 (5rem) + py-4 (1rem) = 7rem.
// Mobile (logo h-16): 1 + 4 + 1 = 6rem.
const NAV_H_MOBILE  = "pt-24";    // 6rem — logo h-16 + py-4 × 2
const NAV_H_DESKTOP = "md:pt-28"; // 7rem — logo h-20 + py-4 × 2

interface ProductDetailProps {
  lang: Language;
  setLang?: (lang: Language) => void;
  onOpenCheckout?: () => void;
  onCartOpen?: () => void;
  /** Loose-link products render full screen: the app hides its header and chat bubble. */
  onImmersiveChange?: (immersive: boolean) => void;
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
      sku:             "الرمز",
      loading:         "جارٍ التحميل…",
      notFound:        "المنتج غير موجود.",
      added:           "تمت الإضافة ✓",
      perLink:         "/ حلقة",
      quickBuy:        "دفع سريع",
      trustPrefix:     "بإتمام طلبك، أنت توافق على",
      termsLink:       "سياسة التوصيل والإرجاع",
      dimensionsLabel: "الأبعاد",
      materialsLabel:  "المواد",
      noDetails:       "لا تفاصيل متاحة.",
      variantLabel:    "الخيارات",
      inclVat:         "شامل الضريبة",
      sizeLabel:       "المقاس",
      tabs: {
        description: "الوصف",
        dimensions:  "الأبعاد والمواد",
        delivery:    "التسليم والإرجاع",
      },
      deliveryInStock:     "هذه القطعة جاهزة للشحن. تُسلَّم خلال 24–72 ساعة في أنحاء الإمارات.",
      deliveryMadeToOrder: "هذه القطعة تُصنع بالطلب. مدة التنفيذ المعتادة من أسبوع إلى أربعة أسابيع داخل الإمارات، بحسب ضغط الإنتاج الحالي.",
      deliverySold:        "هذه القطعة غير متوفرة حالياً. تواصل معنا لطلب خاص.",
      deliveryPolicyLink:  "عرض سياسة التوصيل والإرجاع كاملة ←",
    };
  }
  return {
    back:            "Back to Shop",
    inStock:         "In Stock",
    sold:            "Sold",
    madeToOrder:     "Made to Order",
    addToCart:       "Add to Cart",
    notAvailable:    "Not Available",
    sku:             "SKU",
    loading:         "Loading…",
    notFound:        "Product not found.",
    added:           "Added ✓",
    perLink:         "/ link",
    quickBuy:        "Express Payment",
    trustPrefix:     "By placing your order you agree to the",
    termsLink:       "delivery & returns policy",
    dimensionsLabel: "Dimensions",
    materialsLabel:  "Materials",
    noDetails:       "No details available.",
    variantLabel:    "Variants",
    inclVat:         "incl. VAT",
    sizeLabel:       "Size",
    tabs: {
      description: "Description",
      dimensions:  "Dimensions & Materials",
      delivery:    "Delivery & Returns",
    },
    deliveryInStock:     "This piece is ready to ship. Delivered within 24–72 hours across the UAE.",
    deliveryMadeToOrder: "This piece is crafted to order. Standard lead time is 1–4 weeks within the UAE, depending on current production load.",
    deliverySold:        "This piece is currently unavailable. Contact us for a custom commission.",
    deliveryPolicyLink:  "View our full Delivery & Returns policy →",
  };
};

// Description clamped to a few lines, with a toggle to read the rest.
const ClampedText: React.FC<{ text: string; lang: Language }> = ({ text, lang }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <p className={`font-serif italic text-stone-500 text-xs leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>{text}</p>
      {text.length > 140 && (
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors"
      >
        {expanded ? (lang === "ar" ? "أقل" : "Less") : (lang === "ar" ? "المزيد" : "More")}
      </button>
      )}
    </div>
  );
};

const ProductDetail: React.FC<ProductDetailProps> = ({ lang, setLang, onOpenCheckout, onCartOpen, onImmersiveChange }) => {
  const { slug }                      = useParams<{ slug: string }>();
  // ?variant=<key> (set by the shop grid's hover thumbnails) pre-selects a variant.
  const [searchParams]                = useSearchParams();
  const variantParam                  = searchParams.get("variant");
  const sizeParam                     = searchParams.get("size");
  const [product, setProduct]         = useState<Product | null>(null);
  const [fetching, setFetching]       = useState(true);
  const [justAdded, setJustAdded]     = useState(false);
  const [activeTab, setActiveTab]     = useState<"description" | "dimensions" | "delivery">("description");
  // Mobile accordion: one open section at a time (null = all closed). Description opens first.
  const [openSection, setOpenSection] = useState<"description" | "dimensions" | "delivery" | null>("description");
  // Selected colour variant (by _key). null / unknown key → first variant. Bundle products only.
  const [variantKey, setVariantKey]   = useState<string | null>(null);
  // Selected size option (by _key). null / unknown key → first size. Bundle products only.
  const [sizeKey, setSizeKey]         = useState<string | null>(null);
  const { addItem, addLooseLinkItem, itemCount } = useCart();
  const openDeliveryPolicy            = useDeliveryPolicy();
  const t = getContent(lang);

  useEffect(() => {
    if (!slug) return;
    setFetching(true);
    setVariantKey(variantParam);
    setSizeKey(sizeParam);
    getProductBySlug(slug)
      .then(setProduct)
      .finally(() => setFetching(false));
  }, [slug, variantParam, sizeParam]);

  const isLooseLink = product?.productType === "loose-link";
  useEffect(() => {
    onImmersiveChange?.(isLooseLink);
    return () => onImmersiveChange?.(false);
  }, [isLooseLink, onImmersiveChange]);

  // Variants only exist on bundle products; without them everything below falls
  // back to the product-level values.
  const variants        = product && product.productType !== "loose-link" ? (product.variants ?? []).filter((v) => v?.image && v.name) : [];
  const selectedVariant = variants.find((v) => v._key === variantKey) ?? variants[0];
  // Size options (free-text label + own price). Shipping/availability stay product-level.
  const sizes           = product && product.productType !== "loose-link"
    ? (product.sizes ?? []).filter((s) => s?.label && typeof s.price === "number")
    : [];
  const selectedSize    = sizes.find((s) => s._key === sizeKey) ?? sizes[0];
  const displayPrice    = selectedSize?.price ?? product?.price;
  const availability    = selectedVariant?.availability ?? product?.availability;

  // Preload variant photos so switching variants never shows an empty frame.
  useEffect(() => {
    variants.forEach((v) => {
      if (v.image) new Image().src = imgUrl.full(v.image);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const buildCartItem = () => {
    if (!product) return null;
    const baseTitle   = product.title.en;
    const variantName = selectedVariant ? selectedVariant.name.en : undefined;
    const sizeLabel   = selectedSize?.label;
    const photo       = selectedVariant?.image ?? product.images?.[0];
    return {
      productId:    product._id,
      slug:         product.slug.current,
      title:        [baseTitle, variantName, sizeLabel].filter(Boolean).join(" — "),
      variantName,
      sizeLabel,
      price:        displayPrice ?? 0,
      currency:     product.currency,
      image:        photo ? imgUrl.thumb(photo) : "",
      availability: availability!,
      collection:   product.collection,
    };
  };

  const handleAddToCart = () => {
    const item = buildCartItem();
    if (!item || availability === "sold") return;
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleQuickBuy = () => {
    const item = buildCartItem();
    if (!item || availability === "sold") return;
    addItem(item);
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

  const title       = product.title?.en       ?? "";
  const description = product.description?.en ?? "";
  // No description → the Description tab is hidden and Dimensions & Materials opens first.
  const tabs        = (["description", "dimensions", "delivery"] as const).filter((tab) => tab !== "description" || description);
  const currentTab  = tabs.includes(activeTab) ? activeTab : tabs[0];
  // Accordion: without a description, the first available section opens instead.
  const currentSection = openSection === "description" && !description ? tabs[0] : openSection;
  const baseImages  = product.images ?? [];

  const variantName = selectedVariant ? selectedVariant.name.en : "";
  const displayTitle = variantName ? `${title} — ${variantName}` : title;
  // With colour variants, the selected variant's photo comes first, followed by the product's
  // general images, minus any that is another variant's photo (so a Gold selection never shows
  // the Silver one). Without variants, the product's images.
  const assetRef = (img: any): string | undefined => img?.asset?._ref;
  const images = selectedVariant?.image
    ? (() => {
        const variantRefs = new Set(variants.map((v) => assetRef(v.image)).filter(Boolean));
        const extras = baseImages.filter((img) => {
          const ref = assetRef(img);
          return ref && !variantRefs.has(ref);
        });
        return [selectedVariant.image, ...extras];
      })()
    : baseImages;

  const availLabel =
    availability === "in_stock"   ? t.inStock
    : availability === "sold"     ? t.sold
    : t.madeToOrder;

  const availBadgeClass =
    availability === "in_stock"
      ? "text-stone-600 border-stone-400"
      : availability === "sold"
      ? "text-stone-400 border-stone-300"
      : "text-amber-700 border-amber-400";

  const canBuy = availability !== "sold";

  // ── Loose-link: full-screen builder ──────────────────────────────────────────
  // No site header / footer / chat (see onImmersiveChange): the builder takes the
  // whole screen, with its own small header — back, logo, title — plus cart and language.
  if (product.productType === "loose-link") {
    // Page title (replaces the product name on this page).
    const builderTitle = lang === "ar" ? "صمّم سلسلتك الخاصة" : "Build your own chain link";
    const pricePerLinkLabel = `${product.currency} ${product.pricePerLink?.toLocaleString()} ${t.perLink}`;
    const toggleLang = () => setLang?.(lang === "en" ? "ar" : "en");

    const backLink = (compact: boolean) => (
      <Link
        to="/shop"
        aria-label={t.back}
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft size={compact ? 18 : 14} className="rtl:rotate-180" />
        {!compact && t.back}
      </Link>
    );

    const logo = (className: string) => (
      <a href="/" aria-label="Studio Austinn — Home" className="flex-shrink-0">
        <img src="/logo/SA_logo.png" alt="Studio Austinn" className={`${className} w-auto`} draggable={false} />
      </a>
    );

    const cartButton = (
      <button
        type="button"
        onClick={onCartOpen}
        aria-label={lang === "ar" ? "السلة" : "Shopping cart"}
        className="relative text-stone-900 hover:text-stone-600 transition-colors"
      >
        <ShoppingBag size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </button>
    );

    const langButton = setLang && (
      <button
        type="button"
        onClick={toggleLang}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors"
      >
        <Globe size={14} />
        {lang === "en" ? "AR" : "EN"}
      </button>
    );

    const descriptionText = description && (
      <p className="font-serif italic text-stone-500 text-sm leading-relaxed">{description}</p>
    );

    const availBadge = (
      <span className={`self-start text-[9px] font-bold uppercase tracking-[0.2em] border px-2.5 py-0.5 ${availBadgeClass}`}>
        {availLabel}
      </span>
    );

    return (
      <ChainBuilder
        colorOptions={product.colorOptions ?? []}
        pricePerLink={product.pricePerLink ?? 0}
        currency={product.currency}
        lang={lang}
        justAdded={justAdded}
        sidebarHeader={
          <div className="flex flex-col gap-5 pb-5 border-b border-stone-200">
            <div className="flex items-center justify-between gap-3">
              {backLink(false)}
              {logo("h-10")}
            </div>
            <div className="flex flex-col gap-2">
              {product.sku && (
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400">
                  {t.sku}: {product.sku}
                </p>
              )}
              <h1 className="font-sans font-black text-2xl uppercase tracking-tighter text-stone-900 leading-none">
                {builderTitle}
              </h1>
              <p className="font-sans font-bold text-sm text-stone-500">{pricePerLinkLabel}</p>
              {availBadge}
              {description && <ClampedText text={description} lang={lang} />}
            </div>
          </div>
        }
        sidebarFooter={
          <div className="flex items-center justify-between">
            {langButton}
            {cartButton}
          </div>
        }
        mobileTopBar={
          <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-stone-200">
            {backLink(true)}
            {logo("h-8")}
            <div className="flex-1 min-w-0">
              <h1 className="font-sans font-black text-sm uppercase tracking-tighter text-stone-900 leading-none truncate">
                {builderTitle}
              </h1>
              <p className="text-[10px] font-bold text-stone-400 mt-0.5 truncate">{pricePerLinkLabel}</p>
            </div>
            {langButton}
            {cartButton}
          </div>
        }
        mobileDetails={
          <div className="flex flex-col gap-2 pb-4 border-b border-stone-200">
            {availBadge}
            {descriptionText}
          </div>
        }
        onAddToCart={(config: ChainConfig) => {
          addLooseLinkItem({
            productId:     product._id,
            productType:   "loose-link",
            title:         product.title.en,
            currency:      product.currency,
            configuration: { columns: config.columns },
            totalLinks:    config.totalLinks,
            pricePerLink:  product.pricePerLink ?? 0,
            lineTotal:     config.lineTotal,
            colorSummary:  config.colorSummary,
            previewImage:  config.previewImage,
          });
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 2000);
        }}
      />
    );
  }

  // ── Bundle: two-column layout ─────────────────────────────────────────────────
  //
  // Layout (desktop lg+):
  //   flex row — left column is a one-at-a-time image carousel, right column is
  //   the info panel. Both are (100vh − navbar) tall, so the first screen shows
  //   the whole product; the info panel scrolls internally if its content is
  //   taller. The footer starts right after the row.
  //
  // Mobile: stacked — back link → carousel → info panel, all normal flow.
  //
  const isRtl = lang === "ar";

  const dimensions = product.dimensions?.en ?? "";
  // Selected variant's materials, falling back to the product's own when empty.
  const materials  = selectedVariant?.materials?.en?.trim() || product.materials?.en || "";

  // AR wall preview (paintings only): the selected size's AR dimensions, falling
  // back to the product-level ones. Hidden unless both width and height are set.
  const arDims =
    selectedSize?.arWidthCm && selectedSize?.arHeightCm ? selectedSize
    : product.arWidthCm && product.arHeightCm ? product
    : null;
  const arImage = product.collection === "paintings" && arDims && product.images?.[0]
    ? imgUrl.ar(product.images[0])
    : null;

  // Content of one tab / accordion section.
  const renderPanel = (tab: "description" | "dimensions" | "delivery") => (
    <>
                  {tab === "description" && (
                    <p className="font-serif text-stone-600 text-sm leading-relaxed">{description}</p>
                  )}

                  {tab === "dimensions" && (
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

                  {tab === "delivery" && (
                    <div className="flex flex-col gap-3">
                      <p className="font-serif text-stone-600 text-sm leading-relaxed">
                        {availability === "in_stock"
                          ? t.deliveryInStock
                          : availability === "sold"
                          ? t.deliverySold
                          : t.deliveryMadeToOrder}
                      </p>
                      <button
                        type="button"
                        onClick={openDeliveryPolicy}
                        className="self-start text-[11px] text-stone-600 hover:text-stone-900 underline underline-offset-4 transition-colors"
                      >
                        {t.deliveryPolicyLink}
                      </button>
                    </div>
                  )}
    </>
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-stone-50 min-h-screen"
    >
      {/* Mobile-only navbar clearance + back link */}
      <div className={`lg:hidden px-6 pb-6 pt-28 ${NAV_H_DESKTOP}`}>
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

        {/* ── LEFT: image carousel ───────────────────────────────────────────
            On desktop: starts exactly at the navbar bottom (lg:pt-28 = 7rem)
            and fills the rest of the viewport.
            On mobile:  flows after the back-link div above, no extra top gap. */}
        <div className="lg:w-1/2 lg:shrink-0 lg:pt-28">
          <ProductImageCarousel
            // Re-key on variant so the carousel jumps back to slide 1.
            key={`${product._id}:${selectedVariant?._key ?? ""}`}
            images={images}
            title={displayTitle}
            isRtl={isRtl}
          />
        </div>

        {/* ── RIGHT: info panel ──────────────────────────────────────────────
            Same height as the carousel on desktop (viewport minus navbar);
            content scrolls internally when it is taller than that. */}
        <div className="lg:w-1/2 lg:shrink-0 lg:pt-28">
          <div
            className={[
              // Mobile: normal padded block
              "px-6 py-10",
              // Desktop: full height minus navbar, scrollable internally
              "lg:h-[calc(100vh-7rem)]",
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

              {/* ── Title row: title left · availability badge right.
                  Mobile: badge stacks above the title so long names can't collide. ── */}
              <div className="flex flex-col-reverse items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                <div className="flex flex-col gap-2 w-full md:w-auto md:flex-1 min-w-0">
                  <h1 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-none">
                    {displayTitle}
                  </h1>
                </div>
                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] border px-3 py-1 ${availBadgeClass}`}>
                  {availLabel}
                </span>
              </div>

              {/* Variants — one photo thumbnail + name per variant. Bundle products with variants only. */}
              {variants.length > 0 && (
                <div className="flex flex-col gap-3 mt-6">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
                    {t.variantLabel}
                  </span>
                  <div className="flex flex-wrap items-start gap-4">
                    {variants.map((v) => {
                      const name     = v.name.en;
                      const selected = v._key === selectedVariant?._key;
                      return (
                        <div key={v._key} className="flex flex-col items-center gap-1.5 w-16">
                          <button
                            type="button"
                            onClick={() => setVariantKey(v._key)}
                            aria-label={name}
                            aria-pressed={selected}
                            title={name}
                            className={`w-16 h-16 shrink-0 overflow-hidden bg-stone-100 border-2 transition-colors ${
                              selected
                                ? "border-stone-900"
                                : "border-transparent opacity-70 hover:opacity-100 hover:border-stone-300"
                            }`}
                          >
                            <img
                              src={imgUrl.thumb(v.image)}
                              alt={name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          </button>
                          <span className={`w-full text-center text-[9px] leading-tight break-words transition-colors ${selected ? "text-stone-900 font-bold" : "text-stone-500"}`}>
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size options — free-text label with its own price. Bundle products with sizes only. */}
              {sizes.length > 0 && (
                <div className="flex flex-col gap-3 mt-6">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
                    {t.sizeLabel}
                  </span>
                  <div className="flex flex-wrap items-stretch gap-2">
                    {sizes.map((sz) => {
                      const selected = sz._key === selectedSize?._key;
                      return (
                        <button
                          key={sz._key}
                          type="button"
                          onClick={() => setSizeKey(sz._key)}
                          aria-pressed={selected}
                          className={`flex flex-col items-center gap-0.5 px-4 py-2.5 border-2 transition-colors ${
                            selected
                              ? "border-stone-900 text-stone-900"
                              : "border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-900"
                          }`}
                        >
                          <span className="font-sans font-bold text-[11px] tracking-tight whitespace-nowrap">
                            {sz.label}
                          </span>
                          <span className="text-[9px] tracking-wide opacity-70">
                            {product.currency} {sz.price.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AR wall preview at the selected size — AR-capable phones only. */}
              {arImage && arDims && (
                <ArWallButton
                  lang={lang}
                  imageUrl={arImage}
                  widthCm={arDims.arWidthCm!}
                  heightCm={arDims.arHeightCm!}
                  className="mt-6"
                />
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
                      {justAdded ? t.added : t.addToCart}
                    </span>
                    <span className="opacity-75 font-bold">
                      {product.currency} {displayPrice?.toLocaleString()}<span className="ms-2 text-[8px] tracking-widest font-normal opacity-70">{t.inclVat}</span>
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full h-[52px] px-6 rounded-md font-sans font-bold text-[11px] uppercase tracking-[0.25em] bg-stone-200 text-stone-400 cursor-not-allowed flex items-center justify-between gap-4"
                  >
                    <span>{t.notAvailable}</span>
                    <span className="opacity-60">
                      {product.currency} {displayPrice?.toLocaleString()}<span className="ms-2 text-[8px] tracking-widest font-normal opacity-70">{t.inclVat}</span>
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
                  <button
                    type="button"
                    onClick={openDeliveryPolicy}
                    className="underline underline-offset-2 hover:text-stone-600 transition-colors"
                  >
                    {t.termsLink}
                  </button>
                </p>
              </div>

              {/* ── Tabbed section: horizontal tabs on md+, accordion below ──── */}
              <div className="mt-20 md:border-t md:border-stone-200 md:pt-6">

                {/* Desktop / tablet: horizontal tabs (unchanged) */}
                <div className="hidden md:block">
                  {/* Tab bar */}
                  <div
                    role="tablist"
                    className="flex gap-6 border-b border-stone-200 overflow-x-auto pb-px"
                  >
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={currentTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={[
                          "pb-3 text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors",
                          "border-b-2 -mb-px",
                          currentTab === tab
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
                    {renderPanel(currentTab)}
                  </div>
                </div>

                {/* Mobile: accordion — one section open at a time. In RTL the flex row
                    flips on its own, so the +/− icon sits on the left. */}
                <div className="md:hidden border-b border-stone-200">
                  {tabs.map((tab) => {
                    const isOpen = currentSection === tab;
                    return (
                      <div key={tab} className="border-t border-stone-200">
                        <button
                          type="button"
                          id={`acc-btn-${tab}`}
                          aria-expanded={isOpen}
                          aria-controls={`acc-panel-${tab}`}
                          onClick={() => setOpenSection(isOpen ? null : tab)}
                          className="w-full flex items-center justify-between gap-4 py-4 text-start"
                        >
                          <span
                            className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${
                              isOpen ? "text-stone-900" : "text-stone-500"
                            }`}
                          >
                            {t.tabs[tab]}
                          </span>
                          {isOpen
                            ? <Minus size={14} className="text-stone-400 flex-shrink-0" />
                            : <Plus  size={14} className="text-stone-400 flex-shrink-0" />}
                        </button>
                        <div
                          id={`acc-panel-${tab}`}
                          role="region"
                          aria-labelledby={`acc-btn-${tab}`}
                          className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out ${
                            isOpen ? "grid-rows-[1fr] visible" : "grid-rows-[0fr] invisible"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="pt-1 pb-5">{renderPanel(tab)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

      <Footer lang={lang} />

    </div>
  );
};

export default ProductDetail;
