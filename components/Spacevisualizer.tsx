import React, { useEffect, useState, useRef } from "react";
import { Upload, Sparkles, ArrowUpRight, RotateCcw, ImageIcon, X, MapPin } from "lucide-react";
import { Language } from "../types";
import { getArtworks } from "../lib/sanityQueries";
import { urlFor } from "../lib/sanityImage";

interface Artwork {
  id: string;
  title: string;
  image: string;
  type: string;
}

interface PinPosition {
  x: number;
  y: number;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      eyebrow: "تجربة تفاعلية",
      title: "تخيّل",
      titleAccent: "قطعتك",
      subtitle: "ارفع صورة مساحتك، اختر قطعة من كتالوجنا، ثم انقر على المكان الذي تريد وضع القطعة فيه.",
      uploadRoom: "ارفع صورة مساحتك",
      uploadHint: "صالة / غرفة / لوبي...",
      pinHint: "انقر على الجدار لتحديد مكان القطعة",
      pinSet: "تم تحديد الموضع",
      selectArt: "اختر قطعة فنية",
      selectHint: "من كتالوجنا",
      generate: "تخيّل في مساحتي",
      generating: "جارٍ التصوير...",
      result: "النتيجة",
      tryAnother: "جرّب قطعة أخرى",
      inquire: "استفسر عن هذه القطعة",
      error: "حدث خطأ. حاول مرة أخرى.",
      loadingArtworks: "جارٍ التحميل...",
      step1: "١. ارفع صورة مساحتك",
      step2: "٢. انقر لتحديد مكان القطعة",
      step3: "٣. اختر قطعة فنية",
    };
  }
  return {
    eyebrow: "AI Experience",
    title: "Visualize",
    titleAccent: "Your Space",
    subtitle: "Upload a photo of your room, pick a piece from our catalogue, then tap where you want it placed.",
    uploadRoom: "Upload your space",
    uploadHint: "Living room / lobby / villa...",
    pinHint: "Click on the wall to place the artwork",
    pinSet: "Position set",
    selectArt: "Select an artwork",
    selectHint: "From our catalogue",
    generate: "Visualize in my space",
    generating: "Generating...",
    result: "Your Preview",
    tryAnother: "Try another piece",
    inquire: "Inquire about this piece",
    error: "Something went wrong. Please try again.",
    loadingArtworks: "Loading...",
    step1: "1. Upload your space",
    step2: "2. Click to place artwork",
    step3: "3. Select an artwork",
  };
};

// ── Position → human-readable ──────────────────────────────────────────────
function getPositionDescription(x: number, y: number, lang: Language): string {
  if (lang === "ar") {
    const h = x < 0.33 ? "الجانب الأيسر" : x < 0.66 ? "وسط" : "الجانب الأيمن";
    const v = y < 0.33 ? "الجزء العلوي من" : y < 0.66 ? "منتصف" : "الجزء السفلي من";
    return `${v} ${h} الجدار`;
  }
  const h = x < 0.33 ? "left side of the" : x < 0.66 ? "center of the" : "right side of the";
  const v = y < 0.33 ? "upper" : y < 0.66 ? "middle" : "lower";
  return `${v} ${h} wall`;
}

// ── Compress image aggressively ────────────────────────────────────────────
const compressImage = (file: File, maxWidth = 600): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], "compressed.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.5);
    };
    img.src = URL.createObjectURL(file);
  });
};

// ── File → base64 ──────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Fetch remote image as base64 ───────────────────────────────────────────
async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mimeType: blob.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Visualize via /api/gemini ──────────────────────────────────────────────
async function visualizeArtworkInSpace(
  roomImageBase64: string,
  artworkImageBase64: string,
  artworkTitle: string,
  pinPosition: PinPosition | null,
  lang: Language
): Promise<string> {
  const positionHint = pinPosition
    ? lang === "ar"
      ? `المستخدم يريد وضع القطعة الفنية في ${getPositionDescription(pinPosition.x, pinPosition.y, lang)} تحديداً. `
      : `The user specifically wants the artwork placed on the ${getPositionDescription(pinPosition.x, pinPosition.y, lang)}. `
    : "";

  const prompt =
    lang === "ar"
      ? `${positionHint}أنت مصمم داخلي خبير ومستشار فني. بناءً على الصورتين، صِف بشكل واقعي ومُلهم كيف ستبدو القطعة الفنية "${artworkTitle}" في هذه المساحة: التأثير البصري، التناسق مع الديكور الموجود، والجو العام الذي ستخلقه.`
      : `${positionHint}You are an expert interior designer and art consultant. Based on both images, give a vivid and realistic description of how the artwork "${artworkTitle}" would look in this specific room: the visual impact, how it harmonizes with the existing decor, and the atmosphere it would create.`;

  const resp = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "visualize",
      lang,
      prompt,
      roomImage: { base64: roomImageBase64, mimeType: "image/jpeg" },
      artworkImage: { base64: artworkImageBase64, mimeType: "image/jpeg" },
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  return typeof data?.text === "string" && data.text.trim().length > 0
    ? data.text.trim()
    : lang === "ar"
    ? "عذراً، لم أتمكن من تحليل الصورتين. حاول مرة أخرى."
    : "Sorry, I could not analyze the images. Please try again.";
}

// ── Component ──────────────────────────────────────────────────────────────
const SpaceVisualizer: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = getContent(lang);
  const isAr = lang === "ar";

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [pinPosition, setPinPosition] = useState<PinPosition | null>(null);
  const [isPinMode, setIsPinMode] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);

  const roomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getArtworks();
        const mapped: Artwork[] = (data || [])
          .map((a: any) => ({
            id: a._id,
            title: a.title ?? "",
            image: a.coverImage?.asset ? urlFor(a.coverImage).width(400).url() : "",
            type: a.type ?? "",
          }))
          .filter((x: Artwork) => x.id && x.image);
        setArtworks(mapped);
      } catch {
        setArtworks([]);
      }
    })();
  }, []);

  const handleRoomUpload = (file: File) => {
    setRoomFile(file);
    setRoomPreview(URL.createObjectURL(file));
    setPinPosition(null);
    setResult(null);
    setError(null);
    setIsPinMode(true);
  };

  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!roomPreview || !isPinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPinPosition({ x, y });
    setIsPinMode(false);
  };

  const handleGenerate = async () => {
    if (!roomFile || !selectedArtwork) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Compress room image
      const compressedRoom = await compressImage(roomFile, 600);
      const { base64: roomB64 } = await fileToBase64(compressedRoom);

      // Compress artwork image
      const artRaw = await urlToBase64(selectedArtwork.image);
      const artBlob = await fetch(`data:${artRaw.mimeType};base64,${artRaw.base64}`).then(r => r.blob());
      const artFile = new File([artBlob], "artwork.jpg", { type: artRaw.mimeType });
      const artCompressed = await compressImage(artFile, 600);
      const { base64: artB64 } = await fileToBase64(artCompressed);

      const description = await visualizeArtworkInSpace(
        roomB64,
        artB64,
        selectedArtwork.title,
        pinPosition,
        lang
      );
      setResult(description);
    } catch (e) {
      console.error("Visualization error:", e);
      setError(t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setSelectedArtwork(null);
    setRoomFile(null);
    setRoomPreview(null);
    setPinPosition(null);
    setIsPinMode(false);
  };

  const canGenerate = roomFile && selectedArtwork && !isGenerating;

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative bg-stone-50 border-t border-stone-200 py-16 md:py-20 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none [background-image:linear-gradient(to_right,rgba(0,0,0,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.4)_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">

        {/* Header */}
        <div className={`flex flex-col ${isAr ? "items-end text-right" : "items-start text-left"} mb-10`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 mb-3 flex items-center gap-2">
            <Sparkles size={12} />
            {t.eyebrow}
          </p>
          <h2 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-none">
            {t.title} <span className="text-stone-400">{t.titleAccent}</span>
          </h2>
          <p className="mt-3 text-stone-500 text-sm md:text-base max-w-xl leading-relaxed font-serif italic">
            {t.subtitle}
          </p>
        </div>

        {!result ? (
          <div className="space-y-4">

            {/* Steps */}
            <div className="flex items-center gap-6 mb-6">
              {[t.step1, t.step2, t.step3].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors ${
                    (i === 0 && roomFile) || (i === 1 && pinPosition) || (i === 2 && selectedArtwork)
                      ? "bg-stone-900 text-white"
                      : "bg-stone-200 text-stone-500"
                  }`}>
                    {(i === 0 && roomFile) || (i === 1 && pinPosition) || (i === 2 && selectedArtwork) ? "✓" : i + 1}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hidden md:block">{step}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

              {/* Room upload + pin */}
              <div className="flex flex-col gap-2">
                <div
                  className={`relative group rounded-[8px] border-2 overflow-hidden bg-white transition-all duration-300 ${
                    isPinMode
                      ? "border-stone-900 cursor-crosshair"
                      : roomPreview
                      ? "border-stone-300 cursor-default"
                      : "border-dashed border-stone-300 hover:border-stone-900 cursor-pointer"
                  }`}
                  style={{ minHeight: "220px" }}
                  onClick={isPinMode ? handleRoomClick : () => !roomPreview && roomInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) handleRoomUpload(file);
                  }}
                >
                  <input
                    ref={roomInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRoomUpload(f); }}
                  />

                  {roomPreview ? (
                    <>
                      <img src={roomPreview} alt="Your space" className="w-full h-full object-cover absolute inset-0" />

                      {/* Pin mode overlay */}
                      {isPinMode && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                            <MapPin size={14} className="text-stone-900" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900">{t.pinHint}</span>
                          </div>
                        </div>
                      )}

                      {/* Pin marker */}
                      {pinPosition && !isPinMode && (
                        <div
                          className="absolute pointer-events-none z-20"
                          style={{
                            left: `${pinPosition.x * 100}%`,
                            top: `${pinPosition.y * 100}%`,
                            transform: "translate(-50%, -100%)",
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-white border-2 border-stone-900 shadow-lg" />
                            <div className="w-[2px] h-4 bg-stone-900" />
                          </div>
                        </div>
                      )}

                      {/* Remove photo */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomFile(null);
                          setRoomPreview(null);
                          setPinPosition(null);
                          setIsPinMode(false);
                          setResult(null);
                        }}
                        className="absolute top-3 right-3 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors z-30"
                      >
                        <X size={14} className="text-stone-900" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                      <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-stone-900 transition-colors flex items-center justify-center">
                        <Upload size={20} className="text-stone-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-700">{t.uploadRoom}</p>
                        <p className="text-[10px] text-stone-400 mt-1 font-serif italic">{t.uploadHint}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pin controls */}
                {roomPreview && (
                  <div className="flex items-center gap-2">
                    {pinPosition && !isPinMode ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-1 text-[10px] font-bold uppercase tracking-widest overflow-hidden">
                          <MapPin size={12} className="text-stone-900 shrink-0" />
                          <span className="text-stone-900 shrink-0">{t.pinSet}</span>
                          <span className="text-stone-400 truncate">— {getPositionDescription(pinPosition.x, pinPosition.y, lang)}</span>
                        </div>
                        <button
                          onClick={() => { setPinPosition(null); setIsPinMode(true); }}
                          className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors underline underline-offset-4 shrink-0"
                        >
                          {isAr ? "تغيير" : "Change"}
                        </button>
                      </>
                    ) : !isPinMode ? (
                      <button
                        onClick={() => setIsPinMode(true)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors border border-stone-300 hover:border-stone-900 px-3 py-2 rounded"
                      >
                        <MapPin size={12} />
                        {t.pinHint}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Select artwork */}
              <div
                className="relative group cursor-pointer rounded-[8px] border-2 border-dashed border-stone-300 hover:border-stone-900 transition-colors duration-300 overflow-hidden bg-white"
                style={{ minHeight: "220px" }}
                onClick={() => setShowArtworkPicker(true)}
              >
                {selectedArtwork ? (
                  <>
                    <img src={selectedArtwork.image} alt={selectedArtwork.title} className="w-full h-full object-cover absolute inset-0" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest">{t.selectArt}</p>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-900 truncate">{selectedArtwork.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedArtwork(null); setResult(null); }}
                      className="absolute top-3 right-3 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <X size={14} className="text-stone-900" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                    <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-stone-900 transition-colors flex items-center justify-center">
                      <ImageIcon size={20} className="text-stone-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-700">{t.selectArt}</p>
                      <p className="text-[10px] text-stone-400 mt-1 font-serif italic">{t.selectHint}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-4 bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-stone-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-100" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200" />
                  <span className="ml-2">{t.generating}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {t.generate}
                </>
              )}
            </button>
            {error && <p className="text-center text-red-500 text-[10px] uppercase tracking-widest mt-2">{error}</p>}
          </div>
        ) : (
          /* Result */
          <div className="animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative rounded-[8px] overflow-hidden aspect-[4/3]">
                {roomPreview && <img src={roomPreview} alt="Your space" className="w-full h-full object-cover" />}
                {pinPosition && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: `${pinPosition.x * 100}%`,
                      top: `${pinPosition.y * 100}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-stone-900 shadow-lg" />
                      <div className="w-[2px] h-4 bg-stone-900" />
                    </div>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-stone-700">
                  {isAr ? "مساحتك" : "Your Space"}
                </div>
              </div>
              {selectedArtwork && (
                <div className="relative rounded-[8px] overflow-hidden aspect-[4/3]">
                  <img src={selectedArtwork.image} alt={selectedArtwork.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-stone-700">
                    {selectedArtwork.title}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-stone-200 rounded-[8px] p-6 md:p-8 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 mb-4 flex items-center gap-2">
                <Sparkles size={11} /> {t.result}
              </p>
              <p className="font-serif italic text-stone-700 text-base md:text-lg leading-relaxed">
                "{result}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#contact"
                className="flex-1 py-4 bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-stone-700 transition-colors"
              >
                {t.inquire} <ArrowUpRight size={14} />
              </a>
              <button
                onClick={reset}
                className="flex-1 py-4 border border-stone-300 text-stone-700 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:border-stone-900 hover:text-stone-900 transition-colors"
              >
                <RotateCcw size={14} /> {t.tryAnother}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Artwork Picker Modal */}
      {showArtworkPicker && (
        <div className="fixed inset-0 z-[120] bg-stone-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-8 animate-fade-in-up">
          <div className="relative w-full md:max-w-3xl bg-white rounded-t-[16px] md:rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">{t.selectArt}</p>
              <button
                onClick={() => setShowArtworkPicker(false)}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <X size={16} className="text-stone-900" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 md:p-6">
              {artworks.length === 0 ? (
                <p className="text-center text-stone-400 text-xs uppercase tracking-widest py-10">{t.loadingArtworks}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {artworks.map((art) => (
                    <div
                      key={art.id}
                      className={`group relative cursor-pointer rounded-[6px] overflow-hidden border-2 transition-all duration-300 ${
                        selectedArtwork?.id === art.id
                          ? "border-stone-900 shadow-lg"
                          : "border-transparent hover:border-stone-400"
                      }`}
                      onClick={() => { setSelectedArtwork(art); setShowArtworkPicker(false); setResult(null); }}
                    >
                      <div className="aspect-square overflow-hidden bg-stone-100">
                        <img
                          src={art.image}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-700 truncate">{art.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SpaceVisualizer;