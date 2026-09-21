import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Keep in sync with UAE_ONLY in lib/shippingConfig.ts (serverless functions don't import from the app).
const UAE_ONLY = true;

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;   // international format, e.g. +971581558866
  street: string;
  area?: string;
}

// English names for the UAE emirate values sent by the checkout form.
const EMIRATE_NAMES: Record<string, string> = {
  "dubai": "Dubai",
  "abu-dhabi": "Abu Dhabi",
  "sharjah": "Sharjah",
  "ajman": "Ajman",
  "ras-al-khaimah": "Ras Al Khaimah",
  "fujairah": "Fujairah",
  "umm-al-quwain": "Umm Al Quwain",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CartLineItem {
  title: string;
  description?: string;
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

    const { items, origin, delivery, installation, selectedCountry, selectedEmirate, customer, lang } = req.body as {
      items: CartLineItem[];
      origin: string;
      delivery: FlatLineItem;
      installation?: FlatLineItem | null;
      selectedCountry?: string;
      selectedEmirate?: string;
      customer?: CustomerDetails;
      lang?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    if (!delivery?.label || typeof delivery.amount !== "number" || !delivery.currency) {
      return res.status(400).json({ error: "Delivery information is required" });
    }

    // ── Customer details (collected in our own checkout form) ──────────────────
    const allowedCountries = UAE_ONLY ? ["AE"] : ["AE", "BH", "KW", "OM", "QA", "SA"];
    const name   = customer?.name?.trim() ?? "";
    const email  = customer?.email?.trim() ?? "";
    const phone  = customer?.phone?.trim() ?? "";
    const street = customer?.street?.trim() ?? "";
    const area   = customer?.area?.trim() ?? "";

    if (name.length < 2 || !EMAIL_RE.test(email) || !/^\+\d{8,15}$/.test(phone) || street.length < 3) {
      return res.status(400).json({ error: "Customer name, email, phone and street address are required" });
    }
    if (!selectedCountry || !allowedCountries.includes(selectedCountry)) {
      return res.status(400).json({ error: "Delivery country is not supported" });
    }

    const emirateName = selectedCountry === "AE" ? EMIRATE_NAMES[selectedEmirate ?? ""] ?? "" : "";
    const address = {
      line1: street.slice(0, 200),
      ...(area ? { line2: area.slice(0, 200) } : {}),
      city: emirateName || area.slice(0, 100) || "-",
      ...(emirateName ? { state: emirateName } : {}),
      country: selectedCountry,
    };

    // A Customer carrying name / email / phone / shipping address is what Stripe Checkout
    // reads to pre-fill its email, phone and shipping address fields. (`customer` cannot be
    // combined with `customer_email` / `customer_creation`; a new Customer is created per
    // checkout, which is the "always create" behaviour.)
    const stripeCustomer = await stripe.customers.create({
      name,
      email,
      phone,
      address,
      shipping: { name, phone, address },
    });

    const lineItems = [
      // Cart contents
      ...items.map((item) => ({
        price_data: {
          currency: (item.currency ?? "AED").toLowerCase(),
          product_data: {
            name: item.title,
            ...(item.description ? { description: item.description } : {}),
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

    // Every amount is VAT-inclusive (5%), so the VAT is worked out backwards from the total.
    const grossMinor = lineItems.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);
    const vatMinor = Math.round((grossMinor * 5) / 105);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer: stripeCustomer.id,
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: allowedCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      metadata: {
        selected_country: selectedCountry ?? "",
        selected_emirate: selectedEmirate ?? "",
        lang: lang === "ar" ? "ar" : "en",
        vat_rate: "5%",
        vat_amount: (vatMinor / 100).toFixed(2),
        total_excl_vat: ((grossMinor - vatMinor) / 100).toFixed(2),
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        customer_address: [street, area, emirateName, selectedCountry].filter(Boolean).join(", ").slice(0, 500),
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
