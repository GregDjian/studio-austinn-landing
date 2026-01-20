import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Instagram,
  Linkedin,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { processLeadInquiry } from "../services/geminiService";
import { Language } from "../types";

type SubmitStatus = "idle" | "success" | "error";

const INTEREST_OPTIONS = [
  "Sculpture",
  "Paintings",
  "Bespoke Installation",
  "Consultancy",
] as const;

type InterestOption = (typeof INTEREST_OPTIONS)[number];

type FormData = {
  name: string;
  email: string;
  interest: InterestOption[]; // multi-select
  message: string;
};

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      subtitle: "استفسار",
      titleTop: "ابدأ",
      titleBottom: "الحوار",
      desc: "نحن ننسّق البيئات لأصحاب الرؤى. دعنا نساعدك في اختيار القطعة المثالية أو تكليف عمل مُخصّص لمساحتك.",
      labelName: "الاسم الكامل",
      labelEmail: "البريد الإلكتروني",
      labelInterest: "مجال الاهتمام (اختر واحداً أو أكثر)",
      labelMessage: "أخبرنا عن مشروعك",
      submit: "إرسال طلب رسمي",
      submitting: "جارٍ معالجة الطلب",
      successTitle: "تم استلام الاستفسار",
      sendAnother: "إرسال استفسار آخر",
      responseTime: "وقت الاستجابة: أقل من 24 ساعة",
      errors: {
        nameRequired: "الاسم الكامل مطلوب",
        emailRequired: "البريد الإلكتروني مطلوب",
        emailInvalid: "يرجى إدخال بريد إلكتروني صحيح",
        interestRequired: "يرجى اختيار مجال اهتمام واحد على الأقل",
        messageRequired: "يرجى توضيح تفاصيل مشروعك",
        messageMin: "يجب ألا تقل الرسالة عن 10 أحرف",
        generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      },
      atelierLabel: "الاستوديو",
      digitalLabel: "التواصل",
      addressTitle: "القوز - دبي",
    };
  }

  return {
    subtitle: "Inquiry",
    titleTop: "Begin The",
    titleBottom: "Dialogue",
    desc: "We curate environments for the visionary. Let us assist you in sourcing or commissioning the perfect piece for your space.",
    labelName: "Full Name",
    labelEmail: "Email Address",
    labelInterest: "Interest Area (select one or more)",
    labelMessage: "Tell us about your project",
    submit: "Send Formal Request",
    submitting: "Processing Inquiry",
    successTitle: "Inquiry Received",
    sendAnother: "Send another inquiry",
    responseTime: "Response time: < 24h",
    errors: {
      nameRequired: "Full name is required",
      emailRequired: "Email is required",
      emailInvalid: "Please enter a valid email address",
      interestRequired: "Please select at least one area of interest",
      messageRequired: "Please tell us about your project",
      messageMin: "Message must be at least 10 characters",
      generic: "Something went wrong. Please try again.",
    },
    atelierLabel: "The Atelier",
    digitalLabel: "Digital",
    addressTitle: "Al Quoz Dubai",
  };
};

