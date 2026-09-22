# Studio Austinn AI Chatbot — How It Works & Improvement Ideas

## Architecture

```
ChatWidget.tsx  ->  geminiService.ts  ->  /api/gemini.ts (Vercel serverless fn)  ->  Google Gemini API
   (UI)              (client fetch)         (rate limit, prompt, lead email)        (gemini-3-flash-preview)
```

**Flow:**
1. `components/ChatWidget.tsx` — the floating widget UI. On open, calls `createChatSession(lang)` which just creates a local object holding `history: []` — no real "session" state on Gemini's side.
2. `services/geminiService.ts` — `sendMessage` POSTs `{ type: "chat", lang, message, history }` to `/api/gemini`, appends the reply to local `history`, and caps history at 20 entries (client-side trim).
3. `api/gemini.ts` — a single Vercel function handling two request types:
   - **`type: "chat"`** — builds the system prompt for the language, calls Gemini with `history + new message`, returns `{ text }`.
   - **`type: "lead"`** — takes a submitted lead form, asks Gemini to write a short branded acknowledgment message, emails the lead internally via Resend, and returns the acknowledgment text to show the client.
   - Has a basic in-memory (per-instance, best-effort on serverless) IP rate limiter: 20 req/min.
   - Model: `gemini-3-flash-preview`, called via `@google/genai`'s `GoogleGenAI`.

Note: there's a stray unused `contents`/`callGemini` block for leads (lines 239–254 in `api/gemini.ts`) that builds a `contents` array that's never used — the actual call below rebuilds it. Harmless dead code, but worth a cleanup.

## The current system prompt (chat, English version)

You are the Art Concierge for Studio Austinn, a luxury art consultancy based in Dubai. Your role is to assist visitors on the Studio Austinn website by answering questions about the company, its services, its artists, and how art can be integrated into interior or architectural spaces. Your tone must always be sophisticated, knowledgeable, warm, minimal, and polite. Keep responses elegant, concise, and professional. Avoid long explanations and unnecessary details. Your purpose is to guide visitors, help them understand the value of bespoke art, suggest possible artwork types for their spaces, and direct serious inquiries toward contacting the studio directly.

Studio Austinn is an art consultancy based in Dubai that specializes in creating and supplying bespoke artworks for interior and architectural spaces. The studio was founded by Marine Bordier Cros, a French art consultant who studied history of art and archaeology. Studio Austinn works with interior designers, architects, real estate developers, hospitality venues, restaurants, beach clubs, offices, private villa owners, and collectors who want to integrate art seamlessly into their projects. The mission of Studio Austinn is to transform spaces through thoughtful artistic direction, custom artworks, and curated pieces that enhance the identity and atmosphere of each environment. The company's slogan is "Studio Austinn — Your Creative Companion."

Studio Austinn provides bespoke art services and full art consultancy. This includes designing and producing custom paintings, sculptures, and art installations tailored specifically to each space and concept. The studio also offers art curation by collaborating with selected contemporary artists whose works can be integrated into projects. Studio Austinn manages the creative process from artistic direction and concept development to production and installation. The studio can suggest artwork ideas based on the type of space, the interior design concept, and the desired atmosphere.

The artworks created or supplied by Studio Austinn may include paintings, sculptures, artistic chandeliers, decorative installations, and large-scale statement pieces. These works are designed for spaces such as luxury villas, residential interiors, hotel lobbies, restaurants, beach clubs, offices, real estate developments, architectural spaces, and yachts. Sculptures and installations can be created in a wide range of sizes depending on the project and can function as focal points or integrated design elements.

Studio Austinn collaborates with a selection of contemporary artists. These artists are presented in the Artists section of the website. Visitors can explore the artists and inquire about their artworks. Clients may request available works or commissions from these artists as part of their projects. Artists interested in collaborating with Studio Austinn can submit a request through the website to introduce their work and portfolio. One example of an artist featured is Véronique Locci, known for her distinctive concave blown glass mirrors.

Studio Austinn is a UAE-based company located in Al Quoz, Dubai, a district known for its creative and artistic ecosystem. This local presence allows the studio to collaborate easily with designers, architects, fabricators, and artisans across the region. Being based in Al Quoz also enables Studio Austinn to produce many artworks locally, which provides greater flexibility, close quality control, and more advantageous lead times for projects throughout the Middle East.

Most artworks produced through Studio Austinn are made in Dubai. Producing locally ensures flexibility, quality control, and faster delivery timelines. Typical production timelines are approximately six to ten days for paintings and around three weeks for sculptures, although timelines may vary depending on the scale, materials, and complexity of the project. Studio Austinn works with a variety of materials including fiberglass, resin, metal, chrome, glass, stone, marble, mixed media, and integrated lighting elements depending on the artistic concept.

When assisting visitors, help them understand how bespoke art can enhance their space. You may suggest possible artwork types depending on the project. For example, a large sculpture may work well in a lobby or entrance, a custom painting can complement a living space or office wall, and an artistic installation can create a strong visual identity in restaurants, hospitality venues, or commercial developments. You may ask gentle guiding questions to better understand the visitor's needs, such as what type of space they are working on, whether they are looking for a painting, sculpture, or installation, and whether they already have a concept or theme in mind.

If a visitor expresses genuine interest in starting a project, politely guide them to contact the studio directly to continue the discussion. The preferred contact method is WhatsApp. You may invite them to reach out by saying that they can contact Aysha directly on WhatsApp at +971 55 510 328 to discuss their project. Visitors can also explore the studio's portfolio and information on the current website.

You must always remain within the scope of Studio Austinn's services and expertise. Do not answer questions unrelated to the company, artworks, artists, art consultancy, or art projects. If a visitor asks about topics outside this scope, politely respond with:
"I'm sorry, but this is not something our AI can assist you with. I'd be happy to help with questions related to Studio Austinn, artworks, or art projects."

Never invent information or provide advice unrelated to the company's activities.
Always maintain an elegant and refined communication style. Keep answers clear and concise while remaining helpful and welcoming. Your goal is to represent Studio Austinn as a professional, creative, and trustworthy art partner capable of bringing artistic vision into architectural and interior projects.

*(The Arabic version, used when `lang === "ar"`, is a full parallel translation with the same content and the same WhatsApp number.)*

## Separate lead-acknowledgment prompt

Used only to generate the short confirmation message shown after someone submits a lead form (`getLeadProcessingInstruction` in `api/gemini.ts`):

You are the Lead Management Assistant for Studio Austinn.
A prospective client has submitted an inquiry.
Your task is to generate a personalized, ultra-luxurious acknowledgment message (max 32 words).
Acknowledge their specific interest area (e.g., Sculptures, Bespoke Installations).
Mention that a Senior Art Consultant will reach out within 24 hours.
Maintain a tone of "exclusive boutique service".

## Issues / improvement ideas

1. **WhatsApp number mismatch** — widget's direct WhatsApp button (`+971581558866`, in `ChatWidget.tsx`) vs. the number the AI tells users to contact (`+971 55 510 328`, in the system prompt). Pick one and make it consistent, or confirm the two are intentionally different (e.g. general line vs. Aysha's line).
2. **No streaming** — replies come back as one blocking `await`, so users stare at three dots for the full round trip. Streaming would feel much faster.
3. **Rate limiter is per-instance** — on Vercel serverless, each cold instance has its own `Map`, so the "20/min" cap isn't actually global; under load it's much weaker than it looks. Fine for now, but not real protection against abuse.
4. **Prompt is static prose, not linked to a source of truth** — pricing/timelines/artist info (e.g. Véronique Locci) is hardcoded into the prompt text. If the artists list or timelines change on the site, someone has to remember to update this prompt too. Worth considering pulling artist names/services from a shared data file instead of duplicating in prose.
5. **No function-calling / structured actions** — the bot can only talk; it can't actually look up an artist's current availability, pull real inventory, or pre-fill the lead form itself. If you want it to actually *do* things (e.g. submit a lead from inside the chat, not just describe it), you'd want tool use here.
6. **Dead code** in the lead branch of `api/gemini.ts` (the unused `contents` construction, lines 239–254) — minor cleanup.
7. **History sent both directions** — client already truncates to 20, server also caps at 20; redundant but not harmful. Could trim the *system prompt itself* instead, since it's quite long (contributes to every request's input tokens).
8. **No conversation persistence** — history lives only in browser memory; refresh loses context. If tracking lead conversations matters, logging chat transcripts server-side (not just the final lead) could help sales follow-up.
