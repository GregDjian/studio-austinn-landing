// Builds the WebAR model of a wall-mounted painting: a canvas box (front face
// textured with the painting, sides + back matte warm dark grey), as a glTF
// Document (for GLB) and as a USDZ for iOS AR Quick Look. Browser + Node safe:
// used by the product page (generated on the fly at the selected size) and by
// scripts/generate-painting-ar.mjs.
//
// The painting stands upright (Y-up) facing +Z, front face centred at the origin.
// The USDZ is anchored to vertical planes (walls); Quick Look uses +Y as the wall
// normal, so the USD meshes are rotated -90° about X.

import { Document } from "@gltf-transform/core";
import { zipSync, strToU8, type Zippable } from "fflate";

const BACK_COLOR = [0.069, 0.06, 0.051]; // sides + back; linear ≈ sRGB #4a4540 (warm dark grey)
const DEPTH      = 0.03;                  // 3 cm canvas depth, extending behind the front face

export interface PaintingModelOptions {
  /** JPEG bytes of the painting. */
  image: Uint8Array;
  /** Metres. */
  width: number;
  /** Metres. */
  height: number;
  /** Base name of the USD layer inside the USDZ. */
  name?: string;
}

type Vec3 = [number, number, number];

function geometry(width: number, height: number) {
  const hw = width / 2, hh = height / 2;
  // Back + four sides of the canvas box (z from 0 to -DEPTH). Each face has its own
  // 4 vertices for flat shading; corners are listed CCW as seen from outside.
  const x0 = -hw, x1 = hw, y0 = -hh, y1 = hh, zf = 0, zb = -DEPTH;
  const faces: { n: Vec3; v: Vec3[] }[] = [
    { n: [0, 0, -1], v: [[x1, y0, zb], [x0, y0, zb], [x0, y1, zb], [x1, y1, zb]] }, // back
    { n: [1, 0, 0],  v: [[x1, y0, zf], [x1, y0, zb], [x1, y1, zb], [x1, y1, zf]] }, // right
    { n: [-1, 0, 0], v: [[x0, y0, zb], [x0, y0, zf], [x0, y1, zf], [x0, y1, zb]] }, // left
    { n: [0, 1, 0],  v: [[x0, y1, zf], [x1, y1, zf], [x1, y1, zb], [x0, y1, zb]] }, // top
    { n: [0, -1, 0], v: [[x1, y0, zf], [x0, y0, zf], [x0, y0, zb], [x1, y0, zb]] }, // bottom
  ];
  return {
    hw, hh,
    BOX_FACES:  faces,
    boxPoints:  faces.flatMap((face) => face.v),
    boxNormals: faces.flatMap((face) => face.v.map(() => face.n)),
  };
}

