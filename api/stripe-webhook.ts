// api/stripe-webhook.ts
//
// Stripe fires `checkout.session.completed` here once a customer finishes
// paying (any payment method — card, Apple Pay, Google Pay, Link — since
// they're all part of the same hosted Checkout Session). We pull the
// shipping address + line items off that session and email both the store
// and the customer. This does NOT touch req.body — Stripe's signature
// verification needs the exact raw request bytes, so the body is read
// directly off the request stream before anything else looks at it.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { Resend } from "resend";

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(amountInSmallestUnit: number | null, currency: string | null): string {
  if (amountInSmallestUnit == null || !currency) return "-";
  return `${currency.toUpperCase()} ${(amountInSmallestUnit / 100).toLocaleString()}`;
}

function addressLines(address: Stripe.Address | null | undefined): string[] {
  if (!address) return [];
  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

async function sendEmail(opts: {
  to: string[];
  from: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[stripe-webhook] Missing RESEND_API_KEY — skipping email:", opts.subject);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    replyTo: opts.replyTo,
    text: opts.text,
    html: opts.html,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    console.error("[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Stripe webhook is not configured on the server" });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" });

  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err?.message ?? err);
    return res.status(400).send(`Webhook Error: ${err?.message ?? "invalid signature"}`);
  }

  if (event.type !== "checkout.session.completed") {
    // Not an event we act on — acknowledge so Stripe doesn't retry.
    return res.status(200).json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

    const customerEmail = session.customer_details?.email ?? null;
    const customerName = session.customer_details?.name ?? session.collected_information?.shipping_details?.name ?? "";
    const shipping = session.collected_information?.shipping_details ?? null;
    const shippingLines = addressLines(shipping?.address);
    const total = formatMoney(session.amount_total, session.currency);
    const lang = session.metadata?.lang === "ar" ? "ar" : "en";
    const dashboardUrl = `https://dashboard.stripe.com/${event.livemode ? "" : "test/"}checkout/sessions/${session.id}`;

    const itemsText = lineItems.data
      .map((li) => `- ${li.description} × ${li.quantity} — ${formatMoney(li.amount_total, session.currency)}`)
      .join("\n");
    const itemsHtml = lineItems.data
      .map(
        (li) =>
          `<tr><td style="padding:4px 0;">${escapeHtml(li.description ?? "")}</td><td style="padding:4px 0; text-align:center;">${li.quantity}</td><td style="padding:4px 0; text-align:right;">${escapeHtml(
            formatMoney(li.amount_total, session.currency)
          )}</td></tr>`
      )
      .join("");

    const from = process.env.LEADS_FROM_EMAIL || "Studio Austinn <hello@studioaustinn.com>";
    const storeTo = (process.env.ORDERS_TO_EMAIL || process.env.LEADS_TO_EMAIL || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // ── Store notification ──────────────────────────────────────────────────
    if (storeTo.length === 0) {
      console.error("[stripe-webhook] No ORDERS_TO_EMAIL/LEADS_TO_EMAIL configured — order notification not sent");
    } else {
      await sendEmail({
        to: storeTo,
        from,
        replyTo: customerEmail ?? undefined,
        subject: `New Order — ${total} — ${customerName || customerEmail || "Customer"}`,
        text:
          `New Order\n\n` +
          `Customer: ${customerName}\n` +
          `Email: ${customerEmail ?? "-"}\n` +
          `Phone: ${session.customer_details?.phone ?? "-"}\n\n` +
          `Delivery address:\n${shippingLines.length ? shippingLines.join("\n") : "-"}\n\n` +
          `Country: ${session.metadata?.selected_country ?? "-"}   Emirate: ${session.metadata?.selected_emirate ?? "-"}\n\n` +
          `Items:\n${itemsText}\n\n` +
          `Total: ${total}\n\n` +
          `View in Stripe: ${dashboardUrl}\n`,
        html: `
          <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5; color:#111;">
            <h2 style="margin:0 0 12px;">New Order — Studio Austinn</h2>
            <table style="border-collapse:collapse; width:100%; max-width:640px;">
              <tr><td style="padding:6px 0; color:#555; width:120px;">Customer</td><td style="padding:6px 0;"><b>${escapeHtml(customerName)}</b></td></tr>
              <tr><td style="padding:6px 0; color:#555;">Email</td><td style="padding:6px 0;">${escapeHtml(customerEmail ?? "-")}</td></tr>
              <tr><td style="padding:6px 0; color:#555;">Phone</td><td style="padding:6px 0;">${escapeHtml(session.customer_details?.phone ?? "-")}</td></tr>
              <tr><td style="padding:6px 0; color:#555; vertical-align:top;">Delivery address</td><td style="padding:6px 0;">${
                shippingLines.length ? shippingLines.map(escapeHtml).join("<br/>") : "-"
              }</td></tr>
              <tr><td style="padding:6px 0; color:#555;">Zone</td><td style="padding:6px 0;">${escapeHtml(
                session.metadata?.selected_country ?? "-"
              )} / ${escapeHtml(session.metadata?.selected_emirate ?? "-")}</td></tr>
            </table>
            <table style="border-collapse:collapse; width:100%; max-width:640px; margin-top:16px;">
              <thead><tr style="border-bottom:1px solid #ddd; text-align:left;"><th style="padding:4px 0;">Item</th><th style="padding:4px 0;">Qty</th><th style="padding:4px 0; text-align:right;">Amount</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p style="margin-top:12px;"><b>Total: ${escapeHtml(total)}</b></p>
            <p style="margin-top:16px;"><a href="${dashboardUrl}">View in Stripe Dashboard</a></p>
          </div>
        `,
      });
    }

    // ── Customer confirmation ───────────────────────────────────────────────
    if (customerEmail) {
      const isAr = lang === "ar";
      await sendEmail({
        to: [customerEmail],
        from,
        subject: isAr ? "تأكيد طلبك — Studio Austinn" : "Your Order Confirmation — Studio Austinn",
        text: isAr
          ? `شكراً لطلبك من Studio Austinn.\n\nملخص الطلب:\n${itemsText}\n\nالإجمالي: ${total}\n\nعنوان التسليم:\n${
              shippingLines.length ? shippingLines.join("\n") : "-"
            }\n\nستتلقى تحديثات عبر البريد الإلكتروني عند شحن طلبك.\n`
          : `Thank you for your order from Studio Austinn.\n\nOrder summary:\n${itemsText}\n\nTotal: ${total}\n\nDelivery address:\n${
              shippingLines.length ? shippingLines.join("\n") : "-"
            }\n\nYou'll receive an update by email once your order ships.\n`,
        html: `
          <div dir="${isAr ? "rtl" : "ltr"}" style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5; color:#111;">
            <h2 style="margin:0 0 12px;">${isAr ? "شكراً لطلبك" : "Thank you for your order"}</h2>
            <table style="border-collapse:collapse; width:100%; max-width:640px;">
              <thead><tr style="border-bottom:1px solid #ddd; text-align:${isAr ? "right" : "left"};"><th style="padding:4px 0;">${
                isAr ? "المنتج" : "Item"
              }</th><th style="padding:4px 0;">${isAr ? "الكمية" : "Qty"}</th><th style="padding:4px 0; text-align:${
                isAr ? "left" : "right"
              };">${isAr ? "المبلغ" : "Amount"}</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p style="margin-top:12px;"><b>${isAr ? "الإجمالي" : "Total"}: ${escapeHtml(total)}</b></p>
            <p style="margin-top:16px; color:#555;">${isAr ? "عنوان التسليم" : "Delivery address"}<br/>${
              shippingLines.length ? shippingLines.map(escapeHtml).join("<br/>") : "-"
            }</p>
            <p style="margin-top:16px; color:#777; font-size:13px;">${
              isAr
                ? "ستتلقى تحديثات عبر البريد الإلكتروني عند شحن طلبك."
                : "You'll receive an update by email once your order ships."
            }</p>
          </div>
        `,
      });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[stripe-webhook] Error handling event:", err?.message ?? err);
    // Still 200 — we don't want Stripe to keep retrying an event that failed
    // for a reason retries won't fix (e.g. a bad email address). The event
    // itself is safely inspectable in the Stripe Dashboard either way.
    return res.status(200).json({ received: true, error: err?.message ?? "handler error" });
  }
}
