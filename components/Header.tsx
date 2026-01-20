import React, { useEffect, useRef, useState } from "react";
import { NavItem } from "../types";
import { Menu, X } from "lucide-react";
import { useIsScrolling } from "../hooks/useIsScrolling";

const navItems: NavItem[] = [
  { label: "Philosophy", href: "#philosophy" },
  { label: "Catalogue", href: "#services" },
  { label: "Featured", href: "#artists" },
  { label: "Spaces", href: "#spaces" }
];

const SCROLL_THRESHOLD = 50;

const Header: React.FC = () => {   
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScrolling = useIsScrolling(120);

  const scrolledRef = useRef(false);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const next = window.scrollY > SCROLL_THRESHOLD;
      if (next !== scrolledRef.current) {
        scrolledRef.current = next;
        setScrolled(next);
      }
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const isSolid = scrolled || mobileMenuOpen;

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 w-full z-50",
          "transition-[padding,color] duration-500 ease-out",
          isSolid ? "py-4 mix-blend-normal" : "py-8 mix-blend-difference text-white"
        ].join(" ")}
      >
        {/* Background layer */}
        <div
          className={[
            "absolute inset-0 -z-10 transition-opacity duration-300",
            isSolid ? "opacity-100" : "opacity-0",
            // KEY: no backdrop-blur while actively scrolling
            isSolid
              ? (isScrolling ? "bg-white/85" : "bg-white/70 backdrop-blur-md")
              : ""
          ].join(" ")}
        />

        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <a
            href="#"
            className={[
              "group relative z-50 transition-colors duration-300",
              isSolid ? "text-stone-900" : "text-white"
            ].join(" ")}
          >
            <div className="flex flex-col items-start leading-none">
              <span className="font-sans font-black text-2xl uppercase tracking-tighter">Studio</span>
              <span className="font-script text-3xl -translate-y-2 translate-x-4">Austinn</span>
            </div>
          </a>

          <nav className="hidden md:flex gap-12 items-center">
  {navItems.map((item) => (
    <a
      key={item.label}
      href={item.href}
      className={[
        "text-[10px] font-bold uppercase tracking-[0.2em] relative group overflow-hidden transition-colors duration-300",
        isSolid ? "text-stone-900 hover:text-stone-600" : "text-white/90 hover:text-white",
      ].join(" ")}
    >
      <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">
        {item.label}
      </span>
      <span className="absolute top-full left-0 transition-transform duration-300 group-hover:-translate-y-full">
        {item.label}
      </span>
    </a>
  ))}

  {/* Contact button */}
  <a
    href="#contact"
    className={[
      "px-6 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
      isSolid
        ? "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white"
        : "border-white text-white hover:bg-white hover:text-stone-900 hover:border-white",
    ].join(" ")}
  >
    Contact
  </a>
</nav>


          <button
            className={["md:hidden z-50 transition-colors", isSolid ? "text-stone-900" : "text-white"].join(" ")}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div
        className={[
          "fixed inset-0 bg-stone-50 z-40 flex flex-col justify-center items-center gap-8",
          "transition-all duration-700 ease-in-out",
          mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        ].join(" ")}
      >
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className="font-sans font-black text-4xl uppercase tracking-tighter text-stone-900 hover:text-stone-500 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>
    </>
  );
};

export default Header;
