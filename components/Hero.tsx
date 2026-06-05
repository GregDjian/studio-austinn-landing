import React, { useEffect, useRef } from "react";
import { Language } from "../types";
import heroImg from "../public/cover/heroImg.jpeg";

const Hero: React.FC<{ lang: Language }> = ({ lang }) => {
  const parallaxRef = useRef<HTMLDivElement>(null);

  const isAr = lang === "ar";

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.15}px) scale(1.05)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      aria-label={isAr ? "الصفحة الرئيسية - ستوديو أوستن" : "Studio Austinn — Bespoke Art Dubai"}
      className="relative w-full h-screen min-h-[700px] overflow-hidden"
    >
      {/* Full background image with parallax */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 z-0 will-change-transform scale-105"
        style={{ transformOrigin: "center center" }}
      >
        <img
          src={heroImg}
          alt="Studio Austinn — Bespoke art installations and sculptures for luxury spaces in Dubai, UAE"
          fetchPriority="high"
          decoding="sync"
          width={1920}
          height={1080}
          draggable={false}
          className="w-full h-full object-cover object-[25%] md:object-center pointer-events-none select-none"
        />
      </div>

      {/* Dark overlay — stronger on the right (text side) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-l from-black/90 via-black/0 to-transparent" />
      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/60 to-transparent z-10" />

      {/* Content — always LTR so text stays on the right */}
      <div
        dir="ltr"
        className="relative z-20 w-full h-full flex flex-col justify-center items-end px-6 md:px-20"
      >
        <div className="text-right max-w-[560px] mt-20 md:mt-0">
          {/* Eyebrow */}
          <p
            className={[
              "font-sans text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-white/60 mb-6 md:mb-8",
              "opacity-0 animate-blur-in",
              isAr ? "tracking-[0.25em]" : "",
            ].join(" ")}
            style={{ animationDelay: "0.2s" }}
          >
            {isAr ? "أعمال فنية حصرية لمساحات استثنائية" : "Bespoke Art for Exceptional Spaces"}
          </p>

          {/* Headline */}
          <h1
            dir={isAr ? "rtl" : "ltr"}
            className="flex flex-col items-end leading-[0.85] tracking-tight font-sans font-black text-white"
          >
            <span
              className="text-[12vw] md:text-[6vw] opacity-0 animate-blur-in"
              style={{ animationDelay: "0.4s" }}
            >
              {isAr ? "رفيقك" : "YOUR CREATIVE"}
            </span>
            <span
              className="text-[12vw] md:text-[6vw] opacity-0 animate-blur-in"
              style={{ animationDelay: "0.6s" }}
            >
              {isAr ? "الإبداعي" : "COMPANION"}
            </span>
          </h1>

          {/* Visually hidden SEO description */}
          <p className="sr-only">
            {isAr
              ? "ستوديو أوستن — منحوتات ولوحات وتركيبات فنية مخصصة للفلل الخاصة والفنادق والمساحات الفاخرة في الإمارات"
              : "Studio Austinn — Bespoke sculptures, paintings and art installations for private villas, hotels and luxury spaces across the UAE"}
          </p>
        </div>
      </div>

      {/* Explore indicator */}
      <div
        className="absolute inset-x-0 bottom-12 z-30 flex flex-col items-center gap-2 opacity-0 animate-fade-in-up"
        style={{ animationDelay: "1.4s" }}
      >
        <div className="w-[1px] h-12 bg-white/40" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 text-center">
          {isAr ? "اكتشف" : "Explore"}
        </span>
      </div>
    </section>
  );
};

export default Hero;