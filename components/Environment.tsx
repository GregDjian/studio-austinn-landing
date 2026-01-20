import React, { useState } from "react";
import { Language } from "../types";

interface Sector {
  title: string;
  category: string;
  image: string;
  description: string;
}

const getSectors = (lang: Language): Sector[] => {
  if (lang === "ar") {
    return [
      {
        title: "فلل خاصة",
        category: "سكني",
        image:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop",
        description:
          "تركيبات فنية مخصّصة صُمّمت لأرقى المساكن الخاصة في دولة الإمارات.",
      },
      {
        title: "الضيافة",
        category: "فنادق ومنتجعات",
        image:
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop",
        description:
          "إعادة صياغة تجربة الضيوف من خلال منحوتات مميّزة ومعارض فنية منسّقة.",
      },
      {
        title: "فن الطهو",
        category: "مطاعم",
        image:
          "https://images.unsplash.com/photo-1550966841-3ee4ad6b107c?q=80&w=2000&auto=format&fit=crop",
        description:
          "تعزيز السرد الذوقي عبر فنون غامرة وإضاءة مدروسة بعناية.",
      },
      {
        title: "شركاء التصميم",
        category: "معماريون",
        image:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop",
        description:
          "التعاون مع معماريين عالميين لدمج الفن منذ المراحل الأولى للتصميم.",
      },
      {
        title: "تجزئة فاخرة",
        category: "مراكز تسوق وبوتيكات",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
        description:
          "ابتكار تجارب علامية غامرة من خلال التقاء الفن والتجارة.",
      },
      {
        title: "مساحات عامة",
        category: "مدنية ومؤسسية",
        image:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop",
        description:
          "تركيبات واسعة النطاق تعيد تعريف المشهد العام وبيئات العمل.",
      },
    ];
  }

  return [
    {
      title: "Private Villas",
      category: "Residential",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop",
      description:
        "Bespoke art installations tailored for the most exclusive residences in the UAE.",
    },
    {
      title: "Hospitality",
      category: "Hotels & Resorts",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop",
      description:
        "Transforming guest experiences with statement sculptures and curated galleries.",
    },
    {
      title: "Gastronomy",
      category: "Restaurants",
      image:
        "https://images.unsplash.com/photo-1550966841-3ee4ad6b107c?q=80&w=2000&auto=format&fit=crop",
      description:
        "Enhancing culinary narratives through atmospheric art and lighting.",
    },
    {
      title: "Design Partners",
      category: "Architects",
      image:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop",
      description:
        "Collaborating with world-class architects to integrate art from the blueprint phase.",
    },
    {
      title: "Luxury Retail",
      category: "Malls & Boutiques",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
      description:
        "Creating immersive brand experiences through artistic commerce.",
    },
    {
      title: "Public Spaces",
      category: "Civic & Corporate",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop",
      description:
        "Large-scale installations that redefine public landscapes and workspaces.",
    },
  ];
};

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      ecosystem: "المنظومة",
      titleTop: "حيث",
      titleBottom: "يسكن الفن",
      subtitle:
        "من الملاذات الخاصة الحميمة إلى المعالم العامة الواسعة.",
      partners: ["معماريون", "مطوّرون", "مصمّمون", "مالكون"],
    };
  }

  return {
    ecosystem: "Ecosystem",
    titleTop: "Where Art",
    titleBottom: "Resides",
    subtitle:
      "From intimate private sanctuaries to expansive public landmarks.",
    partners: ["Architects", "Developers", "Designers", "Proprietors"],
  };
};

const Environments: React.FC<{ lang: Language }> = ({ lang }) => {
  const [activeSector, setActiveSector] = useState<number | null>(null);
  const sectors = getSectors(lang);
  const t = getContent(lang);

  return (
    <section
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
                "font-sans font-black text-5xl md:text-7xl uppercase tracking-tighter text-stone-900 leading-none",
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
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] group overflow-hidden bg-stone-200 cursor-crosshair"
              onMouseEnter={() => setActiveSector(index)}
              onMouseLeave={() => setActiveSector(null)}
            >
              <img
                src={sector.image}
                alt={sector.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out grayscale group-hover:grayscale-0 group-hover:scale-105 ${
                  activeSector === index ? "opacity-100" : "opacity-40"
                }`}
              />

              <div className="absolute inset-0 bg-stone-900/40 group-hover:bg-stone-900/10 transition-colors duration-700" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                  {sector.category}
                </span>
                <h3 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-tighter group-hover:-translate-y-2 transition-transform duration-500">
                  {sector.title}
                </h3>

                <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                  <p className="font-serif italic text-sm mt-4 text-stone-100 leading-relaxed max-w-[250px]">
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
          ))}
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
