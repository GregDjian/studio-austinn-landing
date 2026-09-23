import React, { useEffect, useRef, useState } from "react";
import { Loader2, Scan } from "lucide-react";
import { Language } from "../types";

// "View on your wall" — builds the painting's AR model in the browser at the given
// real-world size (lib/paintingModel.ts) and opens it:
//   iOS     → AR Quick Look (USDZ, anchored to walls)
//   Android → model-viewer WebXR session (GLB, ar-placement="wall")
// Renders nothing on devices without AR (desktop, unsupported phones).

type ArMode = "quicklook" | "webxr";

interface ArWallButtonProps {
  lang: Language;
  /** JPEG URL of the painting image (texture). */
  imageUrl: string;
  widthCm: number;
  heightCm: number;
  className?: string;
}

async function detectArMode(): Promise<ArMode | null> {
  if (document.createElement("a").relList?.supports?.("ar")) return "quicklook";
  const xr = (navigator as any).xr;
  try {
    if (xr && (await xr.isSessionSupported("immersive-ar"))) return "webxr";
  } catch {
    /* not supported */
  }
  return null;
}

// Image bytes are shared across sizes — switching size only rebuilds the geometry.
const imageCache = new Map<string, Promise<Uint8Array>>();
const fetchImage = (url: string) => {
  if (!imageCache.has(url)) {
    const p = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => new Uint8Array(buf));
    p.catch(() => imageCache.delete(url));
    imageCache.set(url, p);
  }
  return imageCache.get(url)!;
};

const ArWallButton: React.FC<ArWallButtonProps> = ({ lang, imageUrl, widthCm, heightCm, className = "" }) => {
  const [mode, setMode]         = useState<ArMode | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const viewerHost              = useRef<HTMLDivElement>(null);
  const viewer                  = useRef<any>(null);

  useEffect(() => {
    detectArMode().then(setMode);
  }, []);

  // Build the model ahead of the tap, so opening AR is instant and keeps the
  // user gesture (Quick Look / WebXR both require one).
  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    let url: string | null = null;
    setModelUrl(null);
    (async () => {
      const [model, image] = await Promise.all([import("../lib/paintingModel"), fetchImage(imageUrl)]);
      const opts = { image, width: widthCm / 100, height: heightCm / 100, name: "painting" };
      let blob: Blob;
      if (mode === "quicklook") {
        blob = new Blob([model.buildPaintingUsdz(opts)], { type: "model/vnd.usdz+zip" });
      } else {
        const { WebIO } = await import("@gltf-transform/core");
        blob = new Blob([await new WebIO().writeBinary(model.buildPaintingDocument(opts))], { type: "model/gltf-binary" });
      }
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setModelUrl(url);
    })().catch((err) => console.error("AR model build failed", err));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mode, imageUrl, widthCm, heightCm]);

  // Android: a hidden model-viewer (registered globally in index.html) hosts the
  // WebXR session.
  useEffect(() => {
    if (mode !== "webxr" || !modelUrl || !viewerHost.current) return;
    const mv = document.createElement("model-viewer");
    mv.setAttribute("src", modelUrl);
    mv.setAttribute("ar", "");
    mv.setAttribute("ar-modes", "webxr");
    mv.setAttribute("ar-placement", "wall");
    mv.setAttribute("ar-scale", "fixed");
    mv.setAttribute("loading", "eager");
    mv.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
    viewerHost.current.appendChild(mv);
    viewer.current = mv;
    return () => {
      mv.remove();
      viewer.current = null;
    };
  }, [mode, modelUrl]);

  if (!mode) return null;

  const open = () => {
    if (!modelUrl) return;
    if (mode === "quicklook") {
      // Same technique as model-viewer: a rel="ar" link with an <img> child.
      const a = document.createElement("a");
      a.rel = "ar";
      a.href = `${modelUrl}#allowsContentScaling=0`;
      a.download = "painting.usdz";
      a.appendChild(document.createElement("img"));
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      viewer.current?.activateAR();
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={open}
        disabled={!modelUrl}
        className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-stone-200 text-stone-900 font-sans font-bold text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-stone-400 disabled:opacity-60"
      >
        {modelUrl ? <Scan size={16} strokeWidth={1.75} /> : <Loader2 size={16} className="animate-spin" />}
        {lang === "ar" ? "شاهدها على جدارك" : "View on your wall"}
      </button>
      <div ref={viewerHost} />
    </div>
  );
};

export default ArWallButton;
