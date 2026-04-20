import React, { useState } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Calendar,
  Ruler,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Language } from "../types";
import { Project } from "./SectorModal";
import { processLeadInquiry } from "../services/geminiService";

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
  lang: Language;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, lang }) => {
  const [activeImg, setActiveImg] = useState(0);

  // Inquiry state
  const [isInquiring, setIsInquiring] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiConfirmation, setAiConfirmation] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);

  const prev = () => setActiveImg((p) => (p - 1 + project.images.length) % project.images.length);
  const next = () => setActiveImg((p) => (p + 1) % project.images.length);

  const handleInput = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = lang === "ar" ? "الاسم مطلوب" : "Name is required";
    if (!formData.email.trim()) newErrors.email = lang === "ar" ? "البريد مطلوب" : "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = lang === "ar" ? "بريد غير صحيح" : "Invalid email";
    if (!formData.message.trim()) newErrors.message = lang === "ar" ? "الرسالة مطلوبة" : "Message is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const confirmation = await processLeadInquiry(lang, {
        name: formData.name,
        email: formData.email,
        interest: project.title,
        message: formData.message,
      });
      setAiConfirmation(confirmation);
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-white flex flex-col"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-stone-200 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[10px] font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {lang === "ar" ? "رجوع" : "Back"}
        </button>

        <div className="hidden md:flex gap-2 flex-wrap justify-center">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 border border-stone-200 text-stone-400 text-[9px] font-bold uppercase tracking-widest rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-stone-900" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">

          {/* Left: Images */}
          <div className="relative bg-stone-100 flex flex-col h-full overflow-hidden">
            {/* Main image — grows to fill */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <img
                key={activeImg}
                src={project.images[activeImg]}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent pointer-events-none" />

              {project.images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 hover:bg-white text-stone-900 transition-all shadow-sm"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 hover:bg-white text-stone-900 transition-all shadow-sm"
                  >
                    <ArrowRight size={16} />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-white/70 backdrop-blur-sm px-2 py-1 rounded">
                {activeImg + 1} / {project.images.length}
              </div>
            </div>

            {/* Thumbnails — fixed height */}
            <div className="flex gap-2 p-3 bg-stone-100 border-t border-stone-200 shrink-0">
              {project.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-14 h-10 overflow-hidden rounded transition-all duration-300 ${
                    activeImg === i
                      ? "ring-2 ring-stone-900 opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info / Inquiry */}
          <div className="bg-white flex flex-col h-full overflow-y-auto border-l border-stone-100">

            {!isInquiring ? (
              <div className="flex flex-col justify-between h-full px-8 md:px-12 py-8">
                <div>
                  {/* Year */}
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-3">
                    {project.year}
                  </p>

                  {/* Title */}
                  <h2 className="font-sans font-black text-3xl md:text-4xl uppercase tracking-tighter text-stone-900 leading-none mb-5">
                    {project.title}
                  </h2>

                  {/* Meta */}
                  <div className="grid grid-cols-1 gap-3 mb-5 border-t border-b border-stone-200 py-4">
                    <div className="flex items-center gap-3 text-stone-600">
                      <MapPin size={13} className="shrink-0 text-stone-400" />
                      <span className="text-sm">{project.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-600">
                      <Calendar size={13} className="shrink-0 text-stone-400" />
                      <span className="text-sm">{project.year}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-600">
                      <Ruler size={13} className="shrink-0 text-stone-400" />
                      <span className="text-sm">{project.size}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="font-serif italic text-stone-600 text-sm md:text-base leading-relaxed mb-4">
                    "{project.summary}"
                  </p>

                  {/* Tags — mobile only */}
                  <div className="flex md:hidden flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 border border-stone-200 text-stone-400 text-[9px] font-bold uppercase tracking-widest rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => setIsInquiring(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-stone-700 transition-colors self-start mt-4"
                >
                  {lang === "ar" ? "استفسر عن هذا المشروع" : "Inquire About This Project"}
                  <ArrowUpRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full px-8 md:px-12 py-8">
                {/* Back button */}
                <button
                  onClick={() => { setIsInquiring(false); setSubmitStatus("idle"); }}
                  className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[9px] font-bold uppercase tracking-widest mb-8"
                >
                  <ArrowLeft size={14} className="rtl:rotate-180" />
                  {lang === "ar" ? "العودة إلى التفاصيل" : "Back to details"}
                </button>

                {submitStatus === "success" ? (
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <div className="flex justify-center mb-4">
                      <CheckCircle2 size={44} className="text-sky-400" />
                    </div>
                    <h3 className="font-sans font-black text-2xl uppercase tracking-tighter text-stone-900 mb-4">
                      {lang === "ar" ? "تم إرسال الطلب" : "Request Sent"}
                    </h3>
                    <div className="bg-stone-50 p-5 border border-stone-100 mb-6 italic font-serif text-stone-600 leading-relaxed text-sm">
                      "{aiConfirmation}"
                    </div>
                    <button
                      onClick={onClose}
                      className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      {lang === "ar" ? "إغلاق" : "Close"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="font-sans font-black text-xl uppercase tracking-tighter text-stone-900 mb-1">
                        {lang === "ar" ? "استفسار رسمي" : "Formal Inquiry"}
                      </h3>
                      <p className="font-serif italic text-stone-500 text-sm">
                        {lang === "ar" ? "الموضوع:" : "Subject:"} {project.title}
                      </p>
                    </div>

                    <form className="space-y-7 flex-1" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 gap-7">
                        {/* Name */}
                        <div className="relative">
                          <label
                            className={`absolute ${lang === "ar" ? "right-0" : "left-0"} transition-all duration-300 text-[9px] uppercase tracking-widest ${
                              activeField === "name" || formData.name ? "-top-6 text-sky-500" : "top-2 text-stone-400"
                            }`}
                          >
                            {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInput("name", e.target.value)}
                            onFocus={() => setActiveField("name")}
                            onBlur={() => setActiveField(null)}
                            className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent ${
                              errors.name ? "border-red-400" : "border-stone-200 focus:border-stone-900"
                            }`}
                          />
                          {errors.name && (
                            <span className={`absolute ${lang === "ar" ? "right-0" : "left-0"} -bottom-4 text-[8px] text-red-400 uppercase tracking-widest`}>
                              {errors.name}
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="relative">
                          <label
                            className={`absolute ${lang === "ar" ? "right-0" : "left-0"} transition-all duration-300 text-[9px] uppercase tracking-widest ${
                              activeField === "email" || formData.email ? "-top-6 text-sky-500" : "top-2 text-stone-400"
                            }`}
                          >
                            {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInput("email", e.target.value)}
                            onFocus={() => setActiveField("email")}
                            onBlur={() => setActiveField(null)}
                            className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent ${
                              errors.email ? "border-red-400" : "border-stone-200 focus:border-stone-900"
                            }`}
                          />
                          {errors.email && (
                            <span className={`absolute ${lang === "ar" ? "right-0" : "left-0"} -bottom-4 text-[8px] text-red-400 uppercase tracking-widest`}>
                              {errors.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Message */}
                      <div className="relative">
                        <label
                          className={`absolute ${lang === "ar" ? "right-0" : "left-0"} transition-all duration-300 text-[9px] uppercase tracking-widest ${
                            activeField === "message" || formData.message ? "-top-6 text-sky-500" : "top-2 text-stone-400"
                          }`}
                        >
                          {lang === "ar" ? "رسالتك" : "Your Message"}
                        </label>
                        <textarea
                          rows={3}
                          value={formData.message}
                          onChange={(e) => handleInput("message", e.target.value)}
                          onFocus={() => setActiveField("message")}
                          onBlur={() => setActiveField(null)}
                          className={`w-full bg-transparent border-b pb-2 pt-2 focus:outline-none transition-all text-stone-900 placeholder-transparent resize-none ${
                            errors.message ? "border-red-400" : "border-stone-200 focus:border-stone-900"
                          }`}
                        />
                        {errors.message && (
                          <span className={`absolute ${lang === "ar" ? "right-0" : "left-0"} -bottom-4 text-[8px] text-red-400 uppercase tracking-widest`}>
                            {errors.message}
                          </span>
                        )}
                      </div>

                      {submitStatus === "error" && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-50 p-3 text-[9px] font-bold uppercase tracking-widest">
                          <AlertCircle size={14} />
                          {lang === "ar" ? "حدث خطأ ما." : "Something went wrong."}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            {lang === "ar" ? "جارٍ الإرسال" : "Sending"}
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            {lang === "ar" ? "إرسال الاستفسار" : "Send Inquiry"}
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-6 text-[8px] font-bold uppercase tracking-widest text-stone-400 text-center">
                      {lang === "ar" ? "تمت المعالجة عبر Art Concierge من Studio Austinn" : "Inquiry processed via Studio Austinn Art Concierge"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;