// api/gemini.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

// ---- Simple in-memory rate limiter (best-effort on serverless) ----
type RateEntry = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQ = 20; // per minute per IP (adjust)

const rateStore = new Map<string, RateEntry>();

function getClientIp(req: VercelRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.length > 0) return xrip.trim();
  return (req.socket?.remoteAddress || "unknown").toString();
}

function isRateLimited(key: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = rateStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfterSec: 0 };
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX_REQ) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfterSec };
  }

  return { limited: false, retryAfterSec: 0 };
}

function cleanupRateStore() {
  const now = Date.now();
  if (rateStore.size < 500) return;
  for (const [k, v] of rateStore.entries()) {
    if (now > v.resetAt) rateStore.delete(k);
  }
}

function safeString(v: unknown, maxLen: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, maxLen);
}

type HistoryItem = { role: "user" | "model"; text: string };

function sanitizeHistory(input: unknown): HistoryItem[] {
  if (!Array.isArray(input)) return [];
  const out: HistoryItem[] = [];
  for (const item of input) {
    const role = item?.role;
    const text = safeString(item?.text, 2000);
    if ((role === "user" || role === "model") && text) {
      out.push({ role, text });
    }
    if (out.length >= 20) break; // hard cap
  }
  return out;
}

const getSystemInstruction = (lang: string) => {
  if (lang === "ar") {
    return `
أنت "الكونسيرج الفني" (Art Concierge) لستوديو أوستن (Studio Austinn)، وهو ستوديو فنون فاخر في الإمارات العربية المتحدة.
نبرتك: راقية، معرفية، مقتضبة، ومهذّبة للغاية.
مهمتك: مساعدة الزوار على فهم الخدمات الفنية، اقتراح منحوتات أو لوحات لمساحاتهم، وشرح قيمة التركيبات الفنية المخصصة.
خدماتنا: خدمات فنية مخصصة، منحوتات، لوحات، ثريات فنية، تركيبات فنية.
نُقدّم أعمال فنانين مثل Véronique Locci (المعروفة بالمرايا الزجاجية المنفوخة المقعّرة).
تحدّث بالعربية الفصحى الراقية. لا تُطنِب. اجعل الردود أنيقة وموجزة.
`;
  }

  return `
You are the "Art Concierge" for Studio Austinn, a luxury art studio in the UAE. 
Your tone is sophisticated, knowledgeable, minimal, and polite. 
You help visitors understand art services, suggest sculptures or paintings for their spaces, and explain the value of custom art installations.
Services we offer: Custom Art Services, Sculptures, Paintings, Artistic Chandeliers, Art Installations.
We feature artists like Véronique Locci (known for concave blown glass mirrors).
Do not be overly wordy. Keep responses elegant and concise.
`;
};

const getLeadProcessingInstruction = (lang: string) => {
  if (lang === "ar") {
    return `
أنت مساعد إدارة العملاء المحتملين لستوديو أوستن.
لدى عميل محتمل استفسار جديد.
مهمتك: كتابة رسالة تأكيد واستلام فاخرة وشخصية للغاية (بحد أقصى 60 كلمة) باللغة العربية.
اذكر اهتمامه المحدد (مثل: منحوتات، تركيبات فنية مخصّصة).
وأفِد بأن "مستشاراً فنياً أول" سيتواصل خلال 24 ساعة.
حافظ على أسلوب "خدمة بوتيك حصرية" وبأقصى درجات اللباقة والإيجاز.
`;
  }

  return `
You are the Lead Management Assistant for Studio Austinn. 
A prospective client has submitted an inquiry. 
Your task is to generate a personalized, ultra-luxurious acknowledgment message (max 60 words).
Acknowledge their specific interest area (e.g., Sculptures, Bespoke Installations).
Mention that a Senior Art Consultant will reach out within 24 hours.
Maintain a tone of "exclusive boutique service".
`;
};

