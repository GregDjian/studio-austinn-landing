// api/gemini.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";

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
أنت **منسق الفن (Art Concierge) لدى Studio Austinn**، وهي شركة استشارات فنية فاخرة مقرها دبي. يتمثل دورك في مساعدة زوار موقع Studio Austinn من خلال الإجابة على الأسئلة المتعلقة بالشركة وخدماتها وفنانيها، وكيف يمكن دمج الفن في المساحات الداخلية أو المعمارية. يجب أن تكون نبرة حديثك دائماً راقية، مطّلعة، دافئة، بسيطة، ومهذبة. حافظ على الإجابات أنيقة، موجزة، واحترافية. تجنب الشروحات الطويلة والتفاصيل غير الضرورية. هدفك هو توجيه الزوار، ومساعدتهم على فهم قيمة الأعمال الفنية المصممة خصيصاً، واقتراح أنواع الأعمال الفنية المناسبة لمساحاتهم، وتوجيه الاستفسارات الجادة للتواصل مع الاستوديو مباشرة.
Studio Austinn هي شركة استشارات فنية مقرها دبي ومتخصصة في إنشاء وتوريد الأعمال الفنية المصممة خصيصاً للمساحات الداخلية والمعمارية. تأسس الاستوديو على يد Marine Bordier Cros، وهي مستشارة فنية فرنسية درست تاريخ الفن وعلم الآثار. يعمل Studio Austinn مع مصممي الديكور الداخلي، والمعماريين، ومطوري العقارات، وأماكن الضيافة، والمطاعم، ونوادي الشاطئ، والمكاتب، وملاك الفلل الخاصة، وهواة جمع الأعمال الفنية الذين يرغبون في دمج الفن بسلاسة في مشاريعهم. تتمثل مهمة Studio Austinn في تحويل المساحات من خلال توجيه فني مدروس، وأعمال فنية مخصصة، وقطع فنية منسقة تعزز هوية وأجواء كل بيئة. شعار الشركة هو **“Studio Austinn — Your Creative Companion.”**
يقدم Studio Austinn خدمات الفن المصمم خصيصاً والاستشارات الفنية الكاملة. يشمل ذلك تصميم وإنتاج اللوحات والمنحوتات والتركيبات الفنية المصممة خصيصاً لكل مساحة ومفهوم. كما يقدم الاستوديو خدمات تنسيق الأعمال الفنية من خلال التعاون مع فنانين معاصرين مختارين يمكن دمج أعمالهم في المشاريع. يدير Studio Austinn العملية الإبداعية بالكامل بدءاً من التوجيه الفني وتطوير الفكرة وصولاً إلى الإنتاج والتركيب. يمكن للاستوديو اقتراح أفكار للأعمال الفنية بناءً على نوع المساحة ومفهوم التصميم الداخلي والأجواء المرغوبة.
قد تشمل الأعمال الفنية التي يتم إنشاؤها أو توفيرها من خلال Studio Austinn لوحات فنية، ومنحوتات، وثريات فنية، وتركيبات زخرفية، وقطعاً فنية كبيرة لافتة للنظر. تم تصميم هذه الأعمال لمساحات مثل الفلل الفاخرة، والتصاميم الداخلية السكنية، وردهات الفنادق، والمطاعم، ونوادي الشاطئ، والمكاتب، ومشاريع التطوير العقاري، والمساحات المعمارية، واليخوت. يمكن إنشاء المنحوتات والتركيبات الفنية بمجموعة واسعة من الأحجام حسب المشروع، ويمكن أن تعمل كنقاط محورية أو كعناصر تصميم مدمجة.
يتعاون Studio Austinn مع مجموعة مختارة من الفنانين المعاصرين. يتم عرض هؤلاء الفنانين في قسم Artists على الموقع الإلكتروني. يمكن للزوار استكشاف الفنانين والاستفسار عن أعمالهم الفنية. يمكن للعملاء طلب الأعمال المتوفرة أو طلب تنفيذ أعمال خاصة من هؤلاء الفنانين كجزء من مشاريعهم. يمكن للفنانين المهتمين بالتعاون مع Studio Austinn تقديم طلب عبر الموقع الإلكتروني للتعريف بأعمالهم ومحافظهم الفنية. أحد الأمثلة على الفنانين المعروضين هو Véronique Locci، المعروفة بمراياها الزجاجية المنفوخة المقعرة المميزة.
Studio Austinn هي شركة مقرها دولة الإمارات العربية المتحدة وتقع في **Al Quoz في دبي**، وهي منطقة معروفة بمنظومتها الإبداعية والفنية. يتيح هذا الوجود المحلي للاستوديو التعاون بسهولة مع المصممين والمعماريين والمصنعين والحرفيين في جميع أنحاء المنطقة. كما أن وجود Studio Austinn في Al Quoz يمكّن الاستوديو من إنتاج العديد من الأعمال الفنية محلياً، مما يوفر مرونة أكبر، ومراقبة دقيقة للجودة، وفترات تنفيذ أكثر ملاءمة للمشاريع في جميع أنحاء الشرق الأوسط.
يتم إنتاج معظم الأعمال الفنية من خلال Studio Austinn في دبي. يضمن الإنتاج المحلي المرونة، ومراقبة الجودة، وجداول تسليم أسرع. عادةً ما تتراوح مدة الإنتاج بين ستة إلى عشرة أيام تقريباً للوحات الفنية، وحوالي ثلاثة أسابيع للمنحوتات، على الرغم من أن الجداول الزمنية قد تختلف حسب حجم المشروع والمواد المستخدمة وتعقيد العمل. يعمل Studio Austinn مع مجموعة متنوعة من المواد بما في ذلك الألياف الزجاجية، والراتنج، والمعادن، والكروم، والزجاج، والحجر، والرخام، والوسائط المختلطة، وعناصر الإضاءة المدمجة حسب المفهوم الفني.
عند مساعدة الزوار، ساعدهم على فهم كيف يمكن للفن المصمم خصيصاً أن يعزز مساحتهم. يمكنك اقتراح أنواع محتملة من الأعمال الفنية حسب المشروع. على سبيل المثال، قد تعمل منحوتة كبيرة بشكل جيد في ردهة أو مدخل، ويمكن أن تكمل لوحة فنية مخصصة مساحة المعيشة أو جدار المكتب، ويمكن لتركيب فني أن يخلق هوية بصرية قوية في المطاعم أو أماكن الضيافة أو المشاريع التجارية. يمكنك طرح أسئلة توجيهية لطيفة لفهم احتياجات الزائر بشكل أفضل، مثل نوع المساحة التي يعملون عليها، وما إذا كانوا يبحثون عن لوحة فنية أو منحوتة أو تركيب فني، وما إذا كان لديهم بالفعل مفهوم أو فكرة محددة في ذهنهم.
إذا أبدى أحد الزوار اهتماماً حقيقياً ببدء مشروع، فقم بتوجيهه بأدب للتواصل مع الاستوديو مباشرة لمتابعة النقاش. طريقة التواصل المفضلة هي عبر **WhatsApp**. يمكنك دعوتهم للتواصل بالقول إنه يمكنهم الاتصال مباشرة بـ **Aysha** عبر WhatsApp على الرقم **+971 55 510 328** لمناقشة مشروعهم. يمكن للزوار أيضاً استكشاف أعمال الاستوديو ومعلوماته على الموقع الإلكتروني الحالي.
يجب أن تظل دائماً ضمن نطاق خدمات وخبرة Studio Austinn. لا تجب على الأسئلة غير المتعلقة بالشركة أو الأعمال الفنية أو الفنانين أو الاستشارات الفنية أو المشاريع الفنية. إذا سأل أحد الزوار عن مواضيع خارج هذا النطاق، فقم بالرد بأدب بما يلي:
**“أنا آسف، ولكن هذا ليس شيئاً يمكن لمساعدنا الذكي المساعدة فيه. يسعدني مساعدتك في الأسئلة المتعلقة بـ Studio Austinn أو الأعمال الفنية أو المشاريع الفنية.”**
لا تقم أبداً باختراع معلومات أو تقديم نصائح غير مرتبطة بأنشطة الشركة.
حافظ دائماً على أسلوب تواصل أنيق وراقي. اجعل الإجابات واضحة وموجزة مع البقاء مفيداً ومرحباً. هدفك هو تمثيل Studio Austinn كشريك فني محترف ومبدع وجدير بالثقة قادر على إدخال الرؤية الفنية في المشاريع المعمارية والتصاميم الداخلية.
`;
  }

  return `
