// api/gemini.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";

// ---- Simple in-memory rate limiter (best-effort on serverless) ----
type RateEntry = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQ = 20;

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
    if (out.length >= 20) break;
  }
  return out;
}

const getSystemInstruction = (lang: string) => {
  if (lang === "ar") {
    return `
أنت **منسق الفن (Art Concierge) لدى Studio Austinn**، وهي شركة استشارات فنية فاخرة مقرها دبي. يتمثل دورك في مساعدة زوار موقع Studio Austinn من خلال الإجابة على الأسئلة المتعلقة بالشركة وخدماتها وفنانيها، وكيف يمكن دمج الفن في المساحات الداخلية أو المعمارية. يجب أن تكون نبرة حديثك دائماً راقية، مطّلعة، دافئة، بسيطة، ومهذبة. حافظ على الإجابات أنيقة، موجزة، واحترافية. تجنب الشروحات الطويلة والتفاصيل غير الضرورية. هدفك هو توجيه الزوار، ومساعدتهم على فهم قيمة الأعمال الفنية المصممة خصيصاً، واقتراح أنواع الأعمال الفنية المناسبة لمساحاتهم، وتوجيه الاستفسارات الجادة للتواصل مع الاستوديو مباشرة.
Studio Austinn هي شركة استشارات فنية مقرها دبي ومتخصصة في إنشاء وتوريد الأعمال الفنية المصممة خصيصاً للمساحات الداخلية والمعمارية. تأسس الاستوديو على يد Marine Bordier Cros، وهي مستشارة فنية فرنسية درست تاريخ الفن وعلم الآثار. يعمل Studio Austinn مع مصممي الديكور الداخلي، والمعماريين، ومطوري العقارات، وأماكن الضيافة، والمطاعم، ونوادي الشاطئ، والمكاتب، وملاك الفلل الخاصة، وهواة جمع الأعمال الفنية الذين يرغبون في دمج الفن بسلاسة في مشاريعهم.
`;
  }

  return `
You are the Art Concierge for Studio Austinn, a luxury art consultancy based in Dubai. Your role is to assist visitors on the Studio Austinn website by answering questions about the company, its services, its artists, and how art can be integrated into interior or architectural spaces. Your tone must always be sophisticated, knowledgeable, warm, minimal, and polite. Keep responses elegant, concise, and professional. Avoid long explanations and unnecessary details. Your purpose is to guide visitors, help them understand the value of bespoke art, suggest possible artwork types for their spaces, and direct serious inquiries toward contacting the studio directly.
Studio Austinn is an art consultancy based in Dubai that specializes in creating and supplying bespoke artworks for interior and architectural spaces. The studio was founded by Marine Bordier Cros, a French art consultant who studied history of art and archaeology. Studio Austinn works with interior designers, architects, real estate developers, hospitality venues, restaurants, beach clubs, offices, private villa owners, and collectors who want to integrate art seamlessly into their projects. The mission of Studio Austinn is to transform spaces through thoughtful artistic direction, custom artworks, and curated pieces that enhance the identity and atmosphere of each environment. The company's slogan is "Studio Austinn — Your Creative Companion."
`;
};

const getLeadProcessingInstruction = (lang: string) => {
  if (lang === "ar") {
    return `
أنت مساعد إدارة العملاء المحتملين لستوديو أوستن.
لدى عميل محتمل استفسار جديد.
مهمتك: كتابة رسالة تأكيد واستلام فاخرة وشخصية للغاية (بحد أقصى 32 كلمة) باللغة العربية.
اذكر اهتمامه المحدد (مثل: منحوتات، تركيبات فنية مخصّصة).
وأفِد بأن "مستشاراً فنياً أول" سيتواصل خلال 24 ساعة.
حافظ على أسلوب "خدمة بوتيك حصرية" وبأقصى درجات اللباقة والإيجاز.
`;
  }

  return `
You are the Lead Management Assistant for Studio Austinn. 
A prospective client has submitted an inquiry. 
Your task is to generate a personalized, ultra-luxurious acknowledgment message (max 32 words).
Acknowledge their specific interest area (e.g., Sculptures, Bespoke Installations).
Mention that a Senior Art Consultant will reach out within 24 hours.
Maintain a tone of "exclusive boutique service".
`;
};

async function callGemini(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: Array<{ role: "user" | "model"; text: string }>;
}) {
  try {
    const ai = new GoogleGenAI({ apiKey: opts.apiKey });

    const sdkContents = opts.contents.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const resp = await ai.models.generateContent({
      model: opts.model,
      contents: sdkContents,
      config: {
        systemInstruction: opts.systemInstruction,
      },
    });

    const text =
      (resp as any)?.text ||
      "Thank you — we received your inquiry and will respond shortly.";

    return { ok: true as const, text };
  } catch (err: any) {
    console.error("Gemini SDK error:", err);
    return {
      ok: false as const,
      status: 500,
      data: { message: err?.message || "Gemini SDK error" },
    };
  }
}

