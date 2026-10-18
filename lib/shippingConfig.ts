// Delivery scope switch. While true, checkout preselects and locks the United Arab
// Emirates, the shop's delivery copy speaks about the UAE only, and Stripe's address
// form accepts UAE addresses only. Set to false to bring back the GCC countries
// (all GCC zones, rates and code are still in place).
//
// NOTE: api/create-checkout-session.ts keeps its own copy of this flag (serverless
// functions don't import from the app) — change both together.
export const UAE_ONLY = true;

// UAE delivery rates (AED, VAT-inclusive). "Chains" are custom chains and Aura Link
// (art-links) bundles. Every non-chain unit in the cart is an item: the first costs
// `firstItem`, each additional one `additionalItem`. Chains ship free alongside other
// items; a chains-only cart pays one flat `chains` fee, however many chains there are.
export const UAE_DELIVERY = {
  dubai:          { firstItem: 200, chains: 99  },
  otherEmirates:  { firstItem: 400, chains: 149 },
  additionalItem: 50,
};
