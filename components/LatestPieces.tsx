import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Language } from "../types";
import { getArtworks } from "../lib/sanityQueries";
import { urlFor } from "../lib/sanityImage";

interface Artwork {
  id: string;
  title: string;
  type: string;
  description: string;
  coverImage: string;
  createdAt: string;
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      heroTitle: "أحدث ما وصلنا",
      heroSub: "مجموعة مختارة بعناية",
      viewAll: "عرض كل الأعمال",
      noType: "عمل فني",
      updatedOn: "أُضيف",
    };
  }
  return {
    heroTitle: "Fresh From",
    heroSub: "The Atelier",
    subtitle:"Check out our latest creations",
    viewAll: "View All Works",
    noType: "Artwork",
    updatedOn: "Added",
  };
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const isMobileDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

const LatestPieces: React.FC<{ lang: Language; onViewAll?: () => void }> = ({
  lang,
  onViewAll,
}) => {
  const t = getContent(lang);

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await getArtworks();

        const mapped: Artwork[] = (data || [])
          .slice(0, 5)
          .map((a: any) => ({
            id: a._id,
            title: a.title ?? "",
            type: a.type ?? "",
            description: a.description ?? "",
            createdAt: a._createdAt ?? "",
            coverImage: a.coverImage?.asset
              ? urlFor(a.coverImage).width(1200).url()
              : "",
          }));

        if (alive) setArtworks(mapped);
      } catch (e) {
        if (alive) setArtworks([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const handleCardClick = (i: number) => {
    if (!isMobileDevice()) return;
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  const isExpanded = (i: number) =>
    isMobileDevice() ? expandedIndex === i : hoveredIndex === i;

  if (loading) {
    return (
      <section className="h-48 bg-stone-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-600" size={20} />
      </section>
    );
  }

  if (!artworks.length) return null;

  return (
    <section
      id="latest-pieces"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="w-full overflow-hidden mt-16 mb-8"
    >

    {/* Header — inside container */}
    <div className="w-full px-6 md:px-14 lg:px-16">
        <div className="flex flex-col items-center text-center mb-16 gap-3">
            <h2 className="font-sans font-black text-2xl md:text-4xl leading-[0.85] text-stone-900 uppercase tracking-tighter">
            {t.heroTitle} <span className="text-stone-400">{t.heroSub}</span>
            </h2>
            <p className="font-serif italic text-xl text-stone-600 max-w-sm">{t.subtitle}</p>
        </div>
    </div>

      {/* Banner strip */}
      <div className="flex w-full" style={{ height: "340px" }}>
        {artworks.map((artwork, i) => {
          const expanded = isExpanded(i);

          return (
            <div
              key={artwork.id}
              className="relative overflow-hidden bg-stone-900 cursor-pointer group h-full transition-all duration-500 ease-in-out"
              style={{
                // On mobile: expanded card takes most space, others collapse
                // On desktop: first card is wider, hover expands via CSS hover states
                flex: isMobileDevice()
                  ? expandedIndex === null
                    ? i === 0 ? "2" : "1"
                    : expandedIndex === i ? "4" : "1.2"
                  : i === 0 ? "2" : "1",
              }}
              onMouseEnter={() => !isMobileDevice() && setHoveredIndex(i)}
              onMouseLeave={() => !isMobileDevice() && setHoveredIndex(null)}
              onClick={() => handleCardClick(i)}
            >
              {/* Image */}
              {artwork.coverImage ? (
                <img
                  src={artwork.coverImage}
                  alt={artwork.title}
                  className={[
                    "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out",
                    expanded ? "scale-105" : "scale-100",
                  ].join(" ")}
                />
              ) : (
                <div className="absolute inset-0 bg-stone-800" />
              )}

              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Separator */}
              {i > 0 && (
                <div className="absolute top-0 left-0 w-px h-full bg-white/20 z-10" />
              )}

              {/* Hero label — first card only */}
              {i === 0 && (
                <div className={["absolute top-6", lang === "ar" ? "right-6" : "left-6"].join(" ")}>
                  
                  {onViewAll && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewAll(); }}
                      className="mt-4 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors group/btn"
                    >
                      {t.viewAll}
                      <ArrowRight
                        size={10}
                        className={[
                          "transition-transform duration-300 group-hover/btn:translate-x-1",
                          lang === "ar" ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>
                  )}
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col justify-end text-white">
                <span className="text-[7px] font-bold uppercase tracking-[0.25em] mb-0.5 opacity-50 truncate">
                  {artwork.type || t.noType}
                </span>
                <h3
                  className={[
                    "font-sans font-black uppercase tracking-tighter leading-tight",
                    expanded ? "whitespace-normal" : "truncate",
                    i === 0 ? "text-base md:text-lg" : "text-[10px] md:text-xs",
                  ].join(" ")}
                >
                  {artwork.title}
                </h3>

                {/* Description — only visible when expanded on mobile */}
                {expanded && artwork.description && (
                  <p className="font-serif italic text-[10px] text-white/60 mt-1.5 leading-relaxed line-clamp-2">
                    {artwork.description}
                  </p>
                )}

                {artwork.createdAt && (
                  <p className="text-[7px] uppercase tracking-widest text-white/40 mt-1 truncate">
                    {t.updatedOn} {formatDate(artwork.createdAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LatestPieces;