import React, { useEffect, useRef } from "react";
import { useIsScrolling } from "../hooks/useIsScrolling.ts";

const Hero: React.FC = () => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isScrolling = useIsScrolling(120);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return;

    let rafId = 0;
    let current = 0;
    let target = 0;

    const parallaxFactor = 0.28; // slightly lower reduces perceived “drag”
    const ease = 0.10;           // slightly higher = catches up faster (less “laggy”)

    const animate = () => {
      current += (target - current) * ease;
      el.style.transform = `translate3d(0, ${current}px, 0)`;
      rafId = requestAnimationFrame(animate);
    };

    const onScroll = () => {
      target = window.scrollY * parallaxFactor;
    };

    onScroll();
    rafId = requestAnimationFrame(animate);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#f0f9ff]">
      {/* Cheap “cloudy” sky: radial gradients (NO filter blur, NO blend modes) */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(224 242 254), white, rgb(240 249 255))," +
            "radial-gradient(closest-side at 15% 5%, rgba(186,230,253,0.55), transparent 70%)," +
            "radial-gradient(closest-side at 85% 25%, rgba(219,234,254,0.55), transparent 70%)," +
            "radial-gradient(closest-side at 40% 90%, rgba(245,245,244,0.75), transparent 65%)"
        }}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className={[
          "relative z-10 w-full h-full flex flex-col justify-center items-center px-6",
          "will-change-transform",
          // while scrolling, avoid any blend that could trigger extra compositing
          isScrolling ? "mix-blend-normal" : ""
        ].join(" ")}
      >
        <div className="relative text-center">
          <p
            className="font-sans text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-stone-500 mb-8 animate-blur-in opacity-0"
            style={{ animationDelay: "0.2s" }}
          >
            The Sky is the Canvas
          </p>

          <h1 className="flex flex-col items-center leading-[0.85] tracking-tighter font-sans font-black text-stone-900">
            <span className="text-[14vw] md:text-[13vw] opacity-0 animate-blur-in" style={{ animationDelay: "0.4s" }}>
              STUDIO
            </span>
            <span className="text-[14vw] md:text-[13vw] opacity-0 animate-blur-in" style={{ animationDelay: "0.6s" }}>
              AUSTINN
            </span>
          </h1>

          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] opacity-0 animate-blur-in pointer-events-none"
            style={{ animationDelay: "1s" }}
          >
            <p className="font-script text-[14vw] md:text-[10vw] text-blue-900/10 -rotate-3 translate-y-4">
              Purist
            </p>
          </div>
        </div>

        <div
          className="absolute bottom-12 flex flex-col items-center gap-2 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1.4s" }}
        >
          <div className="w-[1px] h-12 bg-stone-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Explore
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-stone-50 to-transparent z-20" />
    </section>
  );
};

export default Hero;
