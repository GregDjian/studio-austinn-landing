import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Returns the order summary for a completed Stripe Checkout session, for the /shop/success page.
// Only the fields the page needs are returned (no payment details, no email).
//
// GET /api/get-checkout-session?session_id=cs_...
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: "A valid session_id is required" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[get-checkout-session] STRIPE_SECRET_KEY is not set");
    return res.status(500).json({ error: "Order lookup is not configured" });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    // The success page is only reached after paying; never present an unpaid/expired session as an order.
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return res.status(402).json({ error: "This order has not been paid" });
    }

    const shipping = session.collected_information?.shipping_details ?? null;
    const address = shipping?.address ?? session.customer_details?.address ?? null;

    return res.status(200).json({
      id: session.id,
      currency: (session.currency ?? "aed").toUpperCase(),
      amountTotal: session.amount_total ?? 0,
      vatAmount: session.metadata?.vat_amount ?? null, // major units, e.g. "67.62"
      customerName: session.customer_details?.name ?? shipping?.name ?? "",
      items: (session.line_items?.data ?? []).map((li) => ({
        name: li.description ?? "",
        quantity: li.quantity ?? 1,
        amount: li.amount_total, // minor units, line total incl. quantity
      })),
      shipping: address
        ? {
            name: shipping?.name ?? session.customer_details?.name ?? "",
            line1: address.line1 ?? "",
            line2: address.line2 ?? "",
            city: address.city ?? "",
            state: address.state ?? "",
            postalCode: address.postal_code ?? "",
            country: address.country ?? "",
          }
        : null,
    });
  } catch (err: any) {
    if (err?.type === "StripeInvalidRequestError" && err?.code === "resource_missing") {
      return res.status(404).json({ error: "Order not found" });
    }
    console.error("[get-checkout-session] Error:", err?.message ?? err);
    return res.status(500).json({ error: "Could not load order details" });
  }
}
