import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, X } from "lucide-react";
import { FaInstagram, FaPinterestP, FaWhatsapp } from "react-icons/fa";
import { Language } from "../types";
import PrivacyPolicy from "./PrivacyPolicy";

interface FooterProps {
  lang: Language;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      atelierLabel:  "الاستوديو",
      address:       "القوز 4، دبي",
      digitalLabel:  "التواصل",
      legalLabel:    "قانوني",
      privacy:       "سياسة الخصوصية",
      terms:         "شروط الخدمة",
      copyright:     `© ${new Date().getFullYear()} Atelier Austinn Trading LLC`,
      whatsappText:  "مرحباً Studio Austinn، أنا مهتم بخدماتكم الفنية.",
    };
  }
  return {
    atelierLabel:  "The Atelier",
    address:       "Al Quoz 4, Dubai",
    digitalLabel:  "Connect",
    legalLabel:    "Legal",
    privacy:       "Privacy Policy",
    terms:         "Terms of Service",
    copyright:     `© ${new Date().getFullYear()} Atelier Austinn Trading LLC`,
    whatsappText:  "Hello Studio Austinn, I'm interested in your art services.",
  };
};

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const t = getContent(lang);

  const whatsappUrl = `https://wa.me/+971581558866?text=${encodeURIComponent(t.whatsappText)}`;
  const instagramUrl = "https://www.instagram.com/studio_austinn/";
  const pinterestUrl = "https://fr.pinterest.com/marinebordiercros/";

  const socialIcon = "w-9 h-9 flex items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300";

  return (
    <>
      <footer
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="bg-stone-50 border-t border-stone-200 px-6 lg:px-12 pt-10 pb-6"
      >
        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 pb-8 border-b border-stone-200">

          {/* Column 1 — Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col leading-none">
              <span className="font-sans font-black text-xl uppercase tracking-tighter text-stone-900 opacity-50">
                Studio
              </span>
              <span className="font-script text-2xl -mt-1 ml-3 text-stone-400">
                Austinn
              </span>
            </div>
          </div>

          {/* Column 2 — The Atelier + Connect */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-3">
                {t.atelierLabel}
              </p>
              <div className="flex flex-col gap-2.5">
                <span className="flex items-center gap-2.5 text-[11px] text-stone-600 font-sans">
                  <MapPin size={13} className="text-stone-400 shrink-0" />
                  {t.address}
                </span>
                <a
                  href="mailto:hello@studioaustinn.com"
                  className="flex items-center gap-2.5 text-[11px] text-stone-600 hover:text-stone-900 transition-colors font-sans"
                >
                  <Mail size={13} className="text-stone-400 shrink-0" />
                  hello@studioaustinn.com
                </a>
                <a
                  href="tel:+971581558866"
                  className="flex items-center gap-2.5 text-[11px] text-stone-600 hover:text-stone-900 transition-colors font-sans"
                >
                  <Phone size={13} className="text-stone-400 shrink-0" />
                  +971 58 155 8866
                </a>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-3">
                {t.digitalLabel}
              </p>
              <div className="flex items-center gap-3">
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={socialIcon}>
                  <FaInstagram size={14} />
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={socialIcon}>
                  <FaWhatsapp size={14} />
                </a>
                <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className={socialIcon}>
                  <FaPinterestP size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 3 — Legal */}
          <div className="flex flex-col gap-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-0">
              {t.legalLabel}
            </p>
            <button
              onClick={() => setShowPrivacy(true)}
              className="self-start text-[11px] text-stone-600 hover:text-stone-900 transition-colors underline underline-offset-4 font-sans"
            >
              {t.privacy}
            </button>
            <Link
              to="/terms-of-service"
              className="self-start text-[11px] text-stone-600 hover:text-stone-900 transition-colors underline underline-offset-4 font-sans"
            >
              {t.terms}
            </Link>
          </div>

        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className="pt-5">
          <span className="text-[9px] text-stone-400 uppercase tracking-[0.3em]">
            {t.copyright}
          </span>
        </div>
      </footer>

      {/* Privacy Policy modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowPrivacy(false)} />
          <div className="relative z-10 w-full md:max-w-3xl md:mx-4 bg-stone-50 md:rounded-sm shadow-2xl max-h-[70dvh] overflow-y-auto">
            <button
              onClick={() => setShowPrivacy(false)}
              className="sticky top-4 float-right mr-4 z-20 p-2 bg-white hover:bg-stone-900 hover:text-white rounded-full shadow transition-all duration-300"
            >
              <X size={18} />
            </button>
            <PrivacyPolicy lang={lang} />
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
