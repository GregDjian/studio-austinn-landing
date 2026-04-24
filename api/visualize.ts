// api/visualize.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

// ── Poll Replicate prediction until done ──────────────────────────────────
async function pollPrediction(
  predictionId: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const resp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await resp.json();

    if (data.status === "succeeded") {
      const output = data.output;
      if (typeof output === "string") return output;
      if (Array.isArray(output) && output.length > 0) return output[0];
      throw new Error("No output URL in response");
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Prediction ${data.status}: ${data.error || "unknown error"}`);
    }
  }
  throw new Error("Prediction timed out");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    console.error("Missing REPLICATE_API_KEY");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { roomImage, artworkImage, artworkTitle, positionDescription, lang } = body;

    if (!roomImage || !artworkImage) {
      return res.status(400).json({ error: "Missing images" });
    }

    // Convert base64 to data URLs for Replicate
    const roomDataUrl = `data:${roomImage.mimeType};base64,${roomImage.base64}`;
    const artworkDataUrl = `data:${artworkImage.mimeType};base64,${artworkImage.base64}`;

    // Build prompt for flux-kontext-pro
    const positionHint = positionDescription
      ? `Place the artwork on the ${positionDescription}.`
      : "Place the artwork naturally on the wall.";

    const prompt = lang === "ar"
      ? `ضع هذه القطعة الفنية "${artworkTitle}" بشكل واقعي في هذه الغرفة. ${positionHint} احرص على أن تبدو القطعة كأنها جزء طبيعي من الغرفة مع الحفاظ على كل عناصر الغرفة الأصلية.`
      : `Interior design photo. ${positionHint} The room should look exactly as in the reference photo with the artwork "${artworkTitle}" mounted naturally on the wall. Photorealistic, high quality interior photography. Keep all existing furniture, lighting and decor unchanged.`;

    // Create prediction using flux-kontext-pro
    const createResp = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait=5",
      },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: roomDataUrl,
          guidance: 3.5,
          steps: 28,
          output_format: "webp",
          output_quality: 85,
        },
      }),
    });

    const prediction = await createResp.json();

    if (!createResp.ok) {
      console.error("Replicate create error:", prediction);
      return res.status(502).json({ error: "Failed to create prediction", detail: prediction });
    }

    // If already succeeded (wait=5 worked)
    if (prediction.status === "succeeded") {
      const output = prediction.output;
      const url = typeof output === "string" ? output : Array.isArray(output) ? output[0] : null;
      if (url) return res.status(200).json({ imageUrl: url });
    }

    // Otherwise poll
    const imageUrl = await pollPrediction(prediction.id, apiKey);
    return res.status(200).json({ imageUrl });

  } catch (err: any) {
    console.error("Visualize error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}