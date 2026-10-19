import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Language } from "../types";

// Shared enlarged artwork view for the catalogue (Services) and Fresh From the
// Atelier (LatestPieces): large image, title + category, WhatsApp inquiry.

// Catalogue type → display title, for callers that only have the raw type.
export const CATALOGUE_TYPE_TITLES: Record<string, { en: string; ar: string }> = {
  painting:     { en: "Paintings",     ar: "لوحات"      },
  sculpture:    { en: "Sculptures",    ar: "منحوتات"    },
  chandelier:   { en: "Chandeliers",   ar: "ثريات"      },
  installation: { en: "Installations", ar: "تركيبات"    },
  bespoke:      { en: "Bespoke",       ar: "حسب الطلب" },
};

// WhatsApp inquiry link with the pre-filled artwork message.
export const catalogueWhatsAppUrl = (lang: Language, artTitle: string, categoryTitle: string) =>
  `https://wa.me/971581558866?text=${encodeURIComponent(
    lang === "ar"
      ? `مرحباً، اطّلعت على كتالوج ستوديو أوستن وأنا مهتم بالعمل الفني التالي:\n\n🖼 ${artTitle}\n📂 ${categoryTitle}\n\nهل يمكنك مشاركة مزيد من التفاصيل حول التوفر والسعر؟\n🌐 www.studioaustinn.com`
      : `https://studioaustinn.com/ \nHello, I came across Studio Austinn's catalogue and I'm interested in the following artwork:\n\n- ${artTitle}\n- ${categoryTitle}\n\nCould you share more details on availability and pricing?`
  )}`;

const getContent = (lang: Language) =>
  lang === "ar"
    ? { close: "إغلاق", inquireWhatsApp: "استفسر عبر واتساب" }
    : { close: "Close", inquireWhatsApp: "Inquire on WhatsApp" };

interface ArtworkLightboxProps {
  lang: Language;
  title: string;
  /** Category shown under the title and sent in the WhatsApp message. */
  category: string;
  image: string;
  onClose: () => void;
}

/** Render with `key` set to the artwork id so the loading state resets per artwork. */
const ArtworkLightbox: React.FC<ArtworkLightboxProps> = ({ lang, title, category, image, onClose }) => {
  const t = getContent(lang);
  // Large image still downloading → spinner in its place.
  const [loaded, setLoaded] = useState(false);

  // Close with Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-6 bg-stone-950/90 backdrop-blur-sm p-4 md:p-10 animate-fade-in-up"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-stone-900 transition-all"
      >
        <X size={20} />
      </button>

      <div className="relative flex items-center justify-center min-w-[12rem] min-h-[12rem]">
        {!loaded && (
          <Loader2 size={28} className="absolute animate-spin text-white/70" aria-hidden="true" />
        )}
        <img
          src={image}
          alt={`${title} — ${category} | Studio Austinn`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          onClick={(e) => e.stopPropagation()}
          className={`max-w-full max-h-[70vh] object-contain shadow-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-4 text-center">
        <div>
          <h4 className="font-serif text-xl md:text-2xl text-white leading-tight">{title}</h4>
          <p className="font-sans text-[10px] uppercase tracking-widest text-white/50 mt-1">{category}</p>
        </div>
        <a
          href={catalogueWhatsAppUrl(lang, title, category)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-white text-stone-900 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
        >
          {t.inquireWhatsApp}
        </a>
      </div>
    </div>
  );
};

export default ArtworkLightbox;
