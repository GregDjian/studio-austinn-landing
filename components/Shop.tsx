import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Language, Product } from "../types";
import { getProducts, getCollections, CollectionMeta } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import { useCart, isLooseLinkItem } from "./CartContext";

interface ShopProps {
  lang: Language;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      heading:              "المتجر",
      subheading:           "قطع مختارة لاقتنائها",
      inStock:              "متوفر",
      sold:                 "مُباع",
      madeToOrder:          "يُصنع بالطلب",
      noProducts:           "لا توجد منتجات متاحة حالياً.",
      noProductsCollection: "لا توجد منتجات في هذه المجموعة.",
      loading:              "جارٍ التحميل…",
      addToCart:            "أضف للسلة",
      customize:            "خصّص",
      decreaseQty:          "تقليل الكمية",
      increaseQty:          "زيادة الكمية",
      prevImage:            "الصورة السابقة",
      nextImage:            "الصورة التالية",
      all:                  "الكل",
      artLinks:             "روابط فنية",
      artisticPartitions:   "فواصل فنية",
      products:             "منتج",
      shopLabel:            "متجر ستوديو أوستين",
    };
  }
  return {
    heading:              "Shop",
    subheading:           "Selected works available to acquire",
    inStock:              "In Stock",
    sold:                 "Sold",
    madeToOrder:          "Made to Order",
    noProducts:           "No products available at this time.",
    noProductsCollection: "No products in this collection.",
    loading:              "Loading…",
    addToCart:            "Add to Cart",
    customize:            "Customize",
    decreaseQty:          "Decrease quantity",
    increaseQty:          "Increase quantity",
    prevImage:            "Previous image",
    nextImage:            "Next image",
    all:                  "All",
    artLinks:             "Art Links",
    artisticPartitions:   "Artistic Partitions",
    products:             "Products",
    shopLabel:            "Studio Austinn Online Shop",
  };
};

const availabilityStyle: Record<string, string> = {
  in_stock:      "text-stone-600 border-stone-400",
  sold:          "text-stone-400 border-stone-300 line-through",
  made_to_order: "text-amber-700 border-amber-400",
};

// Collection enum values — matches Sanity schema field options.
// Missing/null collection on existing documents is treated as "art-links".
const COLLECTION_KEY_ALL       = null;
const COLLECTION_KEY_ART_LINKS = "art-links";
const COLLECTION_KEY_PARTITIONS = "artistic-partitions";

const Shop: React.FC<ShopProps> = ({ lang }) => {
  const [products, setProducts]               = useState<Product[]>([]);
  const [rawCollections, setRawCollections]   = useState<CollectionMeta[]>([]);
  const [fetching, setFetching]               = useState(true);
  const [activeCollection, setActiveCollection] = useState<string | null>(COLLECTION_KEY_ALL);
  // per-card manual image index: undefined = auto (hover crossfade active)
  const [manualIdx, setManualIdx]             = useState<Record<string, number>>({});
  const { addItem, updateQuantity, items } = useCart();
  const t = getContent(lang);

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
    { key: COLLECTION_KEY_ART_LINKS,  label: t.artLinks,          imageUrl: rawCollections.find(c => c.key === COLLECTION_KEY_ART_LINKS)  ? imgUrl.thumb(rawCollections.find(c => c.key === COLLECTION_KEY_ART_LINKS)!.image) : null },
    { key: COLLECTION_KEY_PARTITIONS, label: t.artisticPartitions, imageUrl: rawCollections.find(c => c.key === COLLECTION_KEY_PARTITIONS) ? imgUrl.thumb(rawCollections.find(c => c.key === COLLECTION_KEY_PARTITIONS)!.image) : null },
  ];

  // Normalise missing collection → "art-links" so old documents fall under Art Links.
  const resolveCollection = (p: Product) => p.collection ?? COLLECTION_KEY_ART_LINKS;

  const visibleProducts = activeCollection === COLLECTION_KEY_ALL
    ? products
    : products.filter(p => resolveCollection(p) === activeCollection);

  const getCartQty = (productId: string): number => {
    const entry = items.find((i) => !isLooseLinkItem(i) && i.id === productId);
    return entry && !isLooseLinkItem(entry) ? entry.quantity : 0;
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id:           product._id,
      slug:         product.slug.current,
      title:        product.title[lang] ?? product.title.en,
      price:        product.price ?? 0,
      currency:     product.currency,
      image:        product.images?.[0] ? imgUrl.thumb(product.images[0]) : "",
      availability: product.availability,
    });
  };

  const navigateImage = (productId: string, count: number, delta: number) => {
    setManualIdx((prev) => ({
      ...prev,
      [productId]: ((prev[productId] ?? 0) + delta + count) % count,
    }));
  };

  return (
    <section
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-stone-50 pt-36 pb-24 px-6 md:px-12"
    >
      {/* ── Header row: count | filter tiles | shop label ──────────────────────
           Desktop: single flex row, tiles centered, count/label on each end.
           Mobile:  count top-left + tiles below (scrollable); label hidden.
           RTL:     dir="rtl" on the section naturally flips flex order —
                    count lands on reading-start (right), label on reading-end
                    (left) — no manual overrides needed. */}
      <div className="flex flex-col md:flex-row md:items-center border-b border-stone-200 pb-4 mb-8 gap-3 md:gap-0">

        {/* LEFT / RTL-RIGHT: live filtered count */}
        <div className="md:flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500 whitespace-nowrap">
            {fetching ? "—" : `${visibleProducts.length} ${t.products}`}
          </p>
        </div>

        {/* CENTER: filter tiles — flush (gap-0), scrollable on mobile */}
        <div className="flex gap-0 overflow-x-auto pb-1 md:pb-0">

          {/* "All" tile */}
          <button
            onClick={() => setActiveCollection(COLLECTION_KEY_ALL)}
            className="flex-none flex flex-col items-center gap-2"
          >
            <div className={`w-20 h-20 bg-stone-100 flex items-center justify-center border-2 transition-colors duration-200 ${
              activeCollection === COLLECTION_KEY_ALL
                ? "border-stone-900"
                : "border-transparent"
            }`}>
              <LayoutGrid size={22} className="text-stone-400" />
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
              <div className={`w-20 h-20 bg-stone-100 overflow-hidden border-2 transition-colors duration-200 ${
                activeCollection === key
                  ? "border-stone-900"
                  : "border-transparent"
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

        {/* RIGHT / RTL-LEFT: brand label — hidden on mobile */}
        <div className="hidden md:flex md:flex-1 md:justify-end">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 text-right">
            {t.shopLabel}
          </p>
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
          {/* Empty collection state */}
          {visibleProducts.length === 0 && (
            <p className="text-center text-stone-400 text-sm tracking-widest uppercase py-32">
              {t.noProductsCollection}
            </p>
          )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-8">
          {visibleProducts.map((product) => {
            const imageCount = product.images?.length ?? 0;
            const idx        = manualIdx[product._id];
            const hasManual  = idx !== undefined;
            const activeIdx  = hasManual ? idx : 0;

            // Which image to show at rest
            const primaryUrl = product.images?.[activeIdx]
              ? imgUrl.card(product.images[activeIdx])
              : null;

            // Hover crossfade target: only when no manual selection has been made
            const crossfadeUrl = !hasManual && product.images?.[1]
              ? imgUrl.card(product.images[1])
              : null;

            const title = product.title?.[lang] ?? product.title?.en ?? "";
            const availLabel =
              product.availability === "in_stock" ? t.inStock
              : product.availability === "sold"   ? t.sold
              : t.madeToOrder;

            const cartQty = getCartQty(product._id);
            const canBuy  = product.availability !== "sold";

            return (
              <div key={product._id} className="group flex flex-col">

                {/* ── Link wraps image + text meta ──────────────────── */}
                <Link to={`/shop/${product.slug.current}`} className="flex flex-col">

                  {/* Image */}
                  <div className="relative overflow-hidden bg-stone-100 aspect-[4/5]">
                    {primaryUrl ? (
                      <>
                        {/* Primary — fades out on hover when auto crossfade is active */}
                        <img
                          src={primaryUrl}
                          alt={title}
                          loading="lazy"
                          decoding="async"
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                            crossfadeUrl ? "group-hover:opacity-0" : "group-hover:scale-105"
                          }`}
                        />
                        {/* Secondary — crossfades in on hover (auto mode only) */}
                        {crossfadeUrl && (
                          <img
                            src={crossfadeUrl}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                          />
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-xs uppercase tracking-widest">
                        No image
                      </div>
                    )}

                    {/* Image nav arrows — always visible, only when 2+ images */}
                    {imageCount > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigateImage(product._id, imageCount, -1);
                          }}
                          aria-label={t.prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-1.5 transition-colors"
                        >
                          <ChevronLeft size={13} strokeWidth={2} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigateImage(product._id, imageCount, 1);
                          }}
                          aria-label={t.nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-1.5 transition-colors"
                        >
                          <ChevronRight size={13} strokeWidth={2} />
                        </button>
                      </>
                    )}

                    {/* Featured badge */}
                    {product.featured && (
                      <span className="absolute top-3 left-3 bg-stone-900 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1">
                        {lang === "ar" ? "مميز" : "Featured"}
                      </span>
                    )}
                  </div>

                  {/* Text meta — title + price always visible; badge hover-revealed */}
                  <div className="pt-3 flex flex-col gap-1">
                    <h2 className="font-sans font-black text-sm uppercase tracking-tight text-stone-900 leading-snug line-clamp-2">
                      {title}
                    </h2>
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-stone-900 text-sm">
                        {product.productType === "loose-link"
                          ? `${product.currency} ${product.pricePerLink?.toLocaleString()} ${lang === "ar" ? "/ رابط" : "/ link"}`
                          : `${product.currency} ${product.price?.toLocaleString()}`}
                      </span>
                      {/* Availability badge: opacity-0 so it reserves layout space; reveals on hover */}
                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.2em] border px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          availabilityStyle[product.availability] ?? ""
                        }`}
                      >
                        {availLabel}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* ── CTA area ──────────────────────────────────────── */}

                {/* Bundle: stepper is always visible once in cart; Add to Cart is hover-only */}
                {product.productType === "bundle" && canBuy && (
                  cartQty > 0 ? (
                    <div dir="ltr" className="mt-3 flex items-stretch border border-stone-900">
                      <button
                        onClick={() => updateQuantity(product._id, cartQty - 1)}
                        aria-label={t.decreaseQty}
                        className="flex-none w-9 py-2 flex items-center justify-center text-stone-900 hover:bg-stone-100 transition-colors text-base leading-none"
                      >
                        −
                      </button>
                      <span className="flex-1 flex items-center justify-center text-[9px] font-bold tracking-[0.2em] text-stone-900 select-none">
                        {cartQty}
                      </span>
                      <button
                        onClick={() => updateQuantity(product._id, cartQty + 1)}
                        aria-label={t.increaseQty}
                        className="flex-none w-9 py-2 flex items-center justify-center text-stone-900 hover:bg-stone-100 transition-colors text-base leading-none"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-3 w-full py-2 text-[9px] font-bold uppercase tracking-[0.2em] bg-stone-900 text-white hover:bg-stone-700 transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      {t.addToCart}
                    </button>
                  )
                )}

                {/* Loose-link: Customize is hover-only */}
                {product.productType === "loose-link" && (
                  <Link
                    to={`/shop/${product.slug.current}`}
                    className="mt-3 w-full py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-center border border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    {t.customize}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </section>
  );
};

export default Shop;