// ── NEW: Gemini with image support ────────────────────────────────────────
async function callGeminiWithImages(opts: {
  apiKey: string;
  model: string;
  prompt: string;
  roomImage: { base64: string; mimeType: string };
  artworkImage: { base64: string; mimeType: string };
}) {
  try {
    const ai = new GoogleGenAI({ apiKey: opts.apiKey });

    const resp = await ai.models.generateContent({
      model: opts.model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: opts.roomImage.mimeType as any,
                data: opts.roomImage.base64,
              },
            },
            {
              inlineData: {
                mimeType: opts.artworkImage.mimeType as any,
                data: opts.artworkImage.base64,
              },
            },
            { text: opts.prompt },
          ],
        },
      ],
    });

    const text = (resp as any)?.text || "";
    return { ok: true as const, text };
  } catch (err: any) {
    console.error("Gemini image SDK error:", err);
    return {
      ok: false as const,
      status: 500,
      data: { message: err?.message || "Gemini image SDK error" },
    };
  }
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

    const type = safeString(body?.type, 20) || "lead";
    const lang = safeString(body?.lang, 5) || "en";

    // ── VISUALIZE ──────────────────────────────────────────────────────────
    if (type === "visualize") {
      const prompt = safeString(body?.prompt, 2000);
      const roomImage = body?.roomImage;
      const artworkImage = body?.artworkImage;

      if (
        !prompt ||
        !roomImage?.base64 ||
        !roomImage?.mimeType ||
        !artworkImage?.base64 ||
        !artworkImage?.mimeType
      ) {
        return res.status(400).json({ error: "Missing required fields for visualization" });
      }

      const result = await callGeminiWithImages({
        apiKey,
        model: "gemini-1.5-flash",
        prompt,
        roomImage: {
          base64: roomImage.base64,
          mimeType: roomImage.mimeType,
        },
        artworkImage: {
          base64: artworkImage.base64,
          mimeType: artworkImage.mimeType,
        },
      });

      if (!result.ok) {
        return res.status(502).json({ error: "Upstream AI service error" });
      }

      return res.status(200).json({ text: result.text });
    }

    // ── LEAD ───────────────────────────────────────────────────────────────
    if (type === "lead") {
      const name = safeString(body?.name, 80);
      const email = safeString(body?.email, 120);
      const interest = safeString(body?.interest, 120);
      const message = safeString(body?.message, 1200);

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await callGemini({
        apiKey,
        model: "gemini-3-flash-preview",
        systemInstruction: getLeadProcessingInstruction(lang),
        contents: [
          {
            role: "user",
            text:
              `New Lead Received:\n` +
              `Name: ${name}\n` +
              `Email: ${email}\n` +
              `Interest: ${interest || ""}\n` +
              `Message: ${message}\n`,
          },
        ],
      });

      if (!result.ok) {
        return res.status(502).json({
          error: "Upstream AI service error",
          upstreamStatus: result.status,
          upstream: result.data,
        });
      }

      try {
        const toList = (process.env.LEADS_TO_EMAIL || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const from = process.env.LEADS_FROM_EMAIL || "Studio Austinn <hello@studioaustinn.com>";

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
                <tr><td style="padding:6px 0; color:#555; width:120px;">Name</td><td style="padding:6px 0;"><b>${escapeHtml(name)}</b></td></tr>
                <tr><td style="padding:6px 0; color:#555;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
                <tr><td style="padding:6px 0; color:#555;">Interest</td><td style="padding:6px 0;">${escapeHtml(interest || "-")}</td></tr>
                <tr><td style="padding:6px 0; color:#555;">Language</td><td style="padding:6px 0;">${escapeHtml(lang)}</td></tr>
                <tr><td style="padding:6px 0; color:#555;">IP</td><td style="padding:6px 0;">${escapeHtml(ip)}</td></tr>
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
            replyTo: email,
            text: textEmail,
            html: htmlEmail,
          });
        }
      } catch (mailErr) {
        console.error("Lead email sending failed:", mailErr);
      }

      return res.status(200).json({ text: result.text });
    }

    // ── CHAT ───────────────────────────────────────────────────────────────
    if (type === "chat") {
      const message = safeString(body?.message, 2000);
      const history = sanitizeHistory(body?.history);

      if (!message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const system = getSystemInstruction(lang);

      const result = await callGemini({
        apiKey,
        model: "gemini-3-flash-preview",
        systemInstruction: system,
        contents: [
          ...history.map((h) => ({ role: h.role, text: h.text })),
          { role: "user", text: message },
        ],
      });

      if (!result.ok) return res.status(502).json({ error: "Upstream AI service error" });

      return res.status(200).json({ text: result.text });
    }

    return res.status(400).json({ error: "Invalid request type" });
  } catch (err: any) {
    console.error("Server error in /api/gemini:", err);
    return res.status(500).json({ error: "Server error" });
  }
}