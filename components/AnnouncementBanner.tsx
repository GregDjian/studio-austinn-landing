import React, { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Language } from "../types";
import { SHOW_ARTISTIC_PARTITIONS } from "../lib/shopConfig";

// Session-scoped: stays closed while the visitor browses around, reappears on a
// fresh visit / new tab.
const STORAGE_KEY = "sa_announcement_dismissed";

// Fixed bar height. The header reads this via the --sa-banner-h CSS variable and
// sits directly beneath the bar; when the bar closes the header slides back up.
// Taller on small screens for an easier tap target.
const BAR_HEIGHT        = "2.25rem"; // 36px — keep in sync with sm:h-9 below
const BAR_HEIGHT_MOBILE = "3.5rem";  // 56px — keep in sync with h-14 below
const DESKTOP_QUERY     = "(min-width: 640px)"; // Tailwind `sm`

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      message:      SHOW_ARTISTIC_PARTITIONS
        ? "متجرنا مفتوح الآن — اكتشف أورا لينك وفواصلنا الفنية"
        : "متجرنا مفتوح الآن — اكتشف أورا لينك",
      messageShort: "متجرنا مفتوح الآن",
      cta:          "تسوّق الآن",
      dismiss:      "إغلاق الإعلان",
      region:       "إعلان",
    };
  }
  return {
    message:      SHOW_ARTISTIC_PARTITIONS
      ? "Our Shop is now open — discover our Aura Links and Artistic Partitions"
      : "Our Shop is now open — discover our Aura Links",
    messageShort: "Our Shop is now open",
    cta:          "Shop Now",
    dismiss:      "Dismiss announcement",
    region:       "Announcement",
  };
};

/**
 * Slim announcement bar pinned to the very top of the viewport (position:fixed),
 * staying visible while the page scrolls until dismissed. Homepage-only — it is
 * rendered by <HomePage>, so it never appears on shop / product / other routes.
 * It publishes its height as `--sa-banner-h`; the header uses that to offset its
 * own `top`, so the navbar sits just below the bar and slides up when it closes.
 */
const AnnouncementBanner: React.FC<{ lang: Language }> = ({ lang }) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [leaving, setLeaving] = useState(false);
  const t = getContent(lang);

  // Drive the header offset. Kept at BAR_HEIGHT only while the bar is actually
  // on screen; reset to 0 on dismiss and on unmount (route change).
  // Follows the sm breakpoint so the offset matches the bar's responsive height.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const onScreen = !dismissed && !leaving;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const apply = () =>
      root.style.setProperty(
        "--sa-banner-h",
        onScreen ? (mq.matches ? BAR_HEIGHT : BAR_HEIGHT_MOBILE) : "0px",
      );
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      root.style.setProperty("--sa-banner-h", "0px");
    };
  }, [dismissed, leaving]);

  if (dismissed) return null;

  const close = () => {
    setLeaving(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode / storage disabled — dismiss for this view only */
    }
    setTimeout(() => setDismissed(true), 300);
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      role="region"
      aria-label={t.region}
      className={[
        "fixed top-0 inset-x-0 z-40 w-full h-14 sm:h-9 flex items-center overflow-hidden",
        "bg-stone-100/95 backdrop-blur-sm border-b border-stone-200/70",
        "transition-opacity duration-300 ease-out",
        leaving ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <div className="relative w-full flex items-center justify-center px-9">
        <p className="text-center text-[11px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-tight text-stone-700 leading-none">
          <span className="sm:hidden">{t.messageShort}</span>
          <span className="hidden sm:inline">{t.message}</span>{" "}
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 text-stone-900 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-900 transition-colors"
          >
            {t.cta}
            <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
          </Link>
        </p>

        <button
          type="button"
          onClick={close}
          aria-label={t.dismiss}
          className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-900 transition-colors"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
