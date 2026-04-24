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
    const { roomImage, artworkTitle, positionDescription, lang } = body;

    if (!roomImage?.base64) {
      return res.status(400).json({ error: "Missing room image" });
    }

    // Build data URI for room image
    const roomDataUri = `data:${roomImage.mimeType || "image/jpeg"};base64,${roomImage.base64}`;

    // Build prompt
    const positionHint = positionDescription
      ? `Place the artwork on the ${positionDescription}.`
      : "Place the artwork naturally on the wall.";

    const prompt = lang === "ar"
      ? `صورة تصميم داخلي فوتوغرافية عالية الجودة. ضع لوحة فنية بإطار أنيق على الجدار بشكل طبيعي. احتفظ بكل عناصر الغرفة الأصلية دون تغيير.`
      : `${positionHint} Add the artwork "${artworkTitle}" mounted on the wall. High quality photorealistic interior design photography. Keep all existing furniture, decor, lighting and colors exactly as they are. Only add the artwork on the wall.`;

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
          input_image: roomDataUri,
          guidance: 3.5,
          steps: 28,
          output_format: "webp",
          output_quality: 85,
        },
      }),
    });

    const prediction = await createResp.json();

    if (!createResp.ok) {
      console.error("Replicate create error:", JSON.stringify(prediction));
      return res.status(502).json({ error: "Failed to create prediction", detail: prediction });
    }

    // If already succeeded
    if (prediction.status === "succeeded") {
      const output = prediction.output;
      const url = typeof output === "string" ? output : Array.isArray(output) ? output[0] : null;
      if (url) return res.status(200).json({ imageUrl: url });
    }

    // Poll for result
    const imageUrl = await pollPrediction(prediction.id, apiKey);
    return res.status(200).json({ imageUrl });

  } catch (err: any) {
    console.error("Visualize error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}