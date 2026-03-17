import React from "react";
import { Language } from "../types";
import Owner from "../public/philo/philosophy.jpeg";

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      behind: "خلف",
      titleTop: "لوحة",
      titleBottom: "القصة",
      founderName: "Marine Bordier-Cros",
      founderRole: "المؤسِّسة",
      introQuote:
        "لطالما كان الفن في قلب حياتي. بدأت رحلتي بدراسة تاريخ الفن وعلم الآثار، وهو ما منحني تقديراً عميقاً للقصص التي يمكن للفن أن يرويها.",
      made: "صُنع",
      inUae: "في الإمارات",
      madeDesc:
        "يقع استوديو أوستن في قلب <strong class='text-stone-950'>القوز</strong>، حيث تتشكّل الأفكار إلى أعمال ملموسة. نتعاون مع حرفيين مهرة ومورّدين محليين لضمان أعلى درجات الإتقان.",
      imgAlt1: "تفاصيل من الورشة",
      imgAlt2: "الخامات",
      meta: "فلسفة الاستوديو",
      chip1: "تصميم",
      chip2: "مواد",
      chip3: "تنفيذ",
      footer: "من الفكرة إلى القطعة النهائية — كل خطوة تُصنع بعناية.",
    };
  }

  return {
    behind: "Behind",
    titleTop: "The",
    titleBottom: "Canvas",
    founderName: "Marine Bordier-Cros",
    founderRole: "Founder",
    introQuote:
      "Art has always been at the heart of my life. My journey began with studies in art history & archaeology, giving me a deep appreciation for the stories art can tell.",
    made: "Made",
    inUae: "In U.A.E.",
    madeDesc:
      'Located in the heart of <strong class="text-stone-950">Al Quoz</strong>, our studio is where creativity takes shape. We collaborate with skilled artisans and local suppliers to ensure exceptional craftsmanship.',
    imgAlt1: "The Studio",
    imgAlt2: "Atelier",
    meta: "Studio philosophy",
    chip1: "Design",
    chip2: "Materials",
    chip3: "Craft",
    footer: "From concept to final piece — every step is crafted with care.",
  };
};

const Philosophy: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = getContent(lang);
  const isAr = lang === "ar";

  return (
    <section
      id="philosophy"
      dir={isAr ? "rtl" : "ltr"}
      className="relative bg-stone-50 overflow-hidden"
      aria-label={t.meta}
    >
      <div className={`flex flex-col-reverse ${isAr ? "lg:flex-row-reverse" : "lg:flex-row"} min-h-[70vh]`}>

        {/* ── LEFT: Content ── */}
        <div className="relative w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-14 lg:px-16 py-20 pb-8 lg:py-22 lg:pb-22 bg-stone-50">

          {/* Ambient blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stone-200/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none [background-image:linear-gradient(to_right,rgba(0,0,0,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.3)_1px,transparent_1px)] [background-size:72px_72px]" />

          <div className="relative z-10 max-w-lg">

            {/* Title */}
            <div className="relative mb-10">
              <span
                className={[
                  "font-script text-6xl md:text-8xl text-stone-200 absolute -top-8 md:-top-10 z-0 select-none pointer-events-none",
                  isAr ? "right-0" : "-left-3",
                ].join(" ")}
              >
                {t.behind}
              </span>
              <h2 className="relative z-10 font-sans font-black text-5xl md:text-6xl leading-[0.85] text-stone-900 uppercase tracking-tighter">
                {t.titleTop} <br />
                <span className="text-stone-400">{t.titleBottom}</span>
              </h2>
            </div>

            {/* image on mobile view only */}
            <div className="relative w-full lg:w-1/2 h-[60vw] lg:h-auto lg:min-h-[70vh] mb-4 overflow-hidden block lg:hidden">
              <img
                src={Owner}
                alt={`${t.founderName} - ${t.founderRole}`}
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
              />
              {/* subtle gradient at bottom to blend into right panel on mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-50/60 via-transparent to-transparent lg:hidden" />
              {/* vertical gradient on the inner edge for desktop */}
              <div className={`hidden lg:block absolute inset-y-0 w-32 bg-gradient-to-${isAr ? "l" : "r"} from-transparent to-stone-50/20 ${isAr ? "left-0" : "right-0"}`} />

              {/* Founder badge — pinned to bottom left */}
              <div className={`absolute bottom-8 ${isAr ? "right-8" : "left-8"} z-10`}>
                <div className="rounded-[8px] border border-white/40 bg-white/20 backdrop-blur-md px-5 py-3 flex items-center gap-4 shadow-lg">
                  <div>
                    <p className="text-white font-semibold tracking-tight text-sm">{t.founderName}</p>
                  </div>
                  <span className="rounded-full border border-white/50 bg-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-white">
                    {t.founderRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Intro quote */}
            <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-8 border-l-2 border-stone-300 pl-5 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-5">
              {t.introQuote}
            </p>

            {/* Made desc */}
            <p
              className="text-stone-600 text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t.madeDesc }}
            />
            
            {/* Footer line */}
            <div className="flex items-center gap-4 pt-4">
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">{t.footer}</p>
            </div>

            {/* Made in UAE badge */}
            <div className="flex items-end justify-center md:justify-start gap-4 mt-8 border-t border-stone-200 pt-4">
              <div>
                <strong className="text-stone-950 text-[22px]"> <span>{t.made}</span> {t.inUae}</strong>
              </div>
            </div>

          </div>
        </div>


        {/* ── RIGHT: Full-bleed image ── */}
        <div className="relative w-full lg:w-1/2 h-[60vw] lg:h-auto lg:min-h-[70vh] overflow-hidden hidden lg:block">
          <img
            src={Owner}
            alt={`${t.founderName} - ${t.founderRole}`}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="lazy"
          />
          {/* subtle gradient at bottom to blend into right panel on mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50/60 via-transparent to-transparent lg:hidden" />
          {/* vertical gradient on the inner edge for desktop */}
          <div className={`hidden lg:block absolute inset-y-0 w-32 bg-gradient-to-${isAr ? "l" : "r"} from-transparent to-stone-50/20 ${isAr ? "left-0" : "right-0"}`} />

          {/* Founder badge — pinned to bottom left */}
          <div className={`absolute bottom-8 ${isAr ? "right-8" : "left-8"} z-10`}>
            <div className="rounded-[8px] border border-white/40 bg-white/20 backdrop-blur-md px-5 py-3 flex items-center gap-4 shadow-lg">
              <div>
                <p className="text-white font-semibold tracking-tight text-sm">{t.founderName}</p>
              </div>
              <span className="rounded-full border border-white/50 bg-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-white">
                {t.founderRole}
              </span>
            </div>
          </div>
        </div>

        
      </div>
    </section>
  );
};

export default Philosophy;