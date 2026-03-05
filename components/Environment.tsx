import React, { useEffect, useMemo, useRef, useState } from "react";
import { Language } from "../types";
import privateVilla from "../public/environment/privateVillas.jpeg";
import yachts from "../public/environment/yachts.jpeg";
import mall from "../public/environment/mall.jpg";
import publicSpace from "../public/environment/publicSpace.jpg";

type ImgLike = string | { src?: string } | any;

interface Sector {
  title: string;
  category: string;
  image: ImgLike;
  description: string;
}

const getImgSrc = (img: ImgLike): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && typeof img.src === "string") return img.src;
  if (typeof img === "object" && typeof img.default === "string") return img.default;
  return String(img);
};

const getSectors = (lang: Language): Sector[] => {
  if (lang === "ar") {
    return [
      {
        title: "فلل خاصة",
        category: "سكني",
        image: privateVilla,
        description: "تركيبات فنية مخصّصة صُمّمت لأرقى المساكن الخاصة في دولة الإمارات.",
      },
      {
        title: "الضيافة",
        category: "فنادق ومنتجعات",
        image:
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop",
        description: "إعادة ابتكار تجربة الضيوف من خلال منحوتات مميّزة ومعارض فنية منسّقة.",
      },
      {
        title: "اليخوت والطائرات الخاصة",
        category: "التنقّل الفاخر",
        image: yachts,
        description: "أعمال فنية وعناصر نحتية حصرية مصمّمة لليخوت الفاخرة ومقصورات الطائرات الخاصة.",
      },
      {
        title: "شركاء التصميم",
        category: "معماريون",
        image:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop",
        description: "التعاون مع معماريين عالميين لدمج الفن منذ المراحل الأولى للتصميم.",
      },
      {
        title: "التجزئة الفاخرة",
        category: "مراكز تسوق وبوتيكات",
        image: mall,
        description: "ابتكار تجارب علامة تجارية غامرة من خلال التقاء الفن والتجارة.",
      },
      {
        title: "المساحات العامة",
        category: "مدنية ومؤسسية",
        image: publicSpace,
        description: "تركيبات واسعة النطاق تعيد تعريف المشهد الحضري وبيئات العمل.",
      },
    ];
  }

  return [
    {
      title: "Private Villas",
      category: "Residential",
      image: privateVilla,
      description: "Bespoke art installations tailored for the most exclusive residences in the UAE.",
    },
    {
      title: "Hospitality",
      category: "Hotels & Gastronomy",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop",
      description: "Transforming guest experiences with statement sculptures and curated galleries.",
    },
    {
      title: "Yachts & Jets",
      category: "Ultra Luxury Mobility",
      image: yachts,
      description: "Exclusive artworks and sculptural elements designed for yachts and private aviation interiors.",
    },
    {
      title: "Design Partners",
      category: "Architects",
      image:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop",
      description: "Collaborating with world-class architects to integrate art from the blueprint phase.",
    },
    {
      title: "Luxury Retail",
      category: "Malls & Boutiques",
      image: mall,
      description: "Creating immersive brand experiences through artistic commerce.",
    },
    {
      title: "Public Spaces",
      category: "Civic & Corporate",
      image: publicSpace,
      description: "Large-scale installations that redefine public landscapes and workspaces.",
    },
  ];
};

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      ecosystem: "المنظومة",
      titleTop: "حيث",
      titleBottom: "يسكن الفن",
      subtitle: "من الملاذات الخاصة الحميمة إلى المعالم العامة الواسعة.",
      partners: ["معماريون", "مطوّرون", "مصمّمون", "مالكون"],
    };
  }

  return {
    ecosystem: "Ecosystem",
    titleTop: "Where Art",
    titleBottom: "Resides",
    subtitle: "From intimate private sanctuaries to expansive public landmarks.",
    partners: ["Architects", "Developers", "Designers", "Proprietors"],
  };
};

// ✅ Finds the actual scrolling container (or falls back to window)
const getScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
  if (!node) return window;
  let parent: HTMLElement | null = node.parentElement;

  const isScrollable = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    return (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    );
    // NOTE: you can also include overflow: overlay if needed
  };

  while (parent) {
    if (isScrollable(parent)) return parent;
    parent = parent.parentElement;
  }

  return window;
};

const Environments: React.FC<{ lang: Language }> = ({ lang }) => {
  const sectors = useMemo(() => getSectors(lang), [lang]);
  const t = getContent(lang);

  const [activeSector, setActiveSector] = useState<number | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  };

  // ✅ Mobile: update active card while scrolling INSIDE whichever container is actually scrolling
  useEffect(() => {
    if (typeof window === "undefined") return;

    // only for mobile
    if (!isMobile()) return;

    // start with first item active so you immediately see a cover
    setActiveSector(0);

    const scroller = getScrollParent(sectionRef.current);
    const isWindow = scroller === window;

    const getViewportCenterY = () => {
      if (isWindow) return (window.innerHeight || 0) * 0.5;

      const el = scroller as HTMLElement;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height * 0.5;
    };

    const updateActive = () => {
      if (!isMobile()) return;

      const targetCenterY = getViewportCenterY();

      let bestIndex = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height * 0.5;

        const dist = Math.abs(centerY - targetCenterY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }

      setActiveSector(bestIndex);
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateActive);
    };

    // attach to correct scroller
    if (isWindow) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    } else {
      (scroller as HTMLElement).addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    // initial compute after paint
    onScroll();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (isWindow) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      } else {
        (scroller as HTMLElement).removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
  }, [sectors.length]);

  // Desktop hover only
  const handleMouseEnter = (index: number) => {
    if (isMobile()) return;
    setActiveSector(index);
  };

  const handleMouseLeave = () => {
    if (isMobile()) return;
    setActiveSector(null);
  };

  return (
    <section
      ref={(el) => {
        sectionRef.current = el;
      }}
      id="spaces"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="py-24 bg-stone-100 overflow-hidden"
    >
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-stone-400 mb-4">
              {t.ecosystem}
            </h3>

            <h2
              className={[
                "font-sans font-black text-6xl md:text-6xl uppercase tracking-tighter text-stone-900 leading-none",
                lang === "ar" ? "text-right" : "text-left",
              ].join(" ")}
            >
              {t.titleTop} <br />
              <span className="text-stone-400">{t.titleBottom}</span>
            </h2>
          </div>

          <div className={lang === "ar" ? "text-right" : "text-left md:text-right"}>
            <p className="font-serif italic text-xl text-stone-600 max-w-sm">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {sectors.map((sector, index) => {
            const src = getImgSrc(sector.image);

            return (
              <div
                key={index}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className="relative aspect-[4/3] rounded-[8px] group overflow-hidden bg-stone-200 cursor-crosshair"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={src}
                  alt={sector.title}
                  className={[
                    "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out grayscale",
                    // Desktop hover behavior
                    "md:opacity-40 md:group-hover:opacity-100 md:group-hover:grayscale-0 md:group-hover:scale-105",
                    // ✅ Mobile: ONLY active one shows cover clearly
                    activeSector === index
                      ? "opacity-100 scale-105 grayscale-0"
                      : "opacity-0 scale-100",
                  ].join(" ")}
                />

                <div
                  className={[
                    "absolute inset-0 transition-colors duration-500",
                    // Desktop
                    "md:bg-stone-900/40 md:group-hover:bg-stone-900/10",
                    // Mobile
                    activeSector === index ? "bg-stone-900/15" : "bg-stone-900/40",
                  ].join(" ")}
                />

                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-80 md:group-hover:opacity-100 md:group-hover:translate-x-2 transition-all duration-500">
                    {sector.category}
                  </span>

                  <h3 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-tighter md:group-hover:-translate-y-2 transition-transform duration-500">
                    {sector.title}
                  </h3>

                  {/* Desktop: hover. Mobile: active card. */}
                  <div
                    className={[
                      "overflow-hidden transition-all duration-500",
                      "md:h-0 md:opacity-0 md:group-hover:h-auto md:group-hover:opacity-100",
                      activeSector === index ? "h-auto opacity-100 mt-4" : "h-0 opacity-0 mt-0",
                    ].join(" ")}
                  >
                    <p className="font-serif italic text-sm text-stone-100 leading-relaxed max-w-[250px]">
                      {sector.description}
                    </p>
                  </div>
                </div>

                <div
                  className={[
                    "absolute top-8 text-xs font-bold font-sans tracking-widest opacity-30 text-white",
                    lang === "ar" ? "left-8" : "right-8",
                  ].join(" ")}
                >
                  0{index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Partner Note */}
        <div className="mt-20 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
          {t.partners.map((p, i) => (
            <React.Fragment key={p}>
              <span className="font-sans font-bold text-[10px] uppercase tracking-[0.4em]">
                {p}
              </span>
              {i < t.partners.length - 1 && (
                <span className="w-1 h-1 bg-stone-400 rounded-full hidden md:inline-block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Environments;