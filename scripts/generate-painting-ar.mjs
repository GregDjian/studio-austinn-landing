// Generates WebAR assets (GLB for model-viewer / Scene Viewer, USDZ for iOS
// AR Quick Look) for a wall-mounted painting. The model itself is built by
// lib/paintingModel.ts (shared with the product page's "View on your wall").
//
//   node scripts/generate-painting-ar.mjs [--image public/x.jpeg] [--name painting-test]
//                                         [--width 1] [--height 1] [--keep-aspect]
//
// Width/height are in metres. Output goes to public/ar/.

import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { buildPaintingDocument, buildPaintingUsdz } from "../lib/paintingModel.ts";

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const imagePath  = arg("image", "public/sanchoPanza.jpeg");
const name       = arg("name", "painting-test");
const outDir     = arg("out", "public/ar");
const keepAspect = args.includes("--keep-aspect");

// ── Image ────────────────────────────────────────────────────────────────────
const image = fs.readFileSync(imagePath);
if (image[0] !== 0xff || image[1] !== 0xd8) throw new Error(`${imagePath} is not a JPEG`);

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSOF) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("Could not read JPEG dimensions");
}
const px = jpegSize(image);

const width  = Number(arg("width", 1));
const height = keepAspect ? width * (px.h / px.w) : Number(arg("height", 1));
const opts   = { image: new Uint8Array(image), width, height, name };

// ── Write ────────────────────────────────────────────────────────────────────
fs.mkdirSync(outDir, { recursive: true });
const glbPath  = path.join(outDir, `${name}.glb`);
const usdzPath = path.join(outDir, `${name}.usdz`);
fs.writeFileSync(glbPath, await new NodeIO().writeBinary(buildPaintingDocument(opts)));
fs.writeFileSync(usdzPath, buildPaintingUsdz(opts));

// ── Report ───────────────────────────────────────────────────────────────────
const f    = (n) => Number(n.toFixed(6));
const size = (p) => `${fs.statSync(p).size.toLocaleString()} bytes`;
console.log(`image  ${imagePath} (${px.w}×${px.h}px)`);
console.log(`plane  ${f(width)}m × ${f(height)}m${!keepAspect && Math.abs(px.w / px.h - width / height) > 0.01 ? "  (image aspect differs — texture is stretched; use --keep-aspect)" : ""}`);
console.log(`glb    ${glbPath}  ${size(glbPath)}`);
console.log(`usdz   ${usdzPath}  ${size(usdzPath)}`);
