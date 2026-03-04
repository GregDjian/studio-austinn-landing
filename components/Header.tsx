import React, { useEffect, useRef, useState } from "react";
import { NavItem, Language } from "../types";
import { Menu, X, Globe } from "lucide-react";
import { useIsScrolling } from "../hooks/useIsScrolling";

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

const getNavItems = (lang: Language): NavItem[] => {
  if (lang === "ar") {
    return [
      { label: "الفلسفة", href: "#philosophy" },
      { label: "الكتالوج", href: "#services" },
      { label: "مختارات", href: "#artists" },
      { label: "المساحات", href: "#spaces" },
    ];
  }
  return [
    { label: "Philosophy", href: "#philosophy" },
    { label: "Catalogue", href: "#services" },
    { label: "Featured", href: "#artists" },
    { label: "Spaces", href: "#spaces" },
  ];
};

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      contact: "تواصل",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      switchTo: "English",
    };
  }
  return {
    contact: "Contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchTo: "Arabic",
  };
};

const SCROLL_THRESHOLD = 50;

const Header: React.FC<HeaderProps> = ({ lang, setLang }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScrolling = useIsScrolling(120);

  const scrolledRef = useRef(false);
  const navItems = getNavItems(lang);
  const t = getContent(lang);

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

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  return (
    <>
      <header
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={[
          "fixed top-0 left-0 w-full z-50",
          "transition-[padding,color] duration-500 ease-out",
          isSolid ? "py-4 mix-blend-normal" : "py-8",
        ].join(" ")}
      >
        {/* Background layer */}
        <div
          className={[
            "absolute inset-0 -z-10 transition-opacity duration-300",
            isSolid ? "opacity-100" : "opacity-0",
            // KEY: no backdrop-blur while actively scrolling
            isSolid ? (isScrolling ? "bg-white/85" : "bg-white/70 backdrop-blur-md") : "",
          ].join(" ")}
        />

        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <a href="#" className="relative z-50">
            <img
              src="/logo/SA_logo.png"
              alt="Studio Austinn"
              className="h-16 md:h-20 w-auto"
              draggable={false}
            />
          </a>

          <nav className="hidden md:flex gap-12 items-center">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={[
                  "text-[10px] font-bold uppercase tracking-[0.2em] relative group overflow-hidden transition-colors duration-300",
                  isSolid ? "text-stone-900 hover:text-stone-600" : "text-black/90 hover:text-black",
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

            {/* Language switcher */}
            <div
              className={[
                "flex items-center gap-4",
                "border-l border-stone-300 pl-4 ml-4",
                "rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:ml-0 rtl:pr-4 rtl:mr-4",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={toggleLang}
                className={[
                  "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                  isSolid ? "text-stone-900" : "text-black",
                ].join(" ")}
              >
                <Globe size={14} />
                {t.switchTo}
              </button>
            </div>

            {/* Contact button */}
            <a
              href="#contact"
              className={[
                "px-6 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                isSolid
                  ? "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white"
                  : "border-black text-black hover:bg-white hover:text-stone-900 hover:border-white",
              ].join(" ")}
            >
              {t.contact}
            </a>
          </nav>

          <button
            className={["md:hidden z-50 transition-colors", isSolid ? "text-stone-600" : "text-black"].join(" ")}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={[
          "fixed inset-0 bg-stone-50 z-40 flex flex-col justify-center items-center gap-8",
          "transition-all duration-700 ease-in-out",
          mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none",
        ].join(" ")}
      >
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className="font-sans font-black text-2xl uppercase tracking-tighter text-stone-800 hover:text-stone-500 transition-colors"
          >
            {item.label}
          </a>
        ))}

        {/* Mobile language switch */}
        <button
          type="button"
          onClick={toggleLang}
          className={[
            "flex items-center gap-2 text-[14px] font-bold uppercase tracking-widest transition-colors mt-8",
            isSolid ? "text-stone-900" : "text-black",
          ].join(" ")}
        >
          <Globe size={20} />
          {t.switchTo}
        </button>

        <a
          href="#contact"
          className={[
            "px-6 py-2 border text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
            isSolid
              ? "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white"
              : "border-black text-black hover:bg-white hover:text-stone-900 hover:border-white",
          ].join(" ")}
        >
          {t.contact}
        </a>
      </div>
    </>
  );
};

export default Header;