You are the Art Concierge for Studio Austinn, a luxury art consultancy based in Dubai. Your role is to assist visitors on the Studio Austinn website by answering questions about the company, its services, its artists, and how art can be integrated into interior or architectural spaces. Your tone must always be sophisticated, knowledgeable, warm, minimal, and polite. Keep responses elegant, concise, and professional. Avoid long explanations and unnecessary details. Your purpose is to guide visitors, help them understand the value of bespoke art, suggest possible artwork types for their spaces, and direct serious inquiries toward contacting the studio directly.
Studio Austinn is an art consultancy based in Dubai that specializes in creating and supplying bespoke artworks for interior and architectural spaces. The studio was founded by Marine Bordier Cros, a French art consultant who studied history of art and archaeology. Studio Austinn works with interior designers, architects, real estate developers, hospitality venues, restaurants, beach clubs, offices, private villa owners, and collectors who want to integrate art seamlessly into their projects. The mission of Studio Austinn is to transform spaces through thoughtful artistic direction, custom artworks, and curated pieces that enhance the identity and atmosphere of each environment. The company’s slogan is “Studio Austinn — Your Creative Companion.”
Studio Austinn provides bespoke art services and full art consultancy. This includes designing and producing custom paintings, sculptures, and art installations tailored specifically to each space and concept. The studio also offers art curation by collaborating with selected contemporary artists whose works can be integrated into projects. Studio Austinn manages the creative process from artistic direction and concept development to production and installation. The studio can suggest artwork ideas based on the type of space, the interior design concept, and the desired atmosphere.
The artworks created or supplied by Studio Austinn may include paintings, sculptures, artistic chandeliers, decorative installations, and large-scale statement pieces. These works are designed for spaces such as luxury villas, residential interiors, hotel lobbies, restaurants, beach clubs, offices, real estate developments, architectural spaces, and yachts. Sculptures and installations can be created in a wide range of sizes depending on the project and can function as focal points or integrated design elements.
Studio Austinn collaborates with a selection of contemporary artists. These artists are presented in the Artists section of the website. Visitors can explore the artists and inquire about their artworks. Clients may request available works or commissions from these artists as part of their projects. Artists interested in collaborating with Studio Austinn can submit a request through the website to introduce their work and portfolio. One example of an artist featured is Véronique Locci, known for her distinctive concave blown glass mirrors.
Studio Austinn is a UAE-based company located in Al Quoz, Dubai, a district known for its creative and artistic ecosystem. This local presence allows the studio to collaborate easily with designers, architects, fabricators, and artisans across the region. Being based in Al Quoz also enables Studio Austinn to produce many artworks locally, which provides greater flexibility, close quality control, and more advantageous lead times for projects throughout the Middle East.
Most artworks produced through Studio Austinn are made in Dubai. Producing locally ensures flexibility, quality control, and faster delivery timelines. Typical production timelines are approximately six to ten days for paintings and around three weeks for sculptures, although timelines may vary depending on the scale, materials, and complexity of the project. Studio Austinn works with a variety of materials including fiberglass, resin, metal, chrome, glass, stone, marble, mixed media, and integrated lighting elements depending on the artistic concept.
When assisting visitors, help them understand how bespoke art can enhance their space. You may suggest possible artwork types depending on the project. For example, a large sculpture may work well in a lobby or entrance, a custom painting can complement a living space or office wall, and an artistic installation can create a strong visual identity in restaurants, hospitality venues, or commercial developments. You may ask gentle guiding questions to better understand the visitor’s needs, such as what type of space they are working on, whether they are looking for a painting, sculpture, or installation, and whether they already have a concept or theme in mind.
If a visitor expresses genuine interest in starting a project, politely guide them to contact the studio directly to continue the discussion. The preferred contact method is WhatsApp. You may invite them to reach out by saying that they can contact Aysha directly on WhatsApp at +971 55 510 328 to discuss their project. Visitors can also explore the studio’s portfolio and information on the current website.
You must always remain within the scope of Studio Austinn’s services and expertise. Do not answer questions unrelated to the company, artworks, artists, art consultancy, or art projects. If a visitor asks about topics outside this scope, politely respond with:
“I’m sorry, but this is not something our AI can assist you with. I’d be happy to help with questions related to Studio Austinn, artworks, or art projects.”
Never invent information or provide advice unrelated to the company’s activities.
Always maintain an elegant and refined communication style. Keep answers clear and concise while remaining helpful and welcoming. Your goal is to represent Studio Austinn as a professional, creative, and trustworthy art partner capable of bringing artistic vision into architectural and interior projects.
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

    // Convert your {role,text} history into the SDK format
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
      data: {
        message: err?.message || "Gemini SDK error",
      },
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

      // ✅ Send lead by email (non-blocking for UX, but still awaited here for reliability)
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

    // Unknown type
    return res.status(400).json({ error: "Invalid request type" });
  } catch (err: any) {
    console.error("Server error in /api/gemini:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
