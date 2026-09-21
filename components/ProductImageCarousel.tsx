import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imgUrl } from "../lib/sanityImage";

interface ProductImageCarouselProps {
  images: any[];
  title: string;
  isRtl: boolean;
}

const SWIPE_THRESHOLD_PX = 40;

// Classic one-at-a-time carousel. All slides are stacked and cross-faded, so the
// browser loads them up front and arrow clicks never flash an empty frame.
// Mobile: 4/5 frame. Desktop: fills the viewport below the navbar (7rem).
const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({ images, title, isRtl }) => {
  const [index, setIndex] = useState(0);
  const touchStartX       = useRef<number | null>(null);
  const count             = images.length;
  const multiple          = count > 1;

  const frame = "relative w-full aspect-[4/5] lg:aspect-auto lg:h-[calc(100vh-7rem)] overflow-hidden bg-stone-50";

  if (count === 0) {
    return (
      <div className={`${frame} flex items-center justify-center text-stone-300 text-xs uppercase tracking-widest`}>
        No image
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  // Arrows are positioned by screen side, so in RTL the left arrow is "next".
  const leftDelta  = isRtl ? 1 : -1;
  const rightDelta = -leftDelta;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!multiple) return;
    if (e.key === "ArrowLeft")  { e.preventDefault(); go(leftDelta); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(rightDelta); }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !multiple) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    // Swiping left reveals the slide on the right.
    go(dx < 0 ? rightDelta : leftDelta);
  };

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center " +
    "rounded-full bg-stone-50/85 text-stone-900 hover:bg-stone-50 shadow-sm " +
    "transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 " +
    "focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900";

  return (
    <div
      className={`${frame} group outline-none`}
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role={multiple ? "group" : undefined}
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label={multiple ? title : undefined}
    >
      {/* Vertical breathing room above and below the image (arrows/counter stay on the outer frame). */}
      <div className="absolute inset-x-0 top-6 bottom-6 lg:top-10 lg:bottom-10">
        {images.map((img, i) => (
          <img
            key={i}
            src={imgUrl.full(img)}
            alt={i === 0 ? title : `${title} — ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            aria-hidden={i !== index}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        ))}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => go(leftDelta)}
            aria-label={isRtl ? "Next image" : "Previous image"}
            className={`${arrowClass} left-3`}
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => go(rightDelta)}
            aria-label={isRtl ? "Previous image" : "Next image"}
            className={`${arrowClass} right-3`}
          >
            <ChevronRight size={22} strokeWidth={1.75} />
          </button>

          <span
            aria-live="polite"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-stone-50/85 text-stone-900 text-[10px] font-bold tracking-[0.2em] tabular-nums"
          >
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
};

export default ProductImageCarousel;
