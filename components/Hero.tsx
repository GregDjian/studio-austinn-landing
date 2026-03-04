import React, { useEffect, useRef } from "react";
import { Language } from "../types";
import heroImg from "../public/cover/heroImg.png";

const Hero: React.FC<{ lang: Language }> = ({ lang }) => {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);
  const cloud3Ref = useRef<HTMLDivElement>(null);

  const isAr = lang === "ar";

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const xPos = (e.clientX / window.innerWidth - 0.5) * 2;
      const yPos = (e.clientY / window.innerHeight - 0.5) * 2;

      if (cloud1Ref.current)
        cloud1Ref.current.style.transform = `translate(${xPos * -30}px, ${yPos * -30}px)`;
      if (cloud2Ref.current)
        cloud2Ref.current.style.transform = `translate(${xPos * 40}px, ${yPos * 40}px)`;
      if (cloud3Ref.current)
        cloud3Ref.current.style.transform = `translate(${xPos * -20}px, ${yPos * -15}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#f0f9ff]"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white to-sky-50" />

        <div
          ref={cloud1Ref}
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] transition-transform duration-[2000ms] ease-out will-change-transform"
        >
          <div className="w-full h-full bg-sky-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-drift" />
        </div>

        <div
          ref={cloud2Ref}
          className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] transition-transform duration-[2500ms] ease-out will-change-transform"
        >
          <div className="w-full h-full bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[100px] animate-drift-slow" />
        </div>

        <div
          ref={cloud3Ref}
          className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] transition-transform duration-[3000ms] ease-out will-change-transform"
        >
          <div className="w-full h-full bg-stone-100/60 rounded-full mix-blend-multiply filter blur-[60px] animate-float" />
        </div>
      </div>

      {/* ✅ Keep layout LTR so title stays on the LEFT even in Arabic */}
      <div
        ref={parallaxRef}
        dir="ltr"
        className="relative z-10 w-full h-full flex flex-col justify-center items-start px-6 md:px-20 will-change-transform"
      >
        {/* TEXT */}
        <div className="relative text-center md:text-left max-w-[700px] z-10 mt-20 md:mt-0">
          <p
            className={[
              "font-sans text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-stone-500 mb-6 md:mb-8",
              "animate-blur-in opacity-0",
              // Arabic: keep the same visual spacing, but don't force uppercase
              isAr ? "tracking-[0.25em]" : "",
            ].join(" ")}
            style={{ animationDelay: "0.2s" }}
          >
            {isAr ? "السماء هي لوحتك" : "The Sky is your canvas"}
          </p>

          {/* ✅ Arabic headline translated + RTL only for the headline text */}
          <h1
            dir={isAr ? "rtl" : "ltr"}
            className={[
              "flex flex-col items-center md:items-start leading-[0.85] tracking-tight font-sans font-black text-stone-700 mix-blend-darken",
              // keep alignment visually left on desktop even if RTL text
              "text-center md:text-left",
            ].join(" ")}
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
        </div>

        {/* IMAGE */}
        <img
          src={heroImg}
          alt="Hero Sculpture"
          className="
            mt-10
            w-full max-w-[500px]
            h-auto
            object-contain
            pointer-events-none select-none
            opacity-0 animate-blur-in
            lg:absolute lg:right-0 lg:bottom-0
            lg:h-[95vh] lg:w-auto lg:max-w-none lg:mt-0
          "
          style={{ animationDelay: "0.8s" }}
          draggable={false}
        />

        {/* Explore indicator */}
        <div
          className="absolute inset-x-0 bottom-12 z-30 flex flex-col items-center gap-2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.4s" }}
        >
          <div className="w-[1px] h-12 bg-stone-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">
            {isAr ? "اكتشف" : "Explore"}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-stone-50 to-transparent z-20" />
    </section>
  );
};

export default Hero;