import React, { useEffect, useMemo, useRef, useState } from "react";
import { Language } from "../types";
import privateVilla from "../public/environment/privateVillas.jpeg";
import yachts from "../public/environment/yachts.jpeg";
import publicSpace from "../public/environment/publicSpace.jpeg";
import designPartner from "../public/environment/designPartner.jpeg";
import hospitality from "../public/environment/hospitality.jpeg";
import luxuryRetail from "../public/environment/luxuryRetail.jpeg";
import { getProjects } from "../lib/sanityQueries";
import { imgUrl } from "../lib/sanityImage";
import SectorModal, { Sector } from "./SectorModal";

type ImgLike = string | { src?: string } | any;

interface Project {
  id: string;
  title: string;
  location: string;
  year: string;
  size: string;
  summary: string;
  cover: string;
  images: string[];
  tags: string[];
}

type ProjectsBySector = Record<string, Project[]>;

const getImgSrc = (img: ImgLike): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && typeof img.src === "string") return img.src;
  if (typeof img === "object" && typeof img.default === "string") return img.default;
  return String(img);
};

const getSectors = (lang: Language, projectsBySector: ProjectsBySector): Sector[] => {
  const base = [
    { title: "Private Villas",  category: lang === "ar" ? "سكني"                : "Residential",          image: privateVilla,  description: lang === "ar" ? "تركيبات فنية مخصّصة صُمّمت لأرقى المساكن الخاصة في دولة الإمارات."                                             : "Bespoke art installations tailored for the most exclusive residences in the UAE." },
    { title: "Hospitality",     category: lang === "ar" ? "فنادق ومنتجعات"       : "Hotels & Gastronomy",  image: hospitality,   description: lang === "ar" ? "إعادة ابتكار تجربة الضيوف من خلال منحوتات مميّزة ومعارض فنية منسّقة."                                         : "Transforming guest experiences with statement sculptures and curated galleries." },
    { title: "Yachts & Jets",   category: lang === "ar" ? "التنقّل الفاخر"       : "Ultra Luxury Mobility", image: yachts,       description: lang === "ar" ? "أعمال فنية وعناصر نحتية حصرية مصمّمة لليخوت الفاخرة ومقصورات الطائرات الخاصة."                             : "Exclusive artworks and sculptural elements designed for yachts and private aviation interiors." },
    { title: "Design Partners", category: lang === "ar" ? "معماريون"             : "Architects",           image: designPartner, description: lang === "ar" ? "التعاون مع معماريين عالميين لدمج الفن منذ المراحل الأولى للتصميم."                                           : "Collaborating with world-class architects to integrate art from the blueprint phase." },
    { title: "Luxury Retail",   category: lang === "ar" ? "مراكز تسوق وبوتيكات" : "Malls & Boutiques",   image: luxuryRetail,  description: lang === "ar" ? "ابتكار تجارب علامة تجارية غامرة من خلال التقاء الفن والتجارة."                                               : "Creating immersive brand experiences through artistic commerce." },
    { title: "Public Spaces",   category: lang === "ar" ? "مدنية ومؤسسية"       : "Civic & Corporate",    image: publicSpace,   description: lang === "ar" ? "تركيبات واسعة النطاق تعيد تعريف المشهد الحضري وبيئات العمل."                                                 : "Large-scale installations that redefine public landscapes and workspaces." },
  ];

  return base.map((s) => ({ ...s, projects: projectsBySector[s.title] ?? [] }));
};

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      titleTop: "حيث",
      titleBottom: "يسكن الفن",
      subtitle: "فن لا يزيّن المساحات، بل يعرّفها — من الملاذات الخاصة الحميمة إلى المعالم العامة الواسعة.",
      partners: ["معماريون", "مطوّرون", "مصمّمون", "مالكون"],
      projects: "مشاريع",
    };
  }
  return {
    titleTop: "Where Art",
    titleBottom: "Resides",
    subtitle: "Art that doesn't decorate spaces, it defines them.",
    partners: ["Architects", "Developers", "Designers", "Proprietors"],
    projects: "Projects",
  };
};

const getScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
  if (!node) return window;
  let parent: HTMLElement | null = node.parentElement;
  const isScrollable = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    return (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
  };
  while (parent) {
    if (isScrollable(parent)) return parent;
    parent = parent.parentElement;
  }
  return window;
};

const Environments: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = getContent(lang);

  const [projectsBySector, setProjectsBySector] = useState<ProjectsBySector>({});
  const [activeSector, setActiveSector] = useState<number | null>(null);
  const [openSector, setOpenSector] = useState<Sector | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  // ── Fetch projects from Sanity ──
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await getProjects();

        const mapped = (data || []).map((p: any) => ({
          id: p._id,
          title: p.title ?? "",
          location: p.location ?? "",
          year: p.year ?? "",
          size: p.size ?? "",
          summary: p.summary ?? "",
          sector: p.sector ?? "",
          tags: p.tags ?? [],
          cover: p.coverImage?.asset ? imgUrl.card(p.coverImage) : "",
          images: (p.images ?? [])
            .filter((img: any) => img?.asset)
            .map((img: any) => imgUrl.full(img)),
        }));

        const grouped: ProjectsBySector = {};
        mapped.forEach((project: any) => {
          const key = project.sector;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(project);
        });

        if (alive) setProjectsBySector(grouped);
      } catch (e) {
        console.error("Failed to fetch projects:", e);
      }
    })();

    return () => { alive = false; };
  }, []);

  const sectors = useMemo(() => getSectors(lang, projectsBySector), [lang, projectsBySector]);

  const isMobile = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // ── Mobile scroll tracking ──
  useEffect(() => {
    if (typeof window === "undefined" || !isMobile()) return;

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
        const dist = Math.abs(rect.top + rect.height * 0.5 - targetCenterY);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
      }
      setActiveSector(bestIndex);
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateActive);
    };

    if (isWindow) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    } else {
      (scroller as HTMLElement).addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

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

  const handleMouseEnter = (index: number) => { if (!isMobile()) setActiveSector(index); };
  const handleMouseLeave = () => { if (!isMobile()) setActiveSector(null); };

  return (
    <>
      <section
        ref={(el) => { sectionRef.current = el; }}
        id="spaces-projects"
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="py-16 md:py-24 bg-stone-100 overflow-hidden"
      >
        {/* Header — inside container */}
        <div className="container mx-auto px-6 md:px-14 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className={["font-sans font-black text-5xl md:text-6xl leading-[0.85] text-stone-900 uppercase tracking-tighter", lang === "ar" ? "text-right" : "text-left"].join(" ")}>
                {t.titleTop} <br />
                <span className="text-stone-400">{t.titleBottom}</span>
              </h2>
            </div>
            <div className={lang === "ar" ? "text-right" : "text-left md:text-right"}>
              <p className="font-serif italic text-xl text-stone-600 max-w-sm">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Grid — full width, outside container */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-0">
          {sectors.map((sector, index) => {
            const src = getImgSrc(sector.image);
            const projectCount = (projectsBySector[sector.title] ?? []).length;

            return (
              <div
                key={index}
                ref={(el) => { itemRefs.current[index] = el; }}
                className="relative aspect-square md:aspect-[4/3] rounded-none md:rounded-[0px] group overflow-hidden bg-stone-200 cursor-pointer"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  if (isMobile()) setActiveSector(index);
                  setOpenSector(sector);
                }}
              >
                <img
                  src={src}
                  alt={sector.title}
                  loading="lazy"
                  decoding="async"
                  className={[
                    "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out",
                    "grayscale-[0.6] opacity-90 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105",
                    activeSector === index ? "opacity-100 scale-105 grayscale-0" : "opacity-40 scale-100 grayscale",
                  ].join(" ")}
                />

                <div className={["absolute inset-0 transition-colors duration-500", "md:bg-stone-900/40 md:group-hover:bg-stone-900/10", activeSector === index ? "bg-stone-900/15" : "bg-stone-900/40"].join(" ")} />

                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-80 transition-all duration-500">
                    {sector.category}
                  </span>
                  <h3 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-tighter md:group-hover:-translate-y-2 transition-transform duration-500">
                    {sector.title}
                  </h3>
                  <div className={["overflow-hidden transition-all duration-500", "md:h-0 md:opacity-0 md:group-hover:h-auto md:group-hover:opacity-100", activeSector === index ? "h-auto opacity-100 mt-4" : "h-0 opacity-0 mt-0"].join(" ")}>
                    <p className="font-serif italic text-sm text-stone-100 leading-relaxed max-w-[250px]">
                      {sector.description}
                    </p>
                  </div>
                </div>

                {/* Project count badge 
                <div className={["absolute top-4", lang === "ar" ? "left-4" : "right-4"].join(" ")}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                    {projectCount} {t.projects}
                  </span>
                </div>
                */}
              </div>
            );
          })}
        </div>

        {/* Partner note — back inside container */}
        <div className="container mx-auto px-6 md:px-12">
          <div className="mt-20 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
            {t.partners.map((p, i) => (
              <React.Fragment key={p}>
                <span className="font-sans font-bold text-[10px] uppercase tracking-[0.4em]">{p}</span>
                {i < t.partners.length - 1 && (
                  <span className="w-1 h-1 bg-stone-400 rounded-full hidden md:inline-block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {openSector && (
        <SectorModal sector={openSector} onClose={() => setOpenSector(null)} lang={lang} />
      )}
    </>
  );
};

export default Environments;