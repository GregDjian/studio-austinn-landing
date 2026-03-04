import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { processLeadInquiry } from "../services/geminiService";
import { Language } from "../types";
import { getArtists } from "../lib/sanityQueries";
import { urlFor } from "../lib/sanityImage";

interface ArtistWork {
  id: string;
  artistName: string;
  collection: string;
  technique: string;
  location: string;
  imageUrl: string;
  images?: string[];
  description: string;
  dimensions: string;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      headerTitleTop: "فنانون",
      headerTitleBottom: "مختارون",
      headerSub1: "أعمال مختارة",
      headerSub2: "منحوتات / لوحات / تركيبات",
      badgeArtist: "الفنان",
      labelArtist: "الفنان",
      labelArtwork: "العمل الفني",
      labelCollection: "المجموعة",
      labeltechnique: "تقنية",
      labelDimensions: "الأبعاد",
      labelAbout: "عن الفنان",
      inquireCta: "الاستفسار عن التوفر",
      backToDetails: "العودة إلى التفاصيل",
      inquiryTitle: "استفسار رسمي",
      subjectPrefix: "الموضوع:",
      formName: "الاسم الكامل",
      formEmail: "البريد الإلكتروني",
      formMessage: "الرسالة / تفاصيل الطلب",
      sendInquiry: "إرسال استفسار رسمي",
      sending: "جارٍ الإرسال",
      requestSent: "تم إرسال الطلب",
      closeGallery: "إغلاق المعرض",
      footerNote: "تمت معالجة الاستفسار عبر Art Concierge من Studio Austinn",
      errors: {
        nameRequired: "الاسم مطلوب",
        emailRequired: "البريد الإلكتروني مطلوب",
        emailInvalid: "بريد إلكتروني غير صحيح",
        messageRequired: "الرسالة مطلوبة",
        generic: "حدث خطأ ما.",
      },
    };
  }

  return {
    headerTitleTop: "Curated",
    headerTitleBottom: "Artists",
    headerSub1: "Selected Works",
    headerSub2: "Sculpture / Canvas / Installation",
    badgeArtist: "Artist",
    labelArtist: "Artist",
    labelArtwork: "Artwork",
    labelCollection: "Collection",
    labeltechnique: "Technique",
    labelDimensions: "Dimensions",
    labelAbout: "About the Artist",
    inquireCta: "Inquire About Availability",
    backToDetails: "Back to details",
    inquiryTitle: "Formal Inquiry",
    subjectPrefix: "Subject:",
    formName: "Full Name",
    formEmail: "Email Address",
    formMessage: "Message / Request Details",
    sendInquiry: "Send Formal Inquiry",
    sending: "Sending",
    requestSent: "Request Sent",
    closeGallery: "Close Gallery",
    footerNote: "Inquiry processed via Studio Austinn Art Concierge",
    errors: {
      nameRequired: "Name is required",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email address",
      messageRequired: "Message is required",
      generic: "Something went wrong.",
    },
  };
};

const FeaturedArtist: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = getContent(lang);

  const sectionRef = useRef<HTMLElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeArtwork, setActiveArtwork] = useState<ArtistWork | null>(null);

  const [galleryIndex, setGalleryIndex] = useState(0);

  const [isInquiring, setIsInquiring] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiConfirmation, setAiConfirmation] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);

  // ✅ MOVED INSIDE COMPONENT
  const [artistsData, setArtistsData] = useState<ArtistWork[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ MOVED INSIDE COMPONENT
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await getArtists();

        const mapped: ArtistWork[] = (data || []).map((a: any) => {
          const cover = a.coverImage ? urlFor(a.coverImage).width(1200).url() : "";

          const galleryUrls: string[] = (a.galleryImages ?? [])
            .map((img: any) => (img?.asset ? urlFor(img).width(1600).url() : ""))
            .filter(Boolean)
            .slice(0, 3); // ✅ max 3 gallery images

          // ✅ store gallery separately (WITHOUT cover) in `images`
          return {
            id: a._id,
            artistName: a.name ?? "",
            collection: a.collection ?? "",
            technique: a.technique ?? "On Request",
            location: a.location ?? "",
            imageUrl: cover,
            images: galleryUrls,
            description: a.about ?? "",
            dimensions: a.dimensions ?? "",
          };
        });


        if (!alive) return;
        setArtistsData(mapped);
      } catch (e) {
        if (!alive) return;
        setArtistsData([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeArtwork) {
      setIsInquiring(false);
      setSubmitStatus("idle");
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
      setAiConfirmation("");
      setActiveField(null);
      return;
    }
    setIsInquiring(false);
    setSubmitStatus("idle");
    setFormData({ name: "", email: "", message: "" });
    setErrors({});
    setAiConfirmation("");
    setActiveField(null);
    setGalleryIndex(0);
  }, [activeArtwork?.id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t.errors.nameRequired;
    if (!formData.email.trim()) {
      newErrors.email = t.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.errors.emailInvalid;
    }
    if (!formData.message.trim()) newErrors.message = t.errors.messageRequired;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !activeArtwork) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const leadData = {
        name: formData.name,
        email: formData.email,
        interest: `Collection: ${activeArtwork.collection} by ${activeArtwork.artistName}`,
        message: formData.message,
      };

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const confirmation = await processLeadInquiry(lang, leadData);
      setAiConfirmation(confirmation);
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!activeArtwork) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeArtwork]);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollOffset(rect.top);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = useMemo(() => {
    if (!activeArtwork) return [];

    const cover = activeArtwork.imageUrl ? [activeArtwork.imageUrl] : [];
    const gallery = (activeArtwork.images ?? []).filter(Boolean).slice(0, 3);

    // ✅ cover first + max 3 gallery = max 4 total
    // ✅ also remove duplicates (sometimes cover is also in gallery)
    const unique = Array.from(new Set([...cover, ...gallery]));

    return unique;
  }, [activeArtwork]);

  const canNav = galleryImages.length > 1;

  const prevImage = () => {
    if (!canNav) return;
    setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  };

  const nextImage = () => {
    if (!canNav) return;
    setGalleryIndex((i) => (i + 1) % galleryImages.length);
  };

  useEffect(() => {
    if (!activeArtwork) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveArtwork(null);
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArtwork, galleryImages.length]);

  return (
    <section
      id="artists"
      ref={sectionRef}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="py-32 bg-white relative overflow-hidden min-h-screen"
    >
      <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-stone-50 to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-100 pb-8">
          <h2
            className={[
              "font-sans font-black text-6xl md:text-6xl uppercase tracking-tighter text-stone-900 leading-none",
              lang === "ar" ? "text-right" : "text-left",
            ].join(" ")}
          >
            {t.headerTitleTop} <br />
            <span className="text-stone-300">{t.headerTitleBottom}</span>
          </h2>

          <div className={["mt-8 md:mt-0", lang === "ar" ? "text-right" : "text-left md:text-right"].join(" ")}>
            <p className="font-serif italic text-2xl text-stone-500">{t.headerSub1}</p>
            <p className="text-xs uppercase tracking-widest text-stone-400 mt-2">{t.headerSub2}</p>
          </div>
        </div>

        {/* Optional loader (keeps layout clean) */}
        {loading ? (
          <div className="py-20 flex items-center justify-center text-stone-400 text-xs uppercase tracking-widest">
            <Loader2 className="animate-spin mr-3" size={16} />
            Loading artists...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {artistsData.map((artist, index) => (
              <div
                key={artist.id}
                className={`group relative cursor-pointer ${
                  index % 2 === 0 ? "md:mt-0" : "md:mt-12"
                } transition-all duration-700`}
                onClick={() => setActiveArtwork(artist)}
              >
                <div className="aspect-[3/4] rounded-[8px] overflow-hidden rounded-sm relative shadow-md group-hover:shadow-2xl transition-shadow duration-500">
                  <img
                    src={artist.imageUrl}
                    alt={artist.collection}
                    className="
                      w-full h-full object-cover
                      will-change-transform
                      transition-all duration-[1.3s] ease-out
                      scale-[1.05]
                      saturate-80 contrast-90 brightness-92
                      group-hover:scale-110
                      group-hover:saturate-115
                      group-hover:contrast-105
                      group-hover:brightness-105
                    "
                  />

                  <div
                    className="
                      absolute inset-0
                      bg-stone-200/30
                      opacity-100
                      group-hover:opacity-0
                      transition-opacity duration-500
                    "
                  />

                  <div
                    className="
                      absolute inset-0
                      bg-gradient-to-b
                      from-black/0 via-black/0 to-black/10
                      opacity-70
                      group-hover:opacity-40
                      transition-opacity duration-500
                    "
                  />

                  <div
                    className={[
                      "absolute bottom-6 bg-white/90 backdrop-blur-md px-4 py-3 border border-white/50 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100",
                      lang === "ar" ? "right-6" : "left-6",
                    ].join(" ")}
                  >
                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-900">
                      {artist.artistName}
                    </p>
                  </div>
                </div>

                <div className="mt-6 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <h3 className="font-serif italic text-2xl text-stone-900">{artist.collection}</h3>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">{artist.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {activeArtwork && (
        <div className="fixed inset-0 z-[100] bg-stone-100/95 backdrop-blur-xl animate-fade-in-up">
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setActiveArtwork(null)} />

          <div className="relative z-[101] h-[100dvh] w-full overflow-y-auto md:flex md:items-center md:justify-center md:p-8">
            <div className="relative w-full max-w-6xl bg-white shadow-2xl md:rounded-sm overflow-hidden flex flex-col md:flex-row md:max-h-[90vh] pointer-events-auto">
              {/* Close */}
              <button
                onClick={() => setActiveArtwork(null)}
                className={[
                  "absolute top-4 md:top-6 z-30 p-2 bg-white/50 hover:bg-stone-900 hover:text-white rounded-full transition-all duration-300",
                  lang === "ar" ? "left-4 md:left-6" : "right-4 md:right-6",
                ].join(" ")}
                aria-label="Close"
              >
                <X size={24} />
              </button>

              {/* Gallery */}
              <div className="w-full md:w-1/2 bg-stone-100 relative overflow-hidden flex flex-col shrink-0">
                <div className="relative w-full h-[24vh] md:h-auto md:flex-1 overflow-hidden">
                  <img
                    src={galleryImages[galleryIndex] || activeArtwork.imageUrl}
                    alt={`${activeArtwork.collection} image ${galleryIndex + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {canNav && (
                    <>
                      <button
                        onClick={prevImage}
                        className={[
                          "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center shadow transition",
                          lang === "ar" ? "right-4" : "left-4",
                        ].join(" ")}
                        aria-label="Previous image"
                      >
                        {lang === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                      </button>

                      <button
                        onClick={nextImage}
                        className={[
                          "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center shadow transition",
                          lang === "ar" ? "left-4" : "right-4",
                        ].join(" ")}
                        aria-label="Next image"
                      >
                        {lang === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </>
                  )}

                  {canNav && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/70 text-[10px] font-bold uppercase tracking-widest text-stone-700">
                      {galleryIndex + 1} / {galleryImages.length}
                    </div>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <div className="p-4 bg-white/70 backdrop-blur-md border-t border-stone-200">
                    <div className="grid grid-cols-4 gap-3">
                      {galleryImages.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          onClick={() => setGalleryIndex(i)}
                          className={`relative aspect-square overflow-hidden rounded-sm border transition ${
                            i === galleryIndex ? "border-stone-900 shadow" : "border-stone-200 hover:border-stone-400"
                          }`}
                          aria-label={`Select image ${i + 1}`}
                        >
                          <img
                            src={src}
                            alt={`${activeArtwork.collection} thumbnail ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="w-full md:w-1/2 p-8 md:p-16 md:overflow-y-auto flex flex-col justify-start md:justify-center bg-white/80 backdrop-blur-3xl">
                {!isInquiring ? (
                  <>
                    <div className="mb-2">
                      <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                        {t.labelArtist}
                      </span>
                      <h2 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 mt-2">
                        {activeArtwork.artistName}
                      </h2>
                    </div>

                    <div className="h-[1px] w-12 bg-stone-200 my-2" />

                    <div className="space-y-4">
                      <div>
                        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                          {t.labelCollection}
                        </span>
                        <h3 className="font-serif italic text-3xl text-stone-800 mt-1">
                          {activeArtwork.collection}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                            {t.labeltechnique}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Layers size={16} className="text-stone-400" />
                            <p className="font-sans text-sm font-medium text-stone-600">
                              {activeArtwork.technique}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                            {t.labelDimensions}
                          </span>
                          <p className="font-sans text-sm font-medium text-stone-600 mt-1">
                            {activeArtwork.dimensions}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2">
                          {t.labelAbout}
                        </span>
                        <p className="text-stone-800 text-base md:text-lg leading-relaxed">{activeArtwork.description}</p>
                      </div>
                    </div>

                    <div className="mt-12">
                      <button
                        onClick={() => setIsInquiring(true)}
                        className="px-8 py-4 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-stone-700 transition-colors w-full md:w-auto flex items-center justify-center gap-3"
                      >
                        {t.inquireCta}
                        <ArrowRight size={16} className={lang === "ar" ? "rotate-180" : ""} />
                      </button>
                    </div>

                    <div className="hidden">{scrollOffset}</div>
                  </>
                ) : (
                  <div className="animate-fade-in-up flex flex-col h-full">
                    <button
                      onClick={() => setIsInquiring(false)}
                      className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[9px] font-bold uppercase tracking-widest mb-10"
                    >
                      {lang === "ar" ? (
                        <>
                          {t.backToDetails} <ArrowRight size={14} className="rotate-180" />
                        </>
                      ) : (
                        <>
                          <ArrowLeft size={14} /> {t.backToDetails}
                        </>
                      )}
                    </button>

                    {submitStatus === "success" ? (
                      <div className="flex-1 flex flex-col justify-center text-center py-10">
                        <div className="flex justify-center mb-6">
                          <CheckCircle2 size={48} className="text-sky-400" />
                        </div>
                        <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-stone-900 mb-6">
                          {t.requestSent}
                        </h3>
                        <div className="bg-stone-50 p-6 border border-stone-100 mb-8 italic font-serif text-stone-600 leading-relaxed">
                          "{aiConfirmation}"
                        </div>
                        <button
                          onClick={() => setActiveArtwork(null)}
                          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                        >
                          {t.closeGallery}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-10">
                          <h3 className="font-sans font-black text-2xl uppercase tracking-tighter text-stone-900 mb-1">
                            {t.inquiryTitle}
                          </h3>
                          <p className="font-serif italic text-stone-500">
                            {t.subjectPrefix} {activeArtwork.collection} — {activeArtwork.artistName}
                          </p>
                        </div>

                        <form className="space-y-8" onSubmit={handleInquirySubmit}>
                          <div className="grid grid-cols-1 gap-8">
                            <div className="relative">
                              <label
                                className={`absolute ${lang === "ar" ? "right-0" : "left-0"} transition-all duration-300 text-[9px] uppercase tracking-widest ${
                                  activeField === "name" || formData.name ? "-top-6 text-sky-500" : "top-2 text-stone-400"
                                }`}
                              >
                                {t.formName}
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                onFocus={() => setActiveField("name")}
                                onBlur={() => setActiveField(null)}
                                className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent ${
                                  errors.name ? "border-red-400" : "border-stone-200 focus:border-stone-900"
                                }`}
                              />
                              {errors.name && (
                                <span
                                  className={`absolute ${lang === "ar" ? "right-0" : "left-0"} -bottom-4 text-[8px] text-red-400 uppercase tracking-widest`}
                                >
                                  {errors.name}
                                </span>
                              )}
                            </div>

                            <div className="relative">
                              <label
                                className={`absolute ${lang === "ar" ? "right-0" : "left-0"} transition-all duration-300 text-[9px] uppercase tracking-widest ${
                                  activeField === "email" || formData.email ? "-top-6 text-sky-500" : "top-2 text-stone-400"
                                }`}
                              >
                                {t.formEmail}
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                onFocus={() => setActiveField("email")}
                                onBlur={() => setActiveField(null)}
                                className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent ${
                                  errors.email ? "border-red-400" : "border-stone-200 focus:border-stone-900"
                                }`}
                              />
                              {errors.email && (
                                <span
                                  className={`absolute ${lang === "ar" ? "right-0" : "left-0"} -bottom-4 text-[8px] text-red-400 uppercase tracking-widest`}
                                >
                                  {errors.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="relative">
                            <label
                              className={`absolute ${lang === "ar" ? "right-0" : "left-0"} transition-all duration-300 text-[9px] uppercase tracking-widest ${
                                activeField === "message" || formData.message ? "-top-6 text-sky-500" : "top-2 text-stone-400"
                              }`}
                            >
                              {t.formMessage}
                            </label>
                            <textarea
                              rows={4}
                              value={formData.message}
                              onChange={(e) => handleInputChange("message", e.target.value)}
                              onFocus={() => setActiveField("message")}
                              onBlur={() => setActiveField(null)}
                              className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent resize-none ${
                                errors.message ? "border-red-400" : "border-stone-200 focus:border-stone-900"
                              }`}
                            />
                            {errors.message && (
                              <span
                                className={`absolute ${lang === "ar" ? "right-0" : "left-0"} -bottom-4 text-[8px] text-red-400 uppercase tracking-widest`}
                              >
                                {errors.message}
                              </span>
                            )}
                          </div>

                          {submitStatus === "error" && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-50 p-3 text-[9px] font-bold uppercase tracking-widest">
                              <AlertCircle size={14} /> {t.errors.generic}
                            </div>
                          )}

                          <div className="pt-4">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full py-5 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  {t.sending}
                                </>
                              ) : (
                                <>
                                  <Send size={14} /> {t.sendInquiry}
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        <div className="mt-auto pt-10 text-[8px] font-bold uppercase tracking-widest text-stone-400 text-center">
                          {t.footerNote}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedArtist;
