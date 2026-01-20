import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  X,
  Rotate3d,
  Move3d,
  ArrowUpRight,
  Maximize2,
  Send,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Language } from "../types";
import { processLeadInquiry } from "../services/geminiService";

// Extend the IntrinsicElements interface globally to support custom web components like <model-viewer>.
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

interface Artwork {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface ServiceCategory {
  id: string;
  title: string;
  desc: string;
  image: string;
  modelUrl?: string;
  is3D?: boolean;
  gallery: Artwork[];
}

const getUI = (lang: Language) => {
  if (lang === "ar") {
    return {
      catalogue: "الكتالوج",
      part: "قسم",
      browse: "تصفّح",
      curatedNote:
        "كل قطعة في مجموعتنا مُختارة بعناية لتلبي أعلى معايير التعبير الفني.",
      inquire: "استفسر عن التوفّر",
      close: "إغلاق",
      view3d: "عرض ثلاثي الأبعاد",
      viewerTitle: "عرض ثلاثي الأبعاد",
      viewerHint: "حرّك للتدوير والتقريب",
      rotate: "تدوير",
      zoom: "تقريب",

      // Inquiry form
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      message: "رسالتك",
      send: "إرسال الاستفسار",
      back: "العودة للمعرض",
      success: "شكراً لاهتمامكم.",
      // optional / reused
      inquiryTitle: "استفسار",
    };
  }
  return {
    catalogue: "Catalogue",
    part: "Part",
    browse: "Browse",
    curatedNote:
      "Every piece in our collection is meticulously curated to meet the highest standards of artistic expression.",
    inquire: "Inquire for availability",
    close: "Close",
    view3d: "3D View",
    viewerTitle: "3D View",
    viewerHint: "Interact to rotate & zoom",
    rotate: "Rotate",
    zoom: "Zoom",

    // Inquiry form
    name: "Full Name",
    email: "Email Address",
    message: "Your Message",
    send: "Send Inquiry",
    back: "Back to Gallery",
    success: "Thank you for your interest.",
    // optional / reused
    inquiryTitle: "Inquiry",
  };
};

// Galleries (Arabic titles/descriptions where needed)
const paintingsGallery = (lang: Language): Artwork[] => [
  {
    id: "paint-1",
    title: lang === "ar" ? "تدفّق قرمزي" : "Crimson Flow",
    description: lang === "ar" ? "استكشاف للملمس والحركة." : "Exploration of texture and movement.",
    image: "https://images.unsplash.com/photo-1544208849-0d321526487e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "paint-2",
    title: lang === "ar" ? "طبقات صامتة" : "Silent Layers",
    description: lang === "ar" ? "درجات هادئة وعمق بصري." : "Muted tones and spatial depth.",
    image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "paint-3",
    title: lang === "ar" ? "أفق محترق" : "Burnt Horizon",
    description: lang === "ar" ? "دراسة لمنظر مجرّد." : "Abstract landscape study.",
    image: "https://images.unsplash.com/photo-1459411552884-841f9b3924a0?q=80&w=800&auto=format&fit=crop",
  },
];

const sculpturesGallery = (lang: Language): Artwork[] => [
  {
    id: "sculpt-1",
    title: lang === "ar" ? "هيئة مُجزّأة" : "Fragmented Form",
    description: lang === "ar" ? "ظلّ إنساني مُفكّك." : "Deconstructed human silhouette.",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sculpt-2",
    title: lang === "ar" ? "حضور الفراغ" : "Void Presence",
    description: lang === "ar" ? "تفاعل الكتلة والفراغ." : "Mass and emptiness interplay.",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
  },
];

const chandeliersGallery = (lang: Language): Artwork[] => [
  {
    id: "chan-1",
    title: lang === "ar" ? "ضوء سديمي" : "Nebula Light",
    description: lang === "ar" ? "إضاءة معلّقة بطابع فضائي." : "Suspended spatial lighting.",
    image: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "chan-2",
    title: lang === "ar" ? "تدفّق بلّوري" : "Crystal Flux",
    description: lang === "ar" ? "ضوء ينكسر عبر الشكل." : "Light refracted through form.",
    image: "https://images.unsplash.com/photo-1605218427368-35b0185e49f7?q=80&w=800&auto=format&fit=crop",
  },
];

const installationsGallery = (lang: Language): Artwork[] => [
  {
    id: "inst-1",
    title: lang === "ar" ? "نواة غامرة" : "Immersive Core",
    description: lang === "ar" ? "بيئة فنية معمارية." : "Architectural art environment.",
    image: "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "inst-2",
    title: lang === "ar" ? "نفق الإدراك" : "Perception Tunnel",
    description: lang === "ar" ? "مساحة فنية قابلة للمشي." : "Walkable art space.",
    image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop",
  },
];

const bespokeGallery = (lang: Language): Artwork[] => [
  {
    id: "bespoke-1",
    title: lang === "ar" ? "تكليف خاص I" : "Private Commission I",
    description: lang === "ar" ? "مصمّم خصيصاً لفيلا خاصة." : "Custom-made for a private villa.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "bespoke-2",
    title: lang === "ar" ? "قطعة توقيعية" : "Signature Piece",
    description: lang === "ar" ? "عمل فريد من نوعه." : "One-of-a-kind artwork.",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop",
  },
];

const buildCatalogue = (lang: Language): ServiceCategory[] => [
  {
    id: "01",
    title: lang === "ar" ? "لوحات" : "Paintings",
    desc: lang === "ar" ? "قماشٌ أثيري" : "Ethereal Canvas",
    image: "https://images.unsplash.com/photo-1544208849-0d321526487e?q=80&w=2600&auto=format&fit=crop",
    gallery: paintingsGallery(lang),
  },
  {
    id: "02",
    title: lang === "ar" ? "منحوتات" : "Sculptures",
    desc: lang === "ar" ? "شكلٌ وفراغ" : "Form & Void",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2600&auto=format&fit=crop",
    modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    // IMPORTANT: your original code had is3D: false, keep it as-is.
    // If you want the button to appear, set is3D: true.
    is3D: false,
    gallery: sculpturesGallery(lang),
  },
  {
    id: "03",
    title: lang === "ar" ? "ثريات" : "Chandeliers",
    desc: lang === "ar" ? "وهجٌ مكاني" : "Spatial Glow",
    image: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=2600&auto=format&fit=crop",
    gallery: chandeliersGallery(lang),
  },
  {
    id: "04",
    title: lang === "ar" ? "تركيبات" : "Installations",
    desc: lang === "ar" ? "فضاءٌ غامر" : "Immersive Space",
    image: "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?q=80&w=2600&auto=format&fit=crop",
    gallery: installationsGallery(lang),
  },
  {
    id: "05",
    title: lang === "ar" ? "حسب الطلب" : "Bespoke",
    desc: lang === "ar" ? "تكليف خاص" : "Commissioned",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800&auto=format&fit=crop&q=80&w=800",
    gallery: bespokeGallery(lang),
  },
];

interface ServicesProps {
  lang: Language;
}

const Services: React.FC<ServicesProps> = ({ lang }) => {
  const t = getUI(lang);
  const catalogueItems = buildCatalogue(lang);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [active3DModel, setActive3DModel] = useState<string | null>(null);
  const [isInquiring, setIsInquiring] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Form states (inquiry)
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiConfirmation, setAiConfirmation] = useState("");

  // Mobile scroll tracking
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setHoveredIndex(index);
          }
        });
      },
      { root: null, threshold: 0.6 }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (activeCategory || active3DModel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // reset inquiry state when closing modal(s)
      setIsInquiring(false);
      setSubmitStatus("idle");
      setFormData({ name: "", email: "", message: "" });
      setAiConfirmation("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeCategory, active3DModel]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await processLeadInquiry(lang, {
        ...formData,
        interest: activeCategory?.title || "",
      });

      setAiConfirmation(response);
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="services"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative w-full min-h-screen bg-stone-50 overflow-hidden flex items-center py-24 md:py-20"
    >
      {/* Dynamic Background Images */}
      <div className="absolute inset-0 z-0">
        {catalogueItems.map((item, index) => (
          <div
            key={item.id}
            className={[
              "absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out",
              hoveredIndex === index ? "opacity-100 scale-105 grayscale-0" : "opacity-0 scale-100 grayscale",
            ].join(" ")}
            style={{ backgroundImage: `url('${item.image}')` }}
          />
        ))}
        <div
          className={[
            "absolute inset-0 bg-white/40 md:bg-white/30 backdrop-blur-[4px] md:backdrop-blur-[2px] transition-opacity duration-700",
            hoveredIndex !== null ? "opacity-60" : "opacity-100",
          ].join(" ")}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-sky-50 to-white transition-opacity duration-700 -z-10" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col justify-center h-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="hidden md:block md:col-span-4">
            <div className="relative h-64 w-full overflow-hidden">
              {catalogueItems.map((item, index) => (
                <span
                  key={index}
                  className={[
                    "absolute top-0",
                    lang === "ar" ? "right-0" : "left-0",
                    "text-[15vw] font-serif italic text-stone-900/10 leading-none transition-all duration-700 transform",
                    hoveredIndex === index ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                  ].join(" ")}
                >
                  {item.id}
                </span>
              ))}
              {hoveredIndex === null && (
                <span
                  className={[
                    "absolute top-0",
                    lang === "ar" ? "right-0" : "left-0",
                    "text-[15vw] font-serif italic text-stone-900/5 leading-none",
                  ].join(" ")}
                >
                  00
                </span>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-8 flex flex-col items-center md:items-end">
            <h3
              className={[
                "text-stone-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-12 md:mb-16",
                lang === "ar" ? "md:ml-1" : "md:mr-1",
              ].join(" ")}
            >
              {t.catalogue}
            </h3>

            <div className="w-full flex flex-col items-center md:items-end space-y-12 md:space-y-6">
              {catalogueItems.map((item, index) => (
                <div
                  key={item.id}
                  data-index={index}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className="group relative cursor-pointer w-full text-center md:text-right"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setActiveCategory(item)}
                >
                  <span className="md:hidden block text-[8px] font-bold tracking-[0.3em] text-stone-400 mb-2 uppercase">
                    {t.part} {item.id}
                  </span>

                  <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-3 md:gap-6">
                    <div
                      className={[
                        "flex items-center gap-2 text-stone-800 transition-all duration-500 order-2 md:order-1",
                        hoveredIndex === index
                          ? "opacity-100 translate-x-0"
                          : "opacity-100 md:opacity-0 translate-x-0 md:translate-x-4",
                      ].join(" ")}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">
                        {t.browse}
                      </span>
                      <div className="w-10 h-10 md:w-8 md:h-8 rounded-full border border-stone-800 flex items-center justify-center bg-white/80 backdrop-blur-md shadow-sm group-active:scale-95 transition-transform">
                        <ArrowUpRight size={16} className="md:w-3.5 md:h-3.5" />
                      </div>
                    </div>

                    <h2
                      className={[
                        "font-sans font-black text-4xl sm:text-5xl md:text-7xl uppercase tracking-tighter transition-all duration-500 order-1 md:order-2",
                        hoveredIndex === index ? "text-stone-900 translate-x-0" : "text-stone-300 md:translate-x-4",
                      ].join(" ")}
                    >
                      {item.title}
                    </h2>
                  </div>

                  <div
                    className={[
                      "mt-2 md:mt-0 md:absolute md:top-1/2 md:-translate-y-1/2 transition-all duration-500",
                      lang === "ar" ? "md:left-full md:ml-32" : "md:right-full md:mr-32",
                      hoveredIndex === index ? "opacity-100 translate-y-0" : "opacity-0 md:translate-x-12 translate-y-4",
                    ].join(" ")}
                  >
                    <p className="font-serif italic text-stone-900 text-lg md:text-xl whitespace-nowrap">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive3DModel(activeCategory.modelUrl || null);
                    }}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                    {activeCategory.gallery.map((art, i) => (
                      <div key={art.id} style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4 cursor-pointer">
                          <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                         
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="font-serif text-lg text-stone-900 leading-tight">{art.title}</h4>
                          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400">
                            {art.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Category Footer */}
                  <div className="mt-20 border-t border-stone-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="font-serif italic text-stone-500 max-w-sm text-center md:text-left">
                      {t.curatedNote}
                    </p>
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
                    onClick={() => {
                      setIsInquiring(false);
                      setSubmitStatus("idle");
                    }}
                    className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[10px] font-bold uppercase tracking-widest mb-12"
                  >
                    <ArrowLeft size={14} className="rtl:rotate-180" /> {t.back}
                  </button>

                  {submitStatus === "success" ? (
                    <div className="text-center py-20 animate-fade-in-up">
                      <div className="flex justify-center mb-6 text-sky-400">
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-stone-900 mb-4">
                        {t.success}
                      </h3>
                      <div className="bg-stone-50 p-8 border border-stone-100 italic font-serif text-stone-600 leading-relaxed">
                        "{aiConfirmation}"
                      </div>
                    </div>
                  ) : (
                    <form className="space-y-10" onSubmit={handleInquirySubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="relative">
                          <label
                            className={[
                              "absolute",
                              lang === "ar" ? "right-0" : "left-0",
                              "transition-all duration-300 text-[10px] uppercase tracking-widest",
                              formData.name ? "-top-6 text-stone-400" : "top-2 text-stone-300",
                            ].join(" ")}
                          >
                            {t.name}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors text-stone-900"
                          />
                        </div>

                        <div className="relative">
                          <label
                            className={[
                              "absolute",
                              lang === "ar" ? "right-0" : "left-0",
                              "transition-all duration-300 text-[10px] uppercase tracking-widest",
                              formData.email ? "-top-6 text-stone-400" : "top-2 text-stone-300",
                            ].join(" ")}
                          >
                            {t.email}
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors text-stone-900"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label
                          className={[
                            "absolute",
                            lang === "ar" ? "right-0" : "left-0",
                            "transition-all duration-300 text-[10px] uppercase tracking-widest",
                            formData.message ? "-top-6 text-stone-400" : "top-2 text-stone-300",
                          ].join(" ")}
                        >
                          {t.message}
                        </label>
                        <textarea
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full bg-transparent border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors text-stone-900 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Send size={14} className="rtl:rotate-180" /> {t.send}
                          </>
                        )}
                      </button>

                      {submitStatus === "error" && (
                        <p className="text-[10px] uppercase tracking-widest text-red-500 text-center">
                          {lang === "ar" ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Please try again."}
                        </p>
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
              <h3 className="font-sans font-black text-xl md:text-2xl uppercase tracking-tighter text-stone-900 leading-none">
                {t.viewerTitle}
              </h3>
              <p className="font-serif italic text-stone-500 text-xs md:text-base">{t.viewerHint}</p>
            </div>

            <div className="w-full h-full pt-16">
              <model-viewer
                src={active3DModel}
                shadow-intensity="1"
                camera-controls
                auto-rotate
                touch-action="pan-y"
                style={{ width: "100%", height: "100%", backgroundColor: "transparent" } as React.CSSProperties}
              />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 text-[9px] md:text-xs font-bold uppercase tracking-widest text-stone-400 pointer-events-none bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="flex items-center gap-1">
                <Rotate3d size={14} /> {t.rotate}
              </span>
              <span className="flex items-center gap-1">
                <Move3d size={14} /> {t.zoom}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