const Contact: React.FC<{ lang: Language }> = ({ lang }) => {
  const content = getContent(lang);

  const [activeField, setActiveField] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    interest: [],
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [aiConfirmation, setAiConfirmation] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = content.errors.nameRequired;

    if (!formData.email.trim()) {
      newErrors.email = content.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = content.errors.emailInvalid;
    }

    if (formData.interest.length === 0)
      newErrors.interest = content.errors.interestRequired;

    if (!formData.message.trim()) newErrors.message = content.errors.messageRequired;
    else if (formData.message.length < 10) newErrors.message = content.errors.messageMin;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
    clearError(field);
  };

  const toggleInterest = (interest: InterestOption) => {
    setFormData((prev) => {
      const exists = prev.interest.includes(interest);
      const next = exists
        ? prev.interest.filter((i) => i !== interest)
        : [...prev.interest, interest];

      return { ...prev, interest: next };
    });
    clearError("interest");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Simulate API call to lead management system
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Send to Gemini: join interests into a readable string
      const payloadForAI = {
        ...formData,
        interest: formData.interest.join(", "),
      };

      // ✅ updated: pass lang + leadData
      const confirmation = await processLeadInquiry(lang, payloadForAI as any);
      setAiConfirmation(confirmation);

      setSubmitStatus("success");
      setFormData({ name: "", email: "", interest: [], message: "" });
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer
      id="contact"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-stone-900 text-stone-200 py-32 relative overflow-hidden"
    >
      {/* Editorial Background Text */}
      <div className="absolute top-1/4 -left-20 pointer-events-none select-none opacity-[0.03]">
        <span className="font-sans font-black text-[25vw] leading-none uppercase tracking-tighter text-white">
          AUSTINN
        </span>
      </div>

      {/* Decorative Light Blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-300/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Left Column: Information */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative mb-16">
              <span
                className={[
                  "font-script text-7xl text-stone-700 absolute -top-10 z-0 opacity-40",
                  lang === "ar" ? "right-0" : "left-0",
                ].join(" ")}
              >
                {content.subtitle}
              </span>

              <h2 className="relative z-10 font-sans font-black text-6xl md:text-7xl leading-[0.85] text-white uppercase tracking-tighter">
                {lang === "en" ? (
                  <>
                    Begin The <br />
                    <span className="text-stone-500">Dialogue</span>
                  </>
                ) : (
                  <>
                    {content.titleTop} <br />
                    <span className="text-stone-500">{content.titleBottom}</span>
                  </>
                )}
              </h2>
            </div>

            <p className="font-serif text-xl text-stone-400 mb-16 max-w-sm leading-relaxed">
              {content.desc}
            </p>

            <div className="space-y-12 mb-16">
              <div className="group cursor-default">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-[1px] bg-stone-700 group-hover:w-12 group-hover:bg-sky-300 transition-all duration-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500 group-hover:text-stone-300 transition-colors">
                    {content.atelierLabel}
                  </span>
                </div>
                <div className="flex gap-4">
                  <MapPin size={18} className="text-stone-600 mt-1 shrink-0" />
                  <p className="font-sans text-stone-300 leading-relaxed">
                    <strong className="block text-white mb-1">
                      {content.addressTitle}
                    </strong>
                    Building 7, Office 304
                    <br />
                    Al Khail Road, Dubai, UAE
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="group cursor-default">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-8 h-[1px] bg-stone-700 group-hover:w-12 group-hover:bg-sky-300 transition-all duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500 group-hover:text-stone-300 transition-colors">
                      {content.digitalLabel}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <a
                      href="mailto:hello@studioaustinn.ae"
                      className="flex items-center gap-3 font-sans text-stone-300 hover:text-white transition-colors"
                    >
                      <Mail size={16} className="text-stone-600" />
                      hello@studioaustinn.ae
                    </a>
                    <a
                      href="tel:+971501234567"
                      className="flex items-center gap-3 font-sans text-stone-300 hover:text-white transition-colors"
                    >
                      <Phone size={16} className="text-stone-600" />
                      +971 50 123 4567
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <div className="bg-stone-800/50 backdrop-blur-xl border border-white/5 p-10 md:p-16 relative overflow-hidden min-h-[600px] flex flex-col justify-center">
              {submitStatus === "success" ? (
                <div className="relative z-10 text-center animate-fade-in-up">
                  <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-sky-400/20 rounded-full flex items-center justify-center border border-sky-400/50">
                      <CheckCircle2 size={40} className="text-sky-300" />
                    </div>
                  </div>

                  <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-white mb-6">
                    {content.successTitle}
                  </h3>

                  <div className="bg-stone-900/40 p-8 rounded-sm border border-white/5 mb-8">
                    <p className="font-serif italic text-lg text-stone-300 leading-relaxed">
                      "{aiConfirmation}"
                    </p>
                  </div>

                  <button
                    onClick={() => setSubmitStatus("idle")}
                    className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-white transition-colors underline underline-offset-8"
                  >
                    {content.sendAnother}
                  </button>
                </div>
              ) : (
                <>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Send
                      size={40}
                      className={[
                        "text-white transform rotate-12",
                        lang === "ar" ? "-scale-x-100" : "" // flip horizontally in Arabic (points left)
                      ].join(" ")}
                    />
                  </div>


                  <form className="relative z-10 space-y-10" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="relative">
                        <label
                          className={`absolute ${
                            lang === "ar" ? "right-0" : "left-0"
                          } transition-all duration-300 text-[10px] uppercase tracking-widest ${
                            activeField === "name" || formData.name
                              ? "-top-6 text-sky-300"
                              : "top-2 text-stone-500"
                          }`}
                        >
                          {content.labelName}
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          onFocus={() => setActiveField("name")}
                          onBlur={() => setActiveField(null)}
                          className={`w-full bg-transparent border-b pb-3 pt-2 focus:outline-none transition-all text-white placeholder-transparent ${
                            errors.name
                              ? "border-red-500"
                              : "border-stone-700 focus:border-sky-300"
                          }`}
                          placeholder={content.labelName}
                        />
                        {errors.name && (
                          <span
                            className={`absolute ${
                              lang === "ar" ? "right-0" : "left-0"
                            } -bottom-5 text-[9px] text-red-500 uppercase tracking-widest`}
                          >
                            {errors.name}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <label
                          className={`absolute ${
                            lang === "ar" ? "right-0" : "left-0"
                          } transition-all duration-300 text-[10px] uppercase tracking-widest ${
                            activeField === "email" || formData.email
                              ? "-top-6 text-sky-300"
                              : "top-2 text-stone-500"
                          }`}
                        >
                          {content.labelEmail}
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          onFocus={() => setActiveField("email")}
                          onBlur={() => setActiveField(null)}
                          className={`w-full bg-transparent border-b pb-3 pt-2 focus:outline-none transition-all text-white placeholder-transparent ${
                            errors.email
                              ? "border-red-500"
                              : "border-stone-700 focus:border-sky-300"
                          }`}
                          placeholder={content.labelEmail}
                        />
                        {errors.email && (
                          <span
                            className={`absolute ${
                              lang === "ar" ? "right-0" : "left-0"
                            } -bottom-5 text-[9px] text-red-500 uppercase tracking-widest`}
                          >
                            {errors.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Multi-select Interest */}
                    <div className="relative">
                      <label
                        className={`block text-[10px] uppercase tracking-widest mb-6 ${
                          errors.interest ? "text-red-500" : "text-stone-500"
                        }`}
                      >
                        {content.labelInterest}
                      </label>

                      <div className="flex flex-wrap gap-3">
                        {INTEREST_OPTIONS.map((interest) => {
                          const isActive = formData.interest.includes(interest);

                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={`px-5 py-2 border rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                isActive
                                  ? "bg-white text-stone-900 border-white"
                                  : "border-stone-700 text-stone-400 hover:border-stone-400"
                              }`}
                              aria-pressed={isActive}
                            >
                              {interest}
                            </button>
                          );
                        })}
                      </div>

                      {errors.interest && (
                        <span
                          className={`absolute ${
                            lang === "ar" ? "right-0" : "left-0"
                          } -bottom-6 text-[9px] text-red-500 uppercase tracking-widest`}
                        >
                          {errors.interest}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <label
                        className={`absolute ${
                          lang === "ar" ? "right-0" : "left-0"
                        } transition-all duration-300 text-[10px] uppercase tracking-widest ${
                          activeField === "message" || formData.message
                            ? "-top-6 text-sky-300"
                            : "top-2 text-stone-500"
                        }`}
                      >
                        {content.labelMessage}
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        onFocus={() => setActiveField("message")}
                        onBlur={() => setActiveField(null)}
                        className={`w-full bg-transparent border-b pb-3 pt-2 focus:outline-none transition-all text-white placeholder-transparent resize-none ${
                          errors.message
                            ? "border-red-500"
                            : "border-stone-700 focus:border-sky-300"
                        }`}
                        placeholder={content.labelMessage}
                      />
                      {errors.message && (
                        <span
                          className={`absolute ${
                            lang === "ar" ? "right-0" : "left-0"
                          } -bottom-5 text-[9px] text-red-500 uppercase tracking-widest`}
                        >
                          {errors.message}
                        </span>
                      )}
                    </div>

                    {submitStatus === "error" && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 border border-red-400/20 text-[10px] uppercase tracking-widest">
                        <AlertCircle size={14} />
                        {content.errors.generic}
                      </div>
                    )}

                    <div className="pt-6 group">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative w-full overflow-hidden px-8 py-5 bg-white text-stone-900 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 group-hover:bg-sky-300 transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            {content.submitting}
                          </>
                        ) : (
                          <>
                            {content.submit}
                            <ArrowRight
                              size={16}
                              className={lang === "ar" ? "rotate-180" : ""}
                            />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <div className="mt-12 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-600">
              <p>{content.responseTime}</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-16 border-t border-stone-800/50 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex flex-col items-start leading-none opacity-50">
              <span className="font-sans font-black text-xl uppercase tracking-tighter">
                Studio
              </span>
              <span className="font-script text-2xl transform -translate-y-2 translate-x-3 text-stone-400">
                Austinn
              </span>
            </div>
            <span className="text-[9px] text-stone-600 uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} Studio Austinn Art Consultancy FZ-LLC.
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#" className="group flex flex-col items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-stone-800 group-hover:border-white group-hover:bg-white group-hover:text-stone-900 transition-all duration-500">
                <Instagram size={18} strokeWidth={1.5} />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-600 group-hover:text-stone-300 transition-colors">
                Instagram
              </span>
            </a>

            <a href="#" className="group flex flex-col items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-stone-800 group-hover:border-white group-hover:bg-white group-hover:text-stone-900 transition-all duration-500">
                <Linkedin size={18} strokeWidth={1.5} />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-600 group-hover:text-stone-300 transition-colors">
                Whatsapp
              </span>
            </a>

            <a href="#" className="group flex flex-col items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full border border-stone-800 group-hover:border-white group-hover:bg-white group-hover:text-stone-900 transition-all duration-500">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-stone-600 group-hover:text-stone-300 transition-colors">
                Pinterest
              </span>
            </a>
          </div>

          <div className="flex gap-8 text-[9px] font-bold uppercase tracking-[0.2em] text-stone-600">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Contact;
