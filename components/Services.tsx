import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  X,
  Rotate3d,
  Move3d,
  ArrowUpRight,
  Send,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Language } from "../types";
import { processLeadInquiry } from "../services/geminiService";
import { getArtworks } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import bespokeCover from "../public/cover/bespoke2-cover.jpeg";
import paintingCover from "../public/cover/painting2-cover.jpeg";
import sculptureCover from "../public/cover/sculpture-cover.jpeg";
import installationCover from "../public/cover/installation-cover.jpeg";
import chandelierCover from "../public/cover/chandelier-cover.jpeg";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          src?: string;
          "shadow-intensity"?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "touch-action"?: string;
          style?: React.CSSProperties;
        };
      }
    }
  }
}

type ArtworkType = "painting" | "sculpture" | "chandelier" | "installation" | "bespoke";

interface Artwork {
  id: string;
  title: string;
  description: string;
  image: string;
  type: ArtworkType;
}

interface ServiceCategory {
  id: string;
  title: string;
  desc: string;
  image: string;
  modelUrl?: string;
  is3D?: boolean;
  gallery: Array<{ id: string; title: string; description: string; image: string }>;
}

const getUI = (lang: Language) => {
  if (lang === "ar") {
    return {
      catalogue: "الكتالوج",
      part: "قسم",
      browse: "تصفّح",
      curatedNote: "كل قطعة في مجموعتنا مُختارة بعناية لتلبي أعلى معايير التعبير الفني.",
      inquire: "استفسر عن التوفّر",
      inquireWa: "استفسر",
      close: "إغلاق",
      view3d: "عرض ثلاثي الأبعاد",
      viewerTitle: "عرض ثلاثي الأبعاد",
      viewerHint: "حرّك للتدوير والتقريب",
      rotate: "تدوير",
      zoom: "تقريب",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      message: "رسالتك",
      send: "إرسال الاستفسار",
      back: "العودة للمعرض",
      success: "شكراً لاهتمامكم.",
      inquiryTitle: "استفسار",
      loadingCatalogue: "جارٍ تحميل الكتالوج...",
      errorTryAgain: "حدث خطأ. حاول مرة أخرى.",
      emptyCategory: "لا توجد أعمال حالياً في هذا القسم.",
    };
  }
  return {
    catalogue: "Catalogue",
    part: "Part",
    browse: "Browse",
    curatedNote: "Every piece in our collection is meticulously curated to meet the highest standards of artistic expression.",
    inquire: "Inquire for availability",
    inquireWa: "Inquire",
    close: "Close",
    view3d: "3D View",
    viewerTitle: "3D View",
    viewerHint: "Interact to rotate & zoom",
    rotate: "Rotate",
    zoom: "Zoom",
    name: "Full Name",
    email: "Email Address",
    message: "Your Message",
    send: "Send Inquiry",
    back: "Back to Gallery",
    success: "Thank you for your interest.",
    inquiryTitle: "Inquiry",
    loadingCatalogue: "Loading catalogue...",
    errorTryAgain: "Something went wrong. Please try again.",
    emptyCategory: "No artworks currently in this category.",
  };
};

const CATEGORY_META: Array<{
  id: string;
  type: ArtworkType;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  coverImage: string;
  modelUrl?: string;
  is3D?: boolean;
}> = [
  { id: "01", type: "painting",      titleEn: "Paintings",      titleAr: "لوحات",       descEn: "Ethereal Canvas",   descAr: "قماشٌ أثيري",   coverImage: paintingCover },
  { id: "02", type: "sculpture",     titleEn: "Sculptures",     titleAr: "منحوتات",     descEn: "Form & Void",       descAr: "شكلٌ وفراغ",    coverImage: sculptureCover, is3D: false },
  { id: "03", type: "chandelier",    titleEn: "Chandeliers",    titleAr: "ثريات",       descEn: "Spatial Glow",      descAr: "وهجٌ مكاني",    coverImage: chandelierCover },
  { id: "04", type: "installation",  titleEn: "Installations",  titleAr: "تركيبات",    descEn: "Immersive Space",   descAr: "فضاءٌ غامر",    coverImage: installationCover },
  { id: "05", type: "bespoke",       titleEn: "Bespoke",        titleAr: "حسب الطلب",  descEn: "Commissioned",      descAr: "تكليف خاص",     coverImage: bespokeCover },
];

const BATCH_SIZE = 12;

interface ServicesProps {
  lang: Language;
}

const Services: React.FC<ServicesProps> = ({ lang }) => {
  const t = getUI(lang);

  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [active3DModel, setActive3DModel] = useState<string | null>(null);
  const [isInquiring, setIsInquiring] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiConfirmation, setAiConfirmation] = useState("");

  const [artworksData, setArtworksData] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [totalLoaded, setTotalLoaded] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getArtworks();
        const mapped: Artwork[] = (data || [])
          .map((a: any) => {
            const cover = a.coverImage ? imgUrl.card(a.coverImage) : "";
            return { id: a._id, title: a.title ?? "", description: a.description ?? "", image: cover, type: a.type as ArtworkType };
          })
          .filter((x: Artwork) => Boolean(x.id && x.type && x.image));
        if (!alive) return;
        setArtworksData(mapped);
      } catch (e) {
        if (!alive) return;
        setArtworksData([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const catalogueItems: ServiceCategory[] = useMemo(() => {
    const grouped = artworksData.reduce<Record<ArtworkType, Artwork[]>>((acc, art) => {
      (acc[art.type] ||= []).push(art);
      return acc;
    }, {} as Record<ArtworkType, Artwork[]>);

    return CATEGORY_META.map((cat) => ({
      id: cat.id,
      title: lang === "ar" ? cat.titleAr : cat.titleEn,
      desc: lang === "ar" ? cat.descAr : cat.descEn,
      image: cat.coverImage,
      modelUrl: cat.modelUrl,
      is3D: cat.is3D,
      gallery: (grouped[cat.type] ?? []).map((art) => ({
        id: art.id, title: art.title, description: art.description, image: art.image,
      })),
    }));
  }, [artworksData, lang]);

  useEffect(() => {
    if (activeCategory || active3DModel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setIsInquiring(false);
      setSubmitStatus("idle");
      setFormData({ name: "", email: "", message: "" });
      setAiConfirmation("");
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [activeCategory, active3DModel]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setTotalLoaded(0);
  }, [activeCategory?.id]);

  useEffect(() => {
    if (!activeCategory) return;
    const total = activeCategory.gallery.length;
    if (totalLoaded >= visibleCount && visibleCount < total) {
      setVisibleCount(v => Math.min(v + BATCH_SIZE, total));
    }
  }, [totalLoaded, visibleCount, activeCategory]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      const response = await processLeadInquiry(lang, { ...formData, interest: activeCategory?.title || "" });
      setAiConfirmation(response);
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section id="services" dir={lang === "ar" ? "rtl" : "ltr"} className="relative w-full min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-400 text-xs uppercase tracking-widest">
          <Loader2 className="animate-spin" size={16} />
          {t.loadingCatalogue}
        </div>
      </section>
    );
  }

  return (
    <section
      id="services"
      dir={lang === "ar" ? "rtl" : "ltr"}
      aria-label={lang === "ar" ? "كتالوج الأعمال الفنية — ستوديو أوستن" : "Art Catalogue — Studio Austinn Dubai"}
      className="relative w-full bg-stone-950"
    >
      <p className="sr-only">
        {lang === "ar"
          ? "كتالوج ستوديو أوستن — لوحات، منحوتات، ثريات، تركيبات فنية، وأعمال مخصصة في دبي والإمارات"
          : "Studio Austinn catalogue — paintings, sculptures, chandeliers, installations and commissioned artworks in Dubai, UAE"}
      </p>

      {catalogueItems.map((item, index) => (
        <div
          key={item.id}
          className="relative w-full h-[20vh] min-h-[100px] overflow-hidden group cursor-pointer"
          onClick={() => setActiveCategory(item)}
        >
          {/* Background image */}
          <img
            src={item.image}
            alt={`${item.title} — Studio Austinn`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-700" />

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top left: index */}
          <div className={`absolute top-8 ${lang === "ar" ? "right-8 md:right-12" : "left-8 md:left-12"} z-10`}>
            <span className="font-serif italic text-white/30 text-2xl md:text-3xl leading-none select-none">
              {item.id}
            </span>
          </div>

          {/* Top right: catalogue label */}
          <div className={`absolute bottom-3 right-4 md:top-10 md:bottom-auto ${lang === "ar" ? "md:left-8 md:right-auto" : "md:right-8 md:right-12"} z-10`}>
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">
              {t.catalogue}
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute inset-0 z-10 p-4 md:p-6 flex flex-col items-center justify-center text-center">
            {/* Category desc */}
            <p className="font-serif italic text-white/50 text-xs mb-1 tracking-wide">
              {item.desc}
            </p>

            {/* Title */}
            <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tighter text-white leading-none mb-2">
              {item.title}
            </h2>

            {/* Browse CTA */}
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                {t.browse}
              </span>
              <div className="w-9 h-9 rounded-full border border-white/50 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                <ArrowUpRight size={15} className="text-white" />
              </div>
            </div>
          </div>

          {/* Divider line between sections */}
          {index < catalogueItems.length - 1 && (
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-white/10 z-20" />
          )}
        </div>
      ))}

      {/* Gallery Modal */}
      {activeCategory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-100/90 backdrop-blur-2xl animate-fade-in-up">
          <div className="absolute inset-0 cursor-auto" onClick={() => setActiveCategory(null)} />
          <div
            className="relative w-full max-w-7xl h-full md:h-[90vh] bg-white md:rounded-sm shadow-2xl border-x border-stone-200 overflow-hidden flex flex-col"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 md:p-10 bg-white/80 backdrop-blur-md border-b border-stone-100">
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
                  {t.catalogue} {activeCategory.id}
                </span>
                <h2 className="font-sans font-black text-3xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-none">
                  {activeCategory.title}
                </h2>
                {activeCategory.is3D && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActive3DModel(activeCategory.modelUrl || null); }}
                    className="flex items-center gap-2 px-3 py-1 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
                  >
                    <Box size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.view3d}</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveCategory(null)}
                className="p-3 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-full transition-all"
                aria-label={t.close}
              >
                <X size={20} />
              </button>
            </div>

            {/* Gallery Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide">
              {!isInquiring ? (
                <>
                  {activeCategory.gallery.length === 0 ? (
                    <div className="py-20 text-center text-stone-400 text-xs uppercase tracking-widest">
                      {t.emptyCategory}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                      {activeCategory.gallery.slice(0, visibleCount).map((art, i) => (
                        <div key={art.id} style={{ animationDelay: `${i * 50}ms` }} className="group">
                          <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
                            <img
                              src={art.image}
                              alt={`${art.title} — ${activeCategory.title} | Studio Austinn`}
                              loading="lazy"
                              decoding="async"
                              onLoad={() => setTotalLoaded(c => c + 1)}
                              onError={() => setTotalLoaded(c => c + 1)}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />
                            <a
                              href={`https://wa.me/971581558866?text=${encodeURIComponent(
                                lang === "ar"
                                  ? `مرحباً، اطّلعت على كتالوج ستوديو أوستن وأنا مهتم بالعمل الفني التالي:\n\n🖼 ${art.title}\n📂 ${activeCategory.title}\n\nهل يمكنك مشاركة مزيد من التفاصيل حول التوفر والسعر؟\n🌐 www.studioaustinn.com`
                                  : `https://studioaustinn.com/ \nHello, I came across Studio Austinn's catalogue and I'm interested in the following artwork:\n\n- ${art.title}\n- ${activeCategory.title}\n\nCould you share more details on availability and pricing?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            >
                              <span className="bg-stone-900/85 text-white text-[10px] font-bold uppercase tracking-[0.25em] px-5 py-2.5 backdrop-blur-sm scale-90 translate-y-2 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300">
                                {t.inquireWa}
                              </span>
                            </a>
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="font-serif text-lg text-stone-900 leading-tight">{art.title}</h4>
                            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400">{art.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-20 border-t border-stone-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="font-serif italic text-stone-500 max-w-sm text-center md:text-left">{t.curatedNote}</p>
                    <button
                      onClick={() => setIsInquiring(true)}
                      className="px-8 py-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-stone-700 transition-all"
                    >
                      {t.inquire}
                    </button>
                  </div>
                </>
              ) : (
                <div className="max-w-2xl mx-auto py-10 animate-fade-in-up">
                  <button
                    onClick={() => { setIsInquiring(false); setSubmitStatus("idle"); }}
                    className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[10px] font-bold uppercase tracking-widest mb-12"
                  >
                    <ArrowLeft size={14} className="rtl:rotate-180" /> {t.back}
                  </button>

                  {submitStatus === "success" ? (
                    <div className="text-center py-20 animate-fade-in-up">
                      <div className="flex justify-center mb-6 text-sky-400">
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-stone-900 mb-4">{t.success}</h3>
                      <div className="bg-stone-50 p-8 border border-stone-100 italic font-serif text-stone-600 leading-relaxed">
                        "{aiConfirmation}"
                      </div>
                    </div>
                  ) : (
                    <form className="space-y-10" onSubmit={handleInquirySubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="relative">
                          <label className={["absolute", lang === "ar" ? "right-0" : "left-0", "transition-all duration-300 text-[10px] uppercase tracking-widest", formData.name ? "-top-6 text-stone-400" : "top-2 text-stone-300"].join(" ")}>
                            {t.name}
                          </label>
                          <input
                            type="text" required value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors text-stone-900"
                          />
                        </div>
                        <div className="relative">
                          <label className={["absolute", lang === "ar" ? "right-0" : "left-0", "transition-all duration-300 text-[10px] uppercase tracking-widest", formData.email ? "-top-6 text-stone-400" : "top-2 text-stone-300"].join(" ")}>
                            {t.email}
                          </label>
                          <input
                            type="email" required value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors text-stone-900"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <label className={["absolute", lang === "ar" ? "right-0" : "left-0", "transition-all duration-300 text-[10px] uppercase tracking-widest", formData.message ? "-top-6 text-stone-400" : "top-2 text-stone-300"].join(" ")}>
                          {t.message}
                        </label>
                        <textarea
                          rows={4} value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors text-stone-900 resize-none"
                        />
                      </div>
                      <button
                        type="submit" disabled={isSubmitting}
                        className="w-full py-5 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} className="rtl:rotate-180" /> {t.send}</>}
                      </button>
                      {submitStatus === "error" && (
                        <p className="text-[10px] uppercase tracking-widest text-red-500 text-center">{t.errorTryAgain}</p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3D Model Viewer Modal */}
      {active3DModel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-100/80 backdrop-blur-md animate-fade-in-up">
          <div className="absolute inset-0 cursor-auto" onClick={() => setActive3DModel(null)} />
          <div
            className="relative w-full max-w-4xl h-[80vh] md:h-[70vh] bg-stone-50 rounded-sm shadow-2xl border border-white overflow-hidden m-4 md:m-6"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <button
              onClick={() => setActive3DModel(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-3 md:p-2 bg-white/80 md:bg-white/50 hover:bg-white rounded-full transition-colors shadow-sm"
              aria-label={t.close}
            >
              <X size={20} className="text-stone-900 md:w-6 md:h-6" />
            </button>
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 pointer-events-none mix-blend-multiply">
              <h3 className="font-sans font-black text-xl md:text-2xl uppercase tracking-tighter text-stone-900 leading-none">{t.viewerTitle}</h3>
              <p className="font-serif italic text-stone-500 text-xs md:text-base">{t.viewerHint}</p>
            </div>
            <div className="w-full h-full pt-16">
              <model-viewer src={active3DModel} shadow-intensity="1" camera-controls auto-rotate touch-action="pan-y" style={{ width: "100%", height: "100%", backgroundColor: "transparent" } as React.CSSProperties} />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 text-[9px] md:text-xs font-bold uppercase tracking-widest text-stone-400 pointer-events-none bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="flex items-center gap-1"><Rotate3d size={14} /> {t.rotate}</span>
              <span className="flex items-center gap-1"><Move3d size={14} /> {t.zoom}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;