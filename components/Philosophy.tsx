import React from "react";
import { Language } from "../types";
import Owner from "../public/philo/artistProfile.jpeg";
import studio1 from "../public/philo/studio1.jpeg";
import studio2 from "../public/philo/studio2.jpeg";

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      behind: "خلف",
      titleTop: "لوحة",
      titleBottom: "القصة",
      founderName: "Marine Bordier-Cros",
      founderRole: "المؤسِّسة",
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

  return (
    <section
      id="philosophy"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative py-16 md:py-16 bg-stone-50 overflow-hidden"
      aria-label={t.meta}
    >
      {/* ✅ ORIGINAL WHITE/BLUISH AMBIENT BACKGROUND */}
      <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-sky-100/50 rounded-full blur-[130px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-stone-200/35 rounded-full blur-[110px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Modern subtle upgrades (same vibe): grain + thin grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(0,0,0,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.25)_1px,transparent_1px)] [background-size:84px_84px]" />
        <div className="absolute inset-0 opacity-[0.08] mix-blend-multiply [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 mt-14">
        {/* ✅ IMPORTANT: items-stretch so both columns share the same row height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* ===== Left: Title + Founder (image grows to match right column height) ===== */}
          <div className="lg:col-span-5 flex">
            {/* keep sticky, but allow full height */}
            <div className="lg:sticky lg:top-24 h-full w-full flex flex-col">
              {/* Title */}
              <div className="relative mb-12">
                <span
                  className={[
                    "font-script text-8xl md:text-9xl text-stone-300 absolute -top-14 z-0 opacity-60 mix-blend-multiply select-none",
                    lang === "ar" ? "right-0 md:-right-6" : "left-0 md:-left-6",
                  ].join(" ")}
                >
                  {t.behind}
                </span>

                <h2 className="relative z-10 font-sans font-black text-6xl md:text-6xl leading-[0.85] text-stone-900 uppercase tracking-tighter">
                  {t.titleTop} <br /> {t.titleBottom}
                </h2>
              </div>

              {/* ✅ Founder card fills remaining height (so bottoms align) */}
              <div className="mt-0 flex-1 flex">
                <div className="w-full rounded-[8px] overflow-hidden border border-stone-900/10 bg-white shadow-[0_35px_90px_-70px_rgba(0,0,0,0.28)] flex flex-col">
                  {/* ✅ image grows: remove aspect ratio, use flex-1 */}
                  <div className="relative flex-1 min-h-[340px] overflow-hidden">
                    <img
                      src={Owner}
                      alt={`${t.founderName} - ${t.founderRole}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-[1.05]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-white/10 pointer-events-none" />
                  </div>

                  {/* footer stays fixed */}
                  <div className="p-6 flex items-center justify-between gap-6 shrink-0">
                    <div>
                      <p className="text-stone-950 font-semibold tracking-[-0.02em] text-lg">
                        {t.founderName}
                      </p>
                    </div>

                    <span className="rounded-full border border-stone-900/10 bg-stone-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-600">
                      {t.founderRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Right: Made in UAE + gallery ===== */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-[8px] border backdrop-blur-xl p-8 md:p-10 shadow-[0_35px_90px_-70px_rgba(0,0,0,0.30)]">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <p className="text-stone-800 text-base md:text-lg leading-relaxed">
                  {t.introQuote}
                </p>

                <div>
                  <p className="text-stone-500 text-xs uppercase tracking-[0.32em]">
                    {t.made}
                  </p>
                  <h3 className="mt-2 text-stone-950 text-3xl md:text-4xl font-semibold tracking-[-0.05em]">
                    {t.inUae}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1 w-12 rounded-full bg-gradient-to-r from-sky-400/70 via-indigo-400/60 to-emerald-300/70" />
                  <span className="text-stone-500 text-xs uppercase tracking-[0.30em]">
                    Local craft
                  </span>
                </div>
              </div>

              <p
                className="mt-4 text-stone-800 text-base md:text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t.madeDesc }}
              />

              <div className="mt-8 grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-7">
                  <div className="group relative overflow-hidden rounded-[8px] border border-stone-900/10 bg-white">
                    <div className="aspect-[16/11] md:aspect-[4/3] overflow-hidden">
                      <img
                        src={studio1}
                        alt={t.imgAlt1}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="rounded-[8px] border border-white/50 bg-white/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
                        <p className="text-stone-700 text-xs uppercase tracking-[0.26em]">
                          {t.imgAlt1}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-5">
                  <div className="group relative overflow-hidden rounded-[8px] border border-stone-900/10 bg-white h-full">
                    <div className="aspect-[16/11] md:aspect-[4/3] overflow-hidden h-full">
                      <img
                        src={studio2}
                        alt={t.imgAlt2}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="rounded-[8px] border border-white/50 bg-white/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
                        <p className="text-stone-700 text-xs uppercase tracking-[0.26em]">
                          {t.imgAlt2}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer line */}
              <div className="mt-8 flex items-center gap-4">
                <span className="h-[2px] w-12 bg-stone-950/70" />
                <p className="text-stone-600 text-sm">{t.footer}</p>
              </div>
            </div>

            {/*
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { k: "01", v: t.chip1 },
                { k: "02", v: t.chip2 },
                { k: "03", v: t.chip3 },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-[12px] border border-stone-900/10 bg-white/70 backdrop-blur-xl p-5 shadow-[0_25px_70px_-60px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-stone-500 text-xs uppercase tracking-[0.34em]">
                      {item.k}
                    </p>
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500/40" />
                  </div>

                  <p className="mt-2 text-stone-950 text-lg font-semibold tracking-[-0.03em]">
                    {item.v}
                  </p>

                  <div className="mt-4 h-px w-full bg-stone-900/10" />

                  <p className="mt-3 text-stone-600 text-sm leading-relaxed">
                    {lang === "ar"
                      ? "نهج معاصر مع عناية بالتفاصيل."
                      : "Contemporary approach with obsessive detail."}
                  </p>
                </div>
              ))}
            </div>
            */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;