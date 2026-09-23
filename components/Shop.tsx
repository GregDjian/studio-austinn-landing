import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LayoutGrid, ChevronDown, Check } from "lucide-react";
import { Availability, Language, Product } from "../types";
import { getProducts, getCollections, CollectionMeta } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import { SHOW_ARTISTIC_PARTITIONS } from "../lib/shopConfig";
import Button from "./Button";
import Footer from "./Footer";

interface ShopProps {
  lang: Language;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      heading:              "بوتيك",
      subheading:           "قطع مختارة لاقتنائها",
      inStock:              "متوفر",
      sold:                 "مُباع",
      madeToOrder:          "يُصنع بالطلب",
      noProducts:           "لا توجد منتجات متاحة حالياً.",
      noProductsCollection: "لا توجد منتجات في هذه المجموعة.",
      loading:              "جارٍ التحميل…",
      viewProduct:          "عرض المنتج",
      readMore:             "اقرأ المزيد",
      noImage:              "لا توجد صورة",
      all:                  "الكل",
      artLinks:             "أورا لينك",
      artisticPartitions:   "فواصل فنية",
      paintings:            "لوحات",
      products:             "منتج",
      shopLabel:            "متجر ستوديو أوستين",
      loadMore:             "تحميل المزيد",
      statementLead:        "كل قطعة يبتكرها ستوديو أوستن أو بالشراكة مع ستوديو أوستن. فنّنا مصنوع يدوياً في قلب دبي، في أتيليه ستوديو أوستن. لأي طلب خاص،",
      contactUs:            "تواصل معنا",
      filter:               "المجموعة",
      sort:                 "ترتيب",
      sortPriceAsc:         "السعر: من الأقل إلى الأعلى",
      sortPriceDesc:        "السعر: من الأعلى إلى الأقل",
      sortNewest:           "الأحدث أولاً",
      chainLabel:           "صمّم بنفسك",
      chainBlurb:           "اختر ألوانك، ورتّب حلقاتك، وشاهد سلسلتك تتشكّل في معاينة لغرفة حقيقية.",
      chainCta:             "ابدأ التصميم",
    };
  }
  return {
    heading:              "Boutique",
    subheading:           "Selected works available to acquire",
    inStock:              "In Stock",
    sold:                 "Sold",
    madeToOrder:          "Made to Order",
    noProducts:           "No products available at this time.",
    noProductsCollection: "No products in this collection.",
    loading:              "Loading…",
    viewProduct:          "View product",
    readMore:             "Read more",
    noImage:              "No image",
    all:                  "All",
    artLinks:             "Aura Link",
    artisticPartitions:   "Artistic Partitions",
    paintings:            "Paintings",
    products:             "Products",
    shopLabel:            "Studio Austinn Online Shop",
    loadMore:             "Load More",
    statementLead:        "Every piece is created by Studio Austinn or in partnership with Studio Austinn. Our art is handcrafted in the heart of Dubai, at the Studio Austinn Atelier. For any custom request,",
    contactUs:            "contact us",
    filter:               "Collection",
    sort:                 "Sort",
    sortPriceAsc:         "Price: Low to High",
    sortPriceDesc:        "Price: High to Low",
    sortNewest:           "Newest first",
    chainLabel:           "Design your own",
    chainBlurb:           "Choose your colours, stack your links and watch your chain come to life in a real room preview.",
    chainCta:             "Start building",
  };
};

type SortMode = "" | "price-asc" | "price-desc" | "newest";

// Collection enum values — matches Sanity schema field options.
// Missing/null collection on existing documents is treated as "art-links".
const COLLECTION_KEY_ALL       = null;
const COLLECTION_KEY_ART_LINKS = "art-links";
const COLLECTION_KEY_PARTITIONS = "artistic-partitions";
const COLLECTION_KEY_PAINTINGS  = "paintings";

// "Load More" batch size. The grid renders sortedProducts.slice(0, visibleCount).
const PAGE_SIZE = 15;

const Shop: React.FC<ShopProps> = ({ lang }) => {
  const [products, setProducts]               = useState<Product[]>([]);
  const [rawCollections, setRawCollections]   = useState<CollectionMeta[]>([]);
  const [fetching, setFetching]               = useState(true);
  const [activeCollection, setActiveCollection] = useState<string | null>(COLLECTION_KEY_ALL);
  const [filterOpen, setFilterOpen]           = useState(true);
  const [sortMode, setSortMode]               = useState<SortMode>("");
  const [sortOpen, setSortOpen]               = useState(false);
  const [visibleCount, setVisibleCount]       = useState(PAGE_SIZE);
  // Hover-thumbnail choice per card (productId → variant _key). Passed to the
  // detail page as ?variant=<key> so it opens on the variant that was picked.
  const [cardVariant, setCardVariant]         = useState<Record<string, string>>({});
  const sortRef = useRef<HTMLDivElement>(null);
  const t = getContent(lang);

  // Reset the "Load More" window whenever the visible set changes underneath it.
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCollection, sortMode]);

  // Close the Sort menu on outside click / touch and on Escape.
  useEffect(() => {
    if (!sortOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSortOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortOpen]);

  useEffect(() => {
    Promise.all([getProducts(), getCollections()])
      .then(([prods, colls]) => {
        setProducts(prods);
        setRawCollections(colls);
      })
      .finally(() => setFetching(false));
  }, []);

  // Each tile merges i18n label (authoritative) with Sanity image (optional until uploaded).
  const collectionTiles = [
    { key: COLLECTION_KEY_ART_LINKS,  label: t.artLinks },
    ...(SHOW_ARTISTIC_PARTITIONS ? [{ key: COLLECTION_KEY_PARTITIONS, label: t.artisticPartitions }] : []),
    { key: COLLECTION_KEY_PAINTINGS,  label: t.paintings },
  ].map(({ key, label }) => {
    const meta = rawCollections.find(c => c.key === key);
    return { key, label, imageUrl: meta ? imgUrl.thumb(meta.image) : null };
  });

  // Normalise missing collection → "art-links" so old documents fall under Aura Link.
  const resolveCollection = (p: Product) => p.collection ?? COLLECTION_KEY_ART_LINKS;

  const visibleProducts = activeCollection === COLLECTION_KEY_ALL
    ? products
    : products.filter(p => resolveCollection(p) === activeCollection);

  // Client-side sort applied on top of the collection filter. "" keeps Sanity's
  // original order (featured first, then newest).
  const priceOf = (p: Product) =>
    p.productType === "loose-link" ? p.pricePerLink ?? 0 : p.price ?? 0;

  const sortedProducts = useMemo(() => {
    let list = visibleProducts;
    if (sortMode !== "") {
      list = [...visibleProducts];
      if (sortMode === "price-asc")       list.sort((a, b) => priceOf(a) - priceOf(b));
      else if (sortMode === "price-desc") list.sort((a, b) => priceOf(b) - priceOf(a));
      else                                list.sort((a, b) => (b._createdAt ?? "").localeCompare(a._createdAt ?? ""));
    }

    // The "build your own chain" feature card always sits directly before the first
    // Aura Link product in the current list. If no Aura Link product is visible it
    // stays where it already is.
    const builderIdx = list.findIndex((p) => p.productType === "loose-link");
    if (builderIdx === -1) return list;
    const withoutBuilder = list.filter((_, i) => i !== builderIdx);
    const firstAuraIdx = withoutBuilder.findIndex(
      (p) => p.productType !== "loose-link" && resolveCollection(p) === COLLECTION_KEY_ART_LINKS,
    );
    if (firstAuraIdx === -1) return list;
    withoutBuilder.splice(firstAuraIdx, 0, list[builderIdx]);
    return withoutBuilder;
  }, [visibleProducts, sortMode]);

  // Only the first `visibleCount` products render; "Load More" raises the count.
  const displayedProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount],
  );
  const hasMore = visibleCount < sortedProducts.length;

  const sortOptions: { value: Exclude<SortMode, "">; label: string }[] = [
    { value: "price-asc",  label: t.sortPriceAsc },
    { value: "price-desc", label: t.sortPriceDesc },
    { value: "newest",     label: t.sortNewest },
  ];
  const currentSortLabel = sortOptions.find((o) => o.value === sortMode)?.label ?? t.sort;

  const availabilityLabel = (a: Availability) =>
    a === "in_stock" ? t.inStock : a === "sold" ? t.sold : t.madeToOrder;

  const formatPrice = (product: Product) =>
    product.productType === "loose-link"
      ? `${product.currency} ${product.pricePerLink?.toLocaleString()} ${lang === "ar" ? "/ رابط" : "/ link"}`
      : `${product.currency} ${product.price?.toLocaleString()}`;

  // Slide-up hover strip — price + availability. No tint, no cover.
  // Hidden on touch devices (no hover); the card shows price under the name instead.
  const hoverStrip = (product: Product) => (
    <div className="[@media(hover:none)]:hidden absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 px-3 py-2">
      <span className="font-sans font-bold text-[9px] md:text-[10px] uppercase tracking-tight text-stone-900">
        {formatPrice(product)}
      </span>
      <span className="font-sans font-medium text-[9px] md:text-[10px] uppercase tracking-tight text-stone-900">
        {availabilityLabel(product.availability)}
      </span>
    </div>
  );

  const productImage = (product: Product, title: string, size: "card" | "full" = "card", source: any = product.images?.[0]) =>
    source ? (
      <img
        src={size === "full" ? imgUrl.full(source) : imgUrl.card(source)}
        alt={title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-widest text-stone-300">
        {t.noImage}
      </div>
    );

  // ── Featured card — the loose-link "build your own chain" product ────────────
  // Spans 2 columns on desktop (half the grid), full width on smaller screens. It sits
  // in the normal product order, so collection filters / sorting apply to it like any
  // other product. Image on one side, text + CTA on the other (stacked on mobile).
  const renderFeaturedCard = (product: Product) => {
    const title = product.title?.en ?? "";
    return (
      <Link
        key={product._id}
        to={`/shop/${product.slug.current}`}
        className="group col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col lg:flex-row bg-stone-100 lg:min-h-[28rem]"
      >
        <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto lg:w-1/2 lg:flex-none">
          {product.images?.[0] ? (
            <img
              src={imgUrl.full(product.images[0])}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-widest text-stone-300">
              {t.noImage}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-4 px-6 py-8 md:px-10 lg:w-1/2">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
            {t.chainLabel}
          </span>
          <h2 className="font-sans font-black text-3xl md:text-4xl uppercase tracking-tighter text-stone-900 leading-none">
            {title}
          </h2>
          <p className="font-sans font-bold text-sm text-stone-500">{formatPrice(product)}</p>
          <p className="font-serif italic text-stone-600 text-sm md:text-base leading-relaxed max-w-md">
            {t.chainBlurb}
          </p>
          <span className="mt-2 inline-flex items-center self-start h-[48px] px-8 rounded-md bg-stone-900 text-white font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-colors group-hover:bg-stone-700">
            {t.chainCta}
          </span>
        </div>
      </Link>
    );
  };

  // ── Regular grid card ──────────────────────────────────────────────────────
  // Dense 4-up catalogue tile: full-bleed image (no mat, no border, no radius)
  // with the name below it; price appears in the slide-up hover strip, or under
  // the name on touch devices.
  const renderCard = (product: Product) => {
    if (product.productType === "loose-link") return renderFeaturedCard(product);
    const title    = product.title?.en ?? "";
    const variants = (product.variants ?? []).filter((v) => v?.image && v.name);
    const activeVariant = variants.find((v) => v._key === cardVariant[product._id]);

    // Warm the cache on first hover so a thumbnail click swaps instantly.
    const preloadVariants = () =>
      variants.forEach((v) => { new Image().src = imgUrl.card(v.image); });

    return (
      <Link
        key={product._id}
        to={`/shop/${product.slug.current}${activeVariant ? `?variant=${encodeURIComponent(activeVariant._key)}` : ""}`}
        className="group flex flex-col"
        onPointerEnter={variants.length > 0 ? preloadVariants : undefined}
      >
        <div className="relative overflow-hidden bg-stone-100 aspect-[4/5]">
          {productImage(product, title, "card", activeVariant?.image ?? product.images?.[0])}

          {/* Variant thumbnails — overlaid just above the hover strip (strip ≈ 2rem
              tall), so they add no height. Fade in with the hover state; inert
              until then so they can't be hit while invisible. */}
          {variants.length > 0 && (
            <div className="absolute inset-x-0 bottom-10 px-2 flex flex-wrap justify-center gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-500">
              {variants.map((v) => {
                const name   = v.name.en;
                const active = v._key === activeVariant?._key;
                return (
                  <button
                    key={v._key}
                    type="button"
                    aria-label={name}
                    aria-pressed={active}
                    title={name}
                    onClick={(e) => {
                      // The card is a link — keep the click on the thumbnail.
                      e.preventDefault();
                      e.stopPropagation();
                      // Clicking the active thumbnail returns to the cover image.
                      setCardVariant((prev) => {
                        const next = { ...prev };
                        if (active) delete next[product._id];
                        else next[product._id] = v._key;
                        return next;
                      });
                    }}
                    className={`w-12 h-12 overflow-hidden bg-stone-100 border shadow-sm transition-colors ${
                      active ? "border-stone-50" : "border-stone-50/40 hover:border-stone-50/80"
                    }`}
                  >
                    <img
                      src={imgUrl.thumb(v.image)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {hoverStrip(product)}
        </div>
        <div className="pt-2.5 pb-1 text-center">
          <h2 className="font-sans font-bold text-[10px] uppercase tracking-tight text-stone-900 leading-snug line-clamp-2">
            {title}
          </h2>
          {/* Touch devices can't hover, so show price + availability inline. */}
          <p className="hidden [@media(hover:none)]:block mt-1 font-sans font-medium text-[9px] uppercase tracking-tight text-stone-500">
            {formatPrice(product)} · {availabilityLabel(product.availability)}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <>
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-stone-50 pt-36 pb-24 px-6 md:px-12"
    >
      {/* ── Editorial statement — stands in for the page title ─────────────── */}
      <p className="max-w-2xl mx-auto mb-12 md:mb-16 text-center font-serif italic text-stone-500 text-sm md:text-base leading-relaxed">
        {t.statementLead}{" "}
        <Link
          to="/#contact"
          className="text-stone-700 underline decoration-stone-300 underline-offset-[3px] hover:text-stone-900 hover:decoration-stone-900 transition-colors"
        >
          {t.contactUs}
          <span className="inline-block not-italic ml-1 rtl:ml-0 rtl:mr-1 rtl:rotate-180">→</span>
        </Link>
      </p>

      {/* ── Header bar: [Filter · Sort] | collection tiles | brand label ──────
           LEFT:   Filter toggle (with live count) + custom Sort menu
           CENTER: collection tiles — shown only while Filter is open (fade +
                   expand). The active collection lives in its own state, so
                   toggling never resets it.
           RIGHT:  brand label (hidden on mobile).
           dir="rtl" on the section flips the whole row for Arabic. */}
      <div className="mb-8">
        {/* Phones: two stacked rows — collection tiles on top (centered), Collection/Sort below. md+: one row. */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">

          {/* LEFT / RTL-RIGHT: Filter toggle + Sort menu */}
          <div className="flex items-center gap-4 flex-none">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                filterOpen ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {t.filter}
              {!fetching && <span className="text-stone-400">({visibleProducts.length})</span>}
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className={`transition-transform duration-300 ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            <span className="w-px h-3 bg-stone-300 flex-none" aria-hidden="true" />

            {/* Custom Sort menu — no native <select> */}
            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors ${
                  sortMode || sortOpen ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {currentSortLabel}
                <ChevronDown
                  size={12}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                />
              </button>

              {sortOpen && (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-2 left-0 rtl:left-auto rtl:right-0 min-w-[13rem] bg-white border border-stone-200 py-1 shadow-sm"
                >
                  {sortOptions.map((opt) => {
                    const active = sortMode === opt.value;
                    return (
                      <li key={opt.value} role="option" aria-selected={active}>
                        <button
                          type="button"
                          onClick={() => {
                            setSortMode(active ? "" : opt.value);
                            setSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors ${
                            active
                              ? "text-stone-900 bg-stone-50"
                              : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                          }`}
                        >
                          {opt.label}
                          {active && <Check size={12} strokeWidth={2.5} className="flex-none" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* CENTER: collection tiles — expand / fade when Filter is open */}
          <div
            className={`order-first md:order-none w-full md:w-auto md:flex-1 min-w-0 flex justify-center overflow-hidden transition-all duration-300 ease-out ${
              filterOpen ? "max-h-28 opacity-100 mb-5 md:mb-0" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex gap-0 overflow-x-auto">

              {/* "All" tile */}
              <button
                onClick={() => setActiveCollection(COLLECTION_KEY_ALL)}
                className="flex-none flex flex-col items-center gap-2"
              >
                <div className={`w-20 h-10 bg-stone-100 flex items-center justify-center border-2 transition-colors duration-200 ${
                  activeCollection === COLLECTION_KEY_ALL ? "border-stone-900" : "border-transparent"
                }`}>
                  <LayoutGrid size={16} className="text-stone-400" />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-center leading-tight transition-colors duration-200 ${
                  activeCollection === COLLECTION_KEY_ALL ? "text-stone-900" : "text-stone-500"
                }`}>
                  {t.all}
                </span>
              </button>

              {/* Collection tiles — image from Sanity; stone-200 placeholder until uploaded */}
              {collectionTiles.map(({ key, label, imageUrl }) => (
                <button
                  key={key}
                  onClick={() => setActiveCollection(key)}
                  className="flex-none flex flex-col items-center gap-2"
                >
                  <div className={`w-20 h-10 bg-stone-100 overflow-hidden border-2 transition-colors duration-200 ${
                    activeCollection === key ? "border-stone-900" : "border-transparent"
                  }`}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={label}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-center leading-tight max-w-[5rem] transition-colors duration-200 ${
                    activeCollection === key ? "text-stone-900" : "text-stone-500"
                  }`}>
                    {label}
                  </span>
                </button>
              ))}

            </div>
          </div>

          {/* RIGHT / RTL-LEFT: brand label — hidden on mobile */}
          <div className="hidden md:flex flex-none">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 whitespace-nowrap">
              {t.shopLabel}
            </p>
          </div>
        </div>
      </div>

      {fetching && (
        <div className="flex items-center justify-center py-32 gap-3 text-stone-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm tracking-widest uppercase">{t.loading}</span>
        </div>
      )}

      {!fetching && products.length === 0 && (
        <p className="text-center text-stone-400 text-sm tracking-widest uppercase py-32">
          {t.noProducts}
        </p>
      )}

      {!fetching && products.length > 0 && (
        <>
          {visibleProducts.length === 0 && (
            <p className="text-center text-stone-400 text-sm tracking-widest uppercase py-32">
              {t.noProductsCollection}
            </p>
          )}

          {/* 4-up product grid, small gap, no borders. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense gap-2 md:gap-3">
            {displayedProducts.map(renderCard)}
          </div>

          {/* Load More — appends the next batch; hidden once everything is shown */}
          {hasMore && (
            <div className="flex justify-center mt-12 md:mt-16">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                {t.loadMore}
              </Button>
            </div>
          )}
        </>
      )}
    </section>

    <Footer lang={lang} />
    </>
  );
};

export default Shop;
