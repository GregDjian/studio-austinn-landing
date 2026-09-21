// Delivery scope switch. While true, checkout preselects and locks the United Arab
// Emirates, the shop's delivery copy speaks about the UAE only, and Stripe's address
// form accepts UAE addresses only. Set to false to bring back the GCC countries
// (all GCC zones, rates and code are still in place).
//
// NOTE: api/create-checkout-session.ts keeps its own copy of this flag (serverless
// functions don't import from the app) — change both together.
export const UAE_ONLY = true;
