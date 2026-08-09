import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

interface CartLineItem {
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
}

interface FlatLineItem {
  label: string;
  amount: number;
  currency: string;
}

const toStripeLineItem = ({ label, amount, currency }: FlatLineItem) => ({
  price_data: {
    currency: currency.toLowerCase(),
    product_data: { name: label },
    unit_amount: Math.round(amount * 100),
  },
  quantity: 1 as const,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[checkout] STRIPE_SECRET_KEY is not set in process.env");
    return res.status(500).json({ error: "Stripe is not configured on the server" });
  }

  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });

    const { items, origin, delivery, installation, selectedCountry, selectedEmirate, lang } = req.body as {
      items: CartLineItem[];
      origin: string;
      delivery: FlatLineItem;
      installation?: FlatLineItem | null;
      selectedCountry?: string;
      selectedEmirate?: string;
      lang?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    if (!delivery?.label || typeof delivery.amount !== "number" || !delivery.currency) {
      return res.status(400).json({ error: "Delivery information is required" });
    }

    const lineItems = [
      // Cart contents
      ...items.map((item) => ({
        price_data: {
          currency: (item.currency ?? "AED").toLowerCase(),
          product_data: {
            name: item.title,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      // Delivery fee
      toStripeLineItem(delivery),
      // Installation fee (only when opted in)
      ...(installation ? [toStripeLineItem(installation)] : []),
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["AE", "BH", "KW", "OM", "QA", "SA"],
      },
      metadata: {
        selected_country: selectedCountry ?? "",
        selected_emirate: selectedEmirate ?? "",
        lang: lang === "ar" ? "ar" : "en",
      },
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cancel`,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("[checkout] Error creating session:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Checkout failed" });
  }
}