async function callGemini(apiKey: string, contents: any) {
  const resp = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    console.error("Gemini API error:", {
      status: resp.status,
      statusText: resp.statusText,
      data,
    });
    return { ok: false as const, status: resp.status, data };
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Thank you — we received your inquiry and will respond shortly.";

  return { ok: true as const, text };
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendLeadEmail(opts: {
  subject: string;
  to: string[];
  from: string;
  replyTo?: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

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

  cleanupRateStore();

  const ip = getClientIp(req);
  const { limited, retryAfterSec } = isRateLimited(`gemini:${ip}`);
  if (limited) {
    res.setHeader("Retry-After", String(retryAfterSec));
    return res.status(429).json({ error: "Too many requests. Please try again shortly." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY on server");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // "type" can be: "lead" | "chat"
    const type = safeString(body?.type, 20) || "lead";
    const lang = safeString(body?.lang, 5) || "en";

    // ---------------- LEAD ----------------
    if (type === "lead") {
      const name = safeString(body?.name, 80);
      const email = safeString(body?.email, 120);
      const interest = safeString(body?.interest, 120);
      const message = safeString(body?.message, 1200);

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const system = getLeadProcessingInstruction(lang);

      const contents = [
        {
          role: "user",
          parts: [
            {
              text:
                `SYSTEM:\n${system}\n\n` +
                `New Lead Received:\n` +
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `Interest: ${interest || ""}\n` +
                `Message: ${message}\n`,
            },
          ],
        },
      ];

      const result = await callGemini(apiKey, contents);
      if (!result.ok) return res.status(502).json({ error: "Upstream AI service error" });

      // ✅ Send lead by email (non-blocking for UX, but still awaited here for reliability)
      try {
        const toList = (process.env.LEADS_TO_EMAIL || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const from = process.env.LEADS_FROM_EMAIL || "Studio Austinn <onboarding@resend.dev>";

        if (toList.length === 0) {
          console.error("Missing LEADS_TO_EMAIL (no recipients configured)");
        } else {
          const subject = `New Studio Austinn Lead — ${interest ? interest : "Inquiry"} — ${name}`;

          const textEmail =
            `New Lead\n\n` +
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Interest: ${interest || "-"}\n` +
            `Language: ${lang}\n` +
            `IP: ${ip}\n\n` +
            `Message:\n${message}\n\n` +
            `AI Confirmation:\n${result.text}\n`;

          const htmlEmail = `
            <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5; color:#111;">
              <h2 style="margin:0 0 12px;">New Lead — Studio Austinn</h2>
              <table style="border-collapse:collapse; width:100%; max-width:760px;">
                <tr><td style="padding:6px 0; color:#555; width:120px;">Name</td><td style="padding:6px 0;"><b>${escapeHtml(
                  name
                )}</b></td></tr>
                <tr><td style="padding:6px 0; color:#555;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(
                  email
                )}">${escapeHtml(email)}</a></td></tr>
                <tr><td style="padding:6px 0; color:#555;">Interest</td><td style="padding:6px 0;">${escapeHtml(
                  interest || "-"
                )}</td></tr>
                <tr><td style="padding:6px 0; color:#555;">Language</td><td style="padding:6px 0;">${escapeHtml(
                  lang
                )}</td></tr>
                <tr><td style="padding:6px 0; color:#555;">IP</td><td style="padding:6px 0;">${escapeHtml(
                  ip
                )}</td></tr>
              </table>

              <div style="margin-top:14px; padding:12px; background:#fafafa; border:1px solid #eee;">
                <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#777; font-weight:700; margin-bottom:6px;">Client message</div>
                <div style="white-space:pre-wrap;">${escapeHtml(message)}</div>
              </div>

              <div style="margin-top:14px; padding:12px; background:#f7fbff; border:1px solid #e6f2ff;">
                <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#3b6ea5; font-weight:700; margin-bottom:6px;">AI confirmation shown to client</div>
                <div style="white-space:pre-wrap;">${escapeHtml(result.text)}</div>
              </div>
            </div>
          `;

          await sendLeadEmail({
            subject,
            to: toList,
            from,
            replyTo: email, // ✅ replying to the email goes to the lead
            text: textEmail,
            html: htmlEmail,
          });
        }
      } catch (mailErr) {
        // We still return success to the user, but log for you
        console.error("Lead email sending failed:", mailErr);
      }

      return res.status(200).json({ text: result.text });
    }
    

    // ---------------- CHAT ----------------
    if (type === "chat") {
      const message = safeString(body?.message, 2000);
      const history = sanitizeHistory(body?.history);

      if (!message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const system = getSystemInstruction(lang);

      const contents = [
        {
          role: "user",
          parts: [{ text: `SYSTEM:\n${system}\n` }],
        },
        ...history.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
        {
          role: "user",
          parts: [{ text: message }],
        },
      ];

      const result = await callGemini(apiKey, contents);
      if (!result.ok) return res.status(502).json({ error: "Upstream AI service error" });

      return res.status(200).json({ text: result.text });
    }

    // Unknown type
    return res.status(400).json({ error: "Invalid request type" });
  } catch (err: any) {
    console.error("Server error in /api/gemini:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