/** glTF scene; write it with NodeIO / WebIO `.writeBinary()` to get a GLB. */
export function buildPaintingDocument({ image, width, height }: PaintingModelOptions): Document {
  const { hw, hh, BOX_FACES, boxPoints, boxNormals } = geometry(width, height);
  const doc    = new Document();
  const buffer = doc.createBuffer();
  const acc = (type: "VEC2" | "VEC3" | "SCALAR", arr: Float32Array | Uint16Array) =>
    doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);

  const texture = doc.createTexture("painting").setImage(image).setMimeType("image/jpeg");

  const frontMat = doc.createMaterial("Painting")
    .setBaseColorTexture(texture)
    .setMetallicFactor(0)
    .setRoughnessFactor(0.9);

  const backMat = doc.createMaterial("Back")
    .setBaseColorFactor([BACK_COLOR[0], BACK_COLOR[1], BACK_COLOR[2], 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(1);

  // glTF UV origin is top-left, so the bottom edge has v = 1. CCW from +Z.
  const front = doc.createPrimitive()
    .setAttribute("POSITION",   acc("VEC3", new Float32Array([-hw, -hh, 0,  hw, -hh, 0,  hw, hh, 0,  -hw, hh, 0])))
    .setAttribute("NORMAL",     acc("VEC3", new Float32Array([0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1])))
    .setAttribute("TEXCOORD_0", acc("VEC2", new Float32Array([0, 1,  1, 1,  1, 0,  0, 0])))
    .setIndices(acc("SCALAR", new Uint16Array([0, 1, 2, 0, 2, 3])))
    .setMaterial(frontMat);

  const back = doc.createPrimitive()
    .setAttribute("POSITION", acc("VEC3", new Float32Array(boxPoints.flat())))
    .setAttribute("NORMAL",   acc("VEC3", new Float32Array(boxNormals.flat())))
    .setIndices(acc("SCALAR", new Uint16Array(BOX_FACES.flatMap((_, i) => [0, 1, 2, 0, 2, 3].map((k) => i * 4 + k)))))
    .setMaterial(backMat);

  const mesh = doc.createMesh("Painting").addPrimitive(front).addPrimitive(back);
  const node = doc.createNode("Painting").setMesh(mesh);
  doc.getRoot().setDefaultScene(doc.createScene("Scene").addChild(node));
  return doc;
}

/** USDZ bytes (no USD toolchain needed: USDA text + texture in an uncompressed,
 *  64-byte-aligned zip, as the USDZ spec requires). */
export function buildPaintingUsdz({ image, width, height, name = "painting" }: PaintingModelOptions): Uint8Array {
  const { hw, hh, BOX_FACES, boxPoints, boxNormals } = geometry(width, height);
  const f = (n: number) => Number(n.toFixed(6));
  const pts = (z: number) => `[(${f(-hw)}, ${f(-hh)}, ${z}), (${f(hw)}, ${f(-hh)}, ${z}), (${f(hw)}, ${f(hh)}, ${z}), (${f(-hw)}, ${f(hh)}, ${z})]`;
  const vecList = (list: Vec3[]) => `[${list.map((p) => `(${p.map(f).join(", ")})`).join(", ")}]`;
  const texFile = "textures/painting.jpg";

  // USD UV origin is bottom-left (v = 0 at the bottom). Right-handed = CCW front faces.
  const usda = `#usda 1.0
(
    customLayerData = {
        string creator = "studio-austinn generate-painting-ar"
    }
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Root" (
    assetInfo = {
        string name = "${name}"
    }
    kind = "component"
)
{
    def Scope "Scenes" (
        kind = "sceneLibrary"
    )
    {
        def Xform "Scene" (
            customData = {
                bool preliminary_collidesWithEnvironment = 0
                string sceneName = "Scene"
            }
            sceneName = "Scene"
        )
        {
            # Quick Look only honours anchoring on a sceneLibrary Scene prim.
            token preliminary:anchoring:type = "plane"
            token preliminary:planeAnchoring:alignment = "vertical"

            def Mesh "Front"
            {
                # Quick Look wall anchoring uses +Y as the wall normal: lay the upright
                # painting back so its face points out of the wall.
                float3 xformOp:rotateXYZ = (-90, 0, 0)
                uniform token[] xformOpOrder = ["xformOp:rotateXYZ"]
                uniform bool doubleSided = 0
                int[] faceVertexCounts = [4]
                int[] faceVertexIndices = [0, 1, 2, 3]
                rel material:binding = </Root/Scenes/Scene/Materials/Painting>
                normal3f[] normals = [(0, 0, 1), (0, 0, 1), (0, 0, 1), (0, 0, 1)] (
                    interpolation = "vertex"
                )
                point3f[] points = ${pts(0)}
                texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)] (
                    interpolation = "vertex"
                )
                uniform token subdivisionScheme = "none"
            }

            def Mesh "Back"
            {
                # Quick Look wall anchoring uses +Y as the wall normal: lay the upright
                # painting back so its face points out of the wall.
                float3 xformOp:rotateXYZ = (-90, 0, 0)
                uniform token[] xformOpOrder = ["xformOp:rotateXYZ"]
                uniform bool doubleSided = 0
                int[] faceVertexCounts = [${BOX_FACES.map(() => 4).join(", ")}]
                int[] faceVertexIndices = [${boxPoints.map((_, i) => i).join(", ")}]
                rel material:binding = </Root/Scenes/Scene/Materials/Back>
                normal3f[] normals = ${vecList(boxNormals)} (
                    interpolation = "vertex"
                )
                point3f[] points = ${vecList(boxPoints)}
                uniform token subdivisionScheme = "none"
            }

            def Scope "Materials"
            {
                def Material "Painting"
                {
                    token outputs:surface.connect = </Root/Scenes/Scene/Materials/Painting/PreviewSurface.outputs:surface>

                    def Shader "PreviewSurface"
                    {
                        uniform token info:id = "UsdPreviewSurface"
                        color3f inputs:diffuseColor.connect = </Root/Scenes/Scene/Materials/Painting/Texture.outputs:rgb>
                        float inputs:metallic = 0
                        float inputs:roughness = 0.9
                        token outputs:surface
                    }

                    def Shader "PrimvarReader"
                    {
                        uniform token info:id = "UsdPrimvarReader_float2"
                        string inputs:varname = "st"
                        float2 outputs:result
                    }

                    def Shader "Texture"
                    {
                        uniform token info:id = "UsdUVTexture"
                        asset inputs:file = @${texFile}@
                        float2 inputs:st.connect = </Root/Scenes/Scene/Materials/Painting/PrimvarReader.outputs:result>
                        token inputs:sourceColorSpace = "sRGB"
                        token inputs:wrapS = "clamp"
                        token inputs:wrapT = "clamp"
                        float3 outputs:rgb
                    }
                }

                def Material "Back"
                {
                    token outputs:surface.connect = </Root/Scenes/Scene/Materials/Back/PreviewSurface.outputs:surface>

                    def Shader "PreviewSurface"
                    {
                        uniform token info:id = "UsdPreviewSurface"
                        color3f inputs:diffuseColor = (${BACK_COLOR.join(", ")})
                        float inputs:metallic = 0
                        float inputs:roughness = 1
                        token outputs:surface
                    }
                }
            }
        }
    }
}
`;

  // USDZ = uncompressed zip, USD layer first, every file's data 64-byte aligned.
  // Alignment is achieved by padding each local header's extra field.
  const entries: [string, Uint8Array][] = [[`${name}.usda`, strToU8(usda)], [texFile, image]];
  const files: Zippable = {};
  let offset = 0;
  for (const [file, data] of entries) {
    const base = offset + 30 + file.length + 4; // local header + name + extra-field header
    const pad = (64 - (base % 64)) % 64;
    files[file] = [data, { level: 0, extra: { 0x1986: new Uint8Array(pad) } }];
    offset = base + pad + data.length;
  }
  const usdz = zipSync(files, { level: 0 });

  // Verify alignment rather than trusting the arithmetic.
  const dv = new DataView(usdz.buffer, usdz.byteOffset, usdz.byteLength);
  let p = 0;
  for (const [file] of entries) {
    if (dv.getUint32(p, true) !== 0x04034b50) throw new Error("Unexpected zip layout");
    const size = dv.getUint32(p + 18, true);
    const dataStart = p + 30 + dv.getUint16(p + 26, true) + dv.getUint16(p + 28, true);
    if (dataStart % 64 !== 0) throw new Error(`${file} is not 64-byte aligned (${dataStart})`);
    p = dataStart + size;
  }
  return usdz;
}
