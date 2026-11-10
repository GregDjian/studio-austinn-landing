// Delivery scope switch. While true, checkout preselects and locks the United Arab
// Emirates, the shop's delivery copy speaks about the UAE only, and Stripe's address
// form accepts UAE addresses only. Set to false to bring back the GCC countries
// (all GCC zones, rates and code are still in place).
//
// NOTE: api/create-checkout-session.ts keeps its own copy of this flag (serverless
// functions don't import from the app) — change both together.
export const UAE_ONLY = true;

// Delivery within the UAE is free. To cover it, every art unit costs this much (AED,
// VAT-inclusive) more than the price entered in Sanity. Aura Link bundles and custom
// chains are excluded: their Sanity prices are what the customer pays.
//
// NOTE: the amount customers are charged is worked out in
// api/create-checkout-session.ts, which keeps its own copy of this rule — change both
// together.
export const ART_PRICE_UPLIFT = 200;

export const hasArtPriceUplift = (product: { productType?: string; collection?: string | null }): boolean =>
  product.productType !== "loose-link" && (product.collection ?? "art-links") !== "art-links";

export const FREE_DELIVERY_TEXT = {
  en: "Free delivery across the UAE",
  ar: "توصيل مجاني داخل الإمارات",
};
