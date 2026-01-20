import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Clock,
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

interface ArtistWork {
  id: string;
  artistName: string;
  artworkTitle: string;
  collection: string;
  leadTime: string;
  location: string;

  // ✅ keep compatibility
  imageUrl: string;

  // ✅ NEW: up to 4 images for the modal gallery
  images?: string[];

  description: string;
  dimensions: string;
}

const artistsData: ArtistWork[] = [
  {
    id: "1",
    artistName: "Véronique Locci",
    artworkTitle: "Celestial Mirror",
    collection: "Reflections of Light",
    leadTime: "8-10 Weeks",
    location: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7cbb9?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618219740975-d40978bb7378?q=80&w=2000&auto=format&fit=crop",
    ],
    description:
      "Hand-blown concave glass with engraved wooden supports. Each piece creates a hypnotic play of reflections that shift with their surroundings.",
    dimensions: "120cm Diameter",
  },
  {
    id: "2",
    artistName: "Satoshi K.",
    artworkTitle: "Void Structure No. 4",
    collection: "Negative Space Series",
    leadTime: "6-8 Weeks",
    location: "Japan",
    imageUrl:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544208849-0d321526487e?q=80&w=2000&auto=format&fit=crop",
    ],
    description:
      "Matte black steel sculpture exploring the relationship between form and void. A striking minimalist statement for modern interiors.",
    dimensions: "180cm x 60cm",
  },
  {
    id: "3",
    artistName: "Elena Vora",
    artworkTitle: "Ethereal Drift",
    collection: "Atmosphere",
    leadTime: "4-6 Weeks",
    location: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?q=80&w=2000&auto=format&fit=crop",
    ],
    description:
      "Large-scale oil on canvas layered with translucent glazes to create a sense of depth and atmospheric movement reminiscent of clouds.",
    dimensions: "200cm x 150cm",
  },
  {
    id: "4",
    artistName: "Marcus Thorne",
    artworkTitle: "Bronze Fragment",
    collection: "Ancient Future",
    leadTime: "12 Weeks",
    location: "UK",
    imageUrl:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2000&auto=format&fit=crop",
    ],
    description:
      "Cast bronze sculpture with a unique patina finish. Thorne blends classical techniques with abstract, fragmented forms.",
    dimensions: "45cm x 30cm x 30cm",
  },
  {
    id: "5",
    artistName: "Lila K.",
    artworkTitle: "Woven Light",
    collection: "Fiber Arts",
    leadTime: "5-7 Weeks",
    location: "UAE",
    imageUrl:
      "https://images.unsplash.com/photo-1631557999863-718554972e7a?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1631557999863-718554972e7a?q=80&w=2000&auto=format&fit=crop",
    ],
    description:
      "Intricate textile installation using metallic threads that catch the light, created by local Dubai-based artist Lila K.",
    dimensions: "Custom Installation",
  },
  {
    id: "6",
    artistName: "Adrian Mole",
    artworkTitle: "Kinetic Cube",
    collection: "Motion",
    leadTime: "10-12 Weeks",
    location: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2000&auto=format&fit=crop",
    ],
    description:
      "A suspended geometric sculpture that slowly rotates with air currents, casting dynamic shadows across the space.",
    dimensions: "80cm x 80cm",
  },
];

const FeaturedArtist: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeArtwork, setActiveArtwork] = useState<ArtistWork | null>(null);

  // ✅ gallery index
  const [galleryIndex, setGalleryIndex] = useState(0);

  // ✅ Inquiry Form States (integrated; nothing else changed)
  const [isInquiring, setIsInquiring] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [aiConfirmation, setAiConfirmation] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);

  // ✅ reset inquiry states when modal closes / artwork changes
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
    // when opening a new artwork, reset inquiry & gallery
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
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";

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
        interest: `Artwork: ${activeArtwork.artworkTitle} by ${activeArtwork.artistName}`,
        message: formData.message,
      };

      // API Simulation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const confirmation = await processLeadInquiry(leadData);
      setAiConfirmation(confirmation);
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ lock body scroll when modal open
  useEffect(() => {
    if (!activeArtwork) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeArtwork]);

  // ✅ scroll perf handler
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

  // ✅ gallery images (up to 4)
  const galleryImages = useMemo(() => {
    if (!activeArtwork) return [];
    const list = (activeArtwork.images?.length
      ? activeArtwork.images
      : [activeArtwork.imageUrl]
    ).filter(Boolean);
    return list.slice(0, 4);
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

  // ✅ keyboard support when modal open
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
      className="py-32 bg-white relative overflow-hidden min-h-screen"
    >
      {/* Fog Overlay */}
      <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-stone-50 to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          {/* Header */}
          <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-100 pb-8">
            <h2 className="font-sans font-black text-6xl md:text-8xl uppercase tracking-tighter text-stone-900 leading-none text-left">
              Curated <br />
              <span className="text-stone-300">Artists</span>
            </h2>

            <div className="text-left md:text-right mt-8 md:mt-0">
              <p className="font-serif italic text-2xl text-stone-500">
                Selected Works
              </p>
              <p className="text-xs uppercase tracking-widest text-stone-400 mt-2">
                Sculpture / Canvas / Installation
              </p>
            </div>
          </div>
        </div>

        {/* Artist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {artistsData.map((artist, index) => (
            <div
              key={artist.id}
              className={`group relative cursor-pointer ${
                index % 2 === 0 ? "md:mt-0" : "md:mt-12"
              } transition-all duration-700`}
              onClick={() => setActiveArtwork(artist)}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-sm relative shadow-md group-hover:shadow-2xl transition-shadow duration-500">
                <img
                  src={artist.imageUrl}
                  alt={artist.artworkTitle}
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

                {/* Neutral gray veil */}
                <div
                  className="
                    absolute inset-0
                    bg-stone-200/30
                    opacity-100
                    group-hover:opacity-0
                    transition-opacity duration-500
                  "
                />

                {/* Subtle depth */}
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

                {/* Floating Badge */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-3 border border-white/50 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-900">
                    {artist.artistName}
                  </p>
                </div>
              </div>

              <div className="mt-6 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="font-serif italic text-2xl text-stone-900">
                  {artist.artworkTitle}
                </h3>
                <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">
                  {artist.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Artwork Modal with Gallery */}
      {activeArtwork && (
        <div className="fixed inset-0 z-[100] bg-stone-100/95 backdrop-blur-xl animate-fade-in-up">
          <div
            className="absolute inset-0 cursor-zoom-out"
            onClick={() => setActiveArtwork(null)}
          />

          {/* ✅ Mobile fix: modal scrolls as a whole; desktop stays centered */}
          <div className="relative z-[101] h-[100dvh] w-full overflow-y-auto md:flex md:items-center md:justify-center md:p-8">
            <div className="relative w-full max-w-6xl bg-white shadow-2xl md:rounded-sm overflow-hidden flex flex-col md:flex-row md:max-h-[90vh] pointer-events-auto">
              {/* Close Button */}
              <button
                onClick={() => setActiveArtwork(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-30 p-2 bg-white/50 hover:bg-stone-900 hover:text-white rounded-full transition-all duration-300"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              {/* ✅ Gallery Section */}
              <div className="w-full md:w-1/2 bg-stone-100 relative overflow-hidden flex flex-col shrink-0">
                {/* ✅ cap gallery height on mobile so details is visible under it */}
                <div className="relative w-full h-[24vh] md:h-auto md:flex-1 overflow-hidden">
                  <img
                    src={galleryImages[galleryIndex] || activeArtwork.imageUrl}
                    alt={`${activeArtwork.artworkTitle} image ${galleryIndex + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation arrows */}
                  {canNav && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center shadow transition"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center shadow transition"
                        aria-label="Next image"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  {canNav && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-white/70 text-[10px] font-bold uppercase tracking-widest text-stone-700">
                      {galleryIndex + 1} / {galleryImages.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails (up to 4) */}
                {galleryImages.length > 1 && (
                  <div className="p-4 bg-white/70 backdrop-blur-md border-t border-stone-200">
                    <div className="grid grid-cols-4 gap-3">
                      {galleryImages.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          onClick={() => setGalleryIndex(i)}
                          className={`relative aspect-square overflow-hidden rounded-sm border transition ${
                            i === galleryIndex
                              ? "border-stone-900 shadow"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                          aria-label={`Select image ${i + 1}`}
                        >
                          <img
                            src={src}
                            alt={`${activeArtwork.artworkTitle} thumbnail ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Details Section (mobile: no overflow-y; desktop: keeps internal scroll) */}
              <div className="w-full md:w-1/2 p-8 md:p-16 md:overflow-y-auto flex flex-col justify-start md:justify-center bg-white/80 backdrop-blur-3xl">
                {!isInquiring ? (
                  <>
                    <div className="mb-2">
                      <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                        Artist
                      </span>
                      <h2 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 mt-2">
                        {activeArtwork.artistName}
                      </h2>
                    </div>

                    <div className="h-[1px] w-12 bg-stone-200 my-8" />

                    <div className="space-y-8">
                      <div>
                        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                          Artwork
                        </span>
                        <h3 className="font-serif italic text-3xl text-stone-800 mt-1">
                          {activeArtwork.artworkTitle}
                        </h3>
                      </div>

                      <div>
                        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                          Collection
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Layers size={16} className="text-stone-400" />
                          <p className="font-sans text-sm font-medium text-stone-600">
                            {activeArtwork.collection}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                            Lead Time
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={16} className="text-stone-400" />
                            <p className="font-sans text-sm font-medium text-stone-600">
                              {activeArtwork.leadTime}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                            Dimensions
                          </span>
                          <p className="font-sans text-sm font-medium text-stone-600 mt-1">
                            {activeArtwork.dimensions}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2">
                          About the Piece
                        </span>
                        <p className="font-serif text-lg leading-relaxed text-stone-600">
                          {activeArtwork.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-12">
                      <button
                        onClick={() => setIsInquiring(true)}
                        className="px-8 py-4 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-stone-700 transition-colors w-full md:w-auto flex items-center justify-center gap-3"
                      >
                        Inquire About Availability
                        <ArrowRight size={16} />
                      </button>
                    </div>

                    {/* (kept) scrollOffset is unused, but leaving your state intact */}
                    <div className="hidden">{scrollOffset}</div>
                  </>
                ) : (
                  <div className="animate-fade-in-up flex flex-col h-full">
                    <button
                      onClick={() => setIsInquiring(false)}
                      className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[9px] font-bold uppercase tracking-widest mb-10"
                    >
                      <ArrowLeft size={14} /> Back to details
                    </button>

                    {submitStatus === "success" ? (
                      <div className="flex-1 flex flex-col justify-center text-center py-10">
                        <div className="flex justify-center mb-6">
                          <CheckCircle2 size={48} className="text-sky-400" />
                        </div>
                        <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-stone-900 mb-6">
                          Request Sent
                        </h3>
                        <div className="bg-stone-50 p-6 border border-stone-100 mb-8 italic font-serif text-stone-600 leading-relaxed">
                          "{aiConfirmation}"
                        </div>
                        <button
                          onClick={() => setActiveArtwork(null)}
                          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                        >
                          Close Gallery
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-10">
                          <h3 className="font-sans font-black text-2xl uppercase tracking-tighter text-stone-900 mb-1">
                            Formal Inquiry
                          </h3>
                          <p className="font-serif italic text-stone-500">
                            Subject: {activeArtwork.artworkTitle} —{" "}
                            {activeArtwork.artistName}
                          </p>
                        </div>

                        <form className="space-y-8" onSubmit={handleInquirySubmit}>
                          <div className="grid grid-cols-1 gap-8">
                            <div className="relative">
                              <label
                                className={`absolute left-0 transition-all duration-300 text-[9px] uppercase tracking-widest ${
                                  activeField === "name" || formData.name
                                    ? "-top-6 text-sky-500"
                                    : "top-2 text-stone-400"
                                }`}
                              >
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                  handleInputChange("name", e.target.value)
                                }
                                onFocus={() => setActiveField("name")}
                                onBlur={() => setActiveField(null)}
                                className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent ${
                                  errors.name
                                    ? "border-red-400"
                                    : "border-stone-200 focus:border-stone-900"
                                }`}
                              />
                              {errors.name && (
                                <span className="absolute left-0 -bottom-4 text-[8px] text-red-400 uppercase tracking-widest">
                                  {errors.name}
                                </span>
                              )}
                            </div>

                            <div className="relative">
                              <label
                                className={`absolute left-0 transition-all duration-300 text-[9px] uppercase tracking-widest ${
                                  activeField === "email" || formData.email
                                    ? "-top-6 text-sky-500"
                                    : "top-2 text-stone-400"
                                }`}
                              >
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  handleInputChange("email", e.target.value)
                                }
                                onFocus={() => setActiveField("email")}
                                onBlur={() => setActiveField(null)}
                                className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent ${
                                  errors.email
                                    ? "border-red-400"
                                    : "border-stone-200 focus:border-stone-900"
                                }`}
                              />
                              {errors.email && (
                                <span className="absolute left-0 -bottom-4 text-[8px] text-red-400 uppercase tracking-widest">
                                  {errors.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="relative">
                            <label
                              className={`absolute left-0 transition-all duration-300 text-[9px] uppercase tracking-widest ${
                                activeField === "message" || formData.message
                                  ? "-top-6 text-sky-500"
                                  : "top-2 text-stone-400"
                              }`}
                            >
                              Message / Request Details
                            </label>
                            <textarea
                              rows={4}
                              value={formData.message}
                              onChange={(e) =>
                                handleInputChange("message", e.target.value)
                              }
                              onFocus={() => setActiveField("message")}
                              onBlur={() => setActiveField(null)}
                              className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent resize-none ${
                                errors.message
                                  ? "border-red-400"
                                  : "border-stone-200 focus:border-stone-900"
                              }`}
                            />
                            {errors.message && (
                              <span className="absolute left-0 -bottom-4 text-[8px] text-red-400 uppercase tracking-widest">
                                {errors.message}
                              </span>
                            )}
                          </div>

                          {submitStatus === "error" && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-50 p-3 text-[9px] font-bold uppercase tracking-widest">
                              <AlertCircle size={14} /> Something went wrong.
                            </div>
                          )}

                          <div className="pt-4">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full py-5 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <>
                                  <Send size={14} /> Send Formal Inquiry
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        <div className="mt-auto pt-10 text-[8px] font-bold uppercase tracking-widest text-stone-400 text-center">
                          Inquiry processed via Studio Austinn Art Concierge
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
