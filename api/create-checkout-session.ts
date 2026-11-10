import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SanityClient } from "@sanity/client";
import Stripe from "stripe";

// Keep in sync with lib/shippingConfig.ts (serverless functions don't import from the app).
const UAE_ONLY = true;
const ART_PRICE_UPLIFT = 200;

const CURRENCY = "AED";
const MAX_CART_LINES = 90;
const MAX_QUANTITY = 100;
const MAX_CHAIN_COLUMNS = 8;

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

// What the browser may say about a cart line: which product and options were chosen.
// Prices, names and images always come from Sanity.
interface RequestedItem {
  productId: string;
  variantKey?: string;
  sizeKey?: string;
  quantity?: number;
  configuration?: { columns: { links: { colorOptionId: string }[] }[] };
}

interface SanityProduct {
  _id: string;
  productType: string;
  title: string;
  price?: number | null;
  pricePerLink?: number | null;
  collection?: string | null;
  availability?: string;
  imageUrl?: string | null;
  variants?: { _key: string; name?: string; availability?: string; imageUrl?: string | null }[] | null;
  sizes?: { _key: string; label?: string; price?: number | null }[] | null;
  colorOptions?: { _id: string; name?: { en?: string; ar?: string } }[] | null;
}

interface PricedLine {
  title: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  /** Parcels for GCC delivery rates: one per bundle unit, one per custom chain. */
  parcels: number;
}

/** A cart that doesn't match the catalogue; the customer sees this message. */
class CartError extends Error {}

const UNAVAILABLE = "An item in your cart is no longer available. Please remove it and try again.";

const isPositivePrice = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const stripeImage = (url?: string | null) => (url ? `${url}?w=400&auto=format` : undefined);

/** Picks the option with the requested key; without a key, the first (the page's default). */
function pickOption<T extends { _key: string }>(options: T[], key: unknown): T | undefined {
  if (key === undefined || key === null) return options[0];
  const option = options.find((o) => o._key === key);
  if (!option) throw new CartError(UNAVAILABLE);
  return option;
}

function priceBundle(product: SanityProduct, requested: RequestedItem): PricedLine {
  const quantity = requested.quantity;
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new CartError("Invalid item quantity");
  }

  const variants = (product.variants ?? []).filter((v) => v?.imageUrl && v.name);
  const sizes = (product.sizes ?? []).filter((s) => s?.label && typeof s.price === "number");
  const variant = pickOption(variants, requested.variantKey);
  const size = pickOption(sizes, requested.sizeKey);

  if ((variant?.availability ?? product.availability) === "sold") throw new CartError(UNAVAILABLE);

  const basePrice = size ? size.price : product.price;
  if (!isPositivePrice(basePrice)) throw new CartError(UNAVAILABLE);

  const isAuraLink = (product.collection ?? "art-links") === "art-links";
  return {
    title: [product.title, variant?.name, size?.label].filter(Boolean).join(" — "),
    description: [variant?.name, size?.label].filter(Boolean).join(" · ") || undefined,
    price: basePrice + (isAuraLink ? 0 : ART_PRICE_UPLIFT),
    quantity,
    image: stripeImage(variant?.imageUrl ?? product.imageUrl),
    parcels: quantity,
  };
}

function priceChain(product: SanityProduct, requested: RequestedItem, lang: string | undefined): PricedLine {
  const columns = requested.configuration?.columns;
  if (!Array.isArray(columns) || columns.length === 0 || columns.length > MAX_CHAIN_COLUMNS) {
    throw new CartError("Invalid chain design");
  }
  if (!isPositivePrice(product.pricePerLink)) throw new CartError(UNAVAILABLE);

  const colors = new Map((product.colorOptions ?? []).map((c) => [c._id, c]));
  const counts = new Map<string, number>();
  for (const column of columns) {
    if (!Array.isArray(column?.links)) throw new CartError("Invalid chain design");
    for (const link of column.links) {
      if (!colors.has(link?.colorOptionId)) throw new CartError(UNAVAILABLE);
      counts.set(link.colorOptionId, (counts.get(link.colorOptionId) ?? 0) + 1);
    }
  }

  const totalLinks = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (totalLinks === 0) throw new CartError("Invalid chain design");

  const summary = [...counts]
    .map(([id, count]) => {
      const name = colors.get(id)?.name;
      return `${count}× ${(lang === "ar" ? name?.ar : undefined) ?? name?.en ?? ""}`;
    })
    .join(", ");

  return {
    title: `Custom chain — ${columns.length} col${columns.length !== 1 ? "s" : ""}: ${summary}`,
    price: product.pricePerLink,
    quantity: totalLinks,
    parcels: 1,
  };
}

/** Works out every cart line from Sanity, using only the choices sent by the browser. */
async function priceCart(sanity: SanityClient, requested: RequestedItem[], lang: string | undefined): Promise<PricedLine[]> {
  const ids = [...new Set(requested.map((item) => item?.productId))];
  if (ids.some((id) => typeof id !== "string" || !id)) throw new CartError("Invalid cart");

  const products = await sanity.fetch<SanityProduct[]>(
    `*[_type == "product" && _id in $ids && showInShop != false] {
      _id,
      "productType": coalesce(productType, "bundle"),
      "title": title.en,
      price,
      pricePerLink,
      collection,
      availability,
      "imageUrl": images[0].asset->url,
      variants[]{ _key, "name": name.en, availability, "imageUrl": image.asset->url },
      sizes[]{ _key, label, price },
      "colorOptions": colorOptions[]->{ _id, name }
    }`,
    { ids }
  );
  const byId = new Map(products.map((p) => [p._id, p]));

  return requested.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new CartError(UNAVAILABLE);
    return product.productType === "loose-link" ? priceChain(product, item, lang) : priceBundle(product, item);
  });
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

    const { items, origin, addInstallation, selectedCountry, selectedEmirate, customer, lang } = req.body as {
      items: RequestedItem[];
      origin: string;
      addInstallation?: boolean;
      selectedCountry?: string;
      selectedEmirate?: string;
      customer?: CustomerDetails;
      lang?: string;
    };

    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_CART_LINES) {
      return res.status(400).json({ error: "No items provided" });
    }

    const projectId = process.env.VITE_SANITY_PROJECT_ID;
    if (!projectId) {
      console.error("[checkout] VITE_SANITY_PROJECT_ID is not set in process.env");
      return res.status(500).json({ error: "Checkout is not configured on the server" });
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

    const isUAE = selectedCountry === "AE";
    const emirateName = isUAE ? EMIRATE_NAMES[selectedEmirate ?? ""] ?? "" : "";
    if (isUAE && !emirateName) {
      return res.status(400).json({ error: "Please select an emirate" });
    }

    // ── Prices, delivery and installation (from Sanity, never from the browser) ─
    const sanity = createClient({
      projectId,
      dataset: process.env.VITE_SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      useCdn: false,
    });

    const [pricedLines, zone] = await Promise.all([
      priceCart(sanity, items, lang),
      sanity.fetch<{ name?: string; installationFee?: number; sizeTiers?: { size: string; rate: number }[] } | null>(
        `*[_type == "deliveryZone" && zoneKey == $zoneKey][0]{ "name": zoneName.en, installationFee, sizeTiers }`,
        { zoneKey: isUAE ? "uae" : "gcc" }
      ),
    ]);

    if (!isUAE && !zone) {
      return res.status(400).json({ error: "Delivery country is not supported" });
    }

    // UAE delivery is free. GCC (off while UAE_ONLY): every parcel at the zone's "large" rate.
    const largeRate = zone?.sizeTiers?.find((tier) => tier.size === "large")?.rate ?? 0;
    const delivery: FlatLineItem = isUAE
      ? { label: lang === "ar" ? "توصيل مجاني" : `Free delivery — ${emirateName}`, amount: 0, currency: CURRENCY }
      : {
          label: `Delivery — ${zone?.name ?? selectedCountry}`,
          amount: pricedLines.reduce((sum, line) => sum + largeRate * line.parcels, 0),
          currency: CURRENCY,
        };

    const installFee = zone?.installationFee ?? 0;
    const installation: FlatLineItem | null =
      addInstallation === true && selectedEmirate === "dubai" && installFee > 0
        ? { label: "Professional Installation (Dubai)", amount: installFee, currency: CURRENCY }
        : null;

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
      ...pricedLines.map((item) => ({
        price_data: {
          currency: CURRENCY.toLowerCase(),
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
    if (err instanceof CartError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("[checkout] Error creating session:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Checkout failed" });
  }
}
