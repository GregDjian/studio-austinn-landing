import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDeliveryPolicy } from "./DeliveryReturnsModal";
import { Plus, X, RotateCcw } from "lucide-react";
import { toJpeg } from "html-to-image";
import { Language, ColorOption } from "../types";
import { imgUrl } from "../lib/sanityImage";

// ─── Visual tuning ────────────────────────────────────────────────────────────
const LINK_OVERLAP_PX = 36;        // mount → first real link, and link → link
const PLACEHOLDER_OVERLAP_PX = 16; // mount → placeholder boxes (empty column / new-column ghost)
const PLACEHOLDER_MOUNT_OFFSET_PX = 0;    // vertical nudge for the mount image inside the "New Column" ghost (positive = down)
const REAL_COLUMN_MOUNT_OFFSET_PX = 22;   // vertical nudge for the mount image above a real column's first link (positive = down)
const ROOM_BACKGROUND_IMG = "/room-background.png"; // preview canvas backdrop (public folder)
const ROOM_BACKGROUND_ASPECT = "1536 / 1024";        // natural size of the photo — the base canvas keeps this ratio so it's never cropped
const ROOM_WALL_COLOR = "#d4cac2";                   // wall tone along the photo's top edge — fills the canvas above the photo when the chain outgrows it
const SIDE_VIEW_LAYER_BASE = 10000; // side view links stack above every face view link (which use 1, 2, 3…)
const SIDE_VIEW_SCALE = 0.82;       // side view links render slightly smaller than face view (1 = same width as face)
const REMOVE_BUTTON_LAYER = 100000; // remove (✕) buttons rise above all links so none is ever covered
const MAX_COLUMNS = 8;             // no "New Column" placeholder once this many columns exist (links per column stay unlimited)
const MOUNT_IMG = "/chain-mount.png";
const MOUNT_W = 36; // px — adjust if the physical stud needs to be bigger/smaller
const POPOVER_WIDTH_ESTIMATE = 172; // fallback width used before the popover has mounted/measured
const POPOVER_HEIGHT_ESTIMATE = 200; // fallback height used before the popover has mounted/measured
const POPOVER_VIEWPORT_MARGIN = 8;  // min gap kept between popover and viewport edge
const PLACEHOLDER_GLOW = "180, 137, 84"; // warm brass-toned rgb triplet used for the placeholder hover/active glow ring
// ─────────────────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkSlot {
  id: string;
  colorOptionId: string;
}

interface ColumnState {
  id: string;
  links: LinkSlot[];
}

export interface ColorSummaryEntry {
  colorOptionId: string;
  colorName: string;
  count: number;
}

export interface ChainConfig {
  columns: { links: Array<{ colorOptionId: string; colorName: string }> }[];
  totalLinks: number;
  lineTotal: number;
  colorSummary: ColorSummaryEntry[];
  /** JPEG data URL of the finished design (mounts + links on the room photo, no UI). Absent if capture failed. */
  previewImage?: string;
}

interface ChainBuilderProps {
  colorOptions: ColorOption[];
  pricePerLink: number;
  currency: string;
  lang: Language;
  justAdded?: boolean;
  onAddToCart: (config: ChainConfig) => void;
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      buildNote: "اضغط في أي عمود لإضافة حلقة — سلسلتك تتحدّث مع بنائك",
      addColumn: "عمود جديد",
      addLink: "إضافة حلقة",
      addFirstLink: "إضافة حلقة",
      removeColumn: "حذف العمود",
      removeLink: "حذف الحلقة",
      column: "عمود",
      total: "الإجمالي",
      perLink: "/ حلقة",
      addToCart: "أضف إلى السلة",
      trustPrefix: "بإتمام طلبك، أنت توافق على",
      termsLink: "سياسة التوصيل والإرجاع",
      added: "تمت الإضافة ✓",
      emptyPreview: "أضف عموداً للبدء",
      chooseColor: "اختر اللون",
      links: "حلقات",
      preview: "معاينة",
      cancel: "إلغاء",
      reset: "البدء من جديد",
      resetConfirm: "إعادة تعيين التصميم؟",
      resetConfirmYes: "نعم، إعادة التعيين",
    };
  }
  return {
    buildNote: "Tap any column to add a link — your chain updates as you build it",
    addColumn: "New Column",
    addLink: "Add Link",
    addFirstLink: "Add Link",
    removeColumn: "Remove column",
    removeLink: "Remove link",
    column: "Col",
    total: "Total",
    perLink: "/ link",
    addToCart: "Add to Cart",
    trustPrefix: "By placing your order you agree to the",
    termsLink: "delivery & returns policy",
    added: "Added ✓",
    emptyPreview: "Add a column to start building",
    chooseColor: "Choose colour",
    links: "links",
    preview: "Preview",
    cancel: "Cancel",
    reset: "Start Over",
    resetConfirm: "Reset your build?",
    resetConfirmYes: "Yes, reset",
  };
};

// ── Component ─────────────────────────────────────────────────────────────────

const ChainBuilder: React.FC<ChainBuilderProps> = ({
  colorOptions,
  pricePerLink,
  currency,
  lang,
  justAdded,
  onAddToCart,
}) => {
  const t = getContent(lang);

  const [columns, setColumns] = useState<ColumnState[]>([{ id: uid(), links: [] }]);
  const [addPickerColId, setAddPickerColId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  // Set right after a brand-new column is created so we can auto-open its
  // add-link picker once the column's own button has actually mounted
  // (it doesn't exist yet at the moment "New Column" is clicked).
  const [pendingAutoOpenColId, setPendingAutoOpenColId] = useState<string | null>(null);
  const builderRef = useRef<HTMLDivElement>(null);
  const openDeliveryPolicy = useDeliveryPolicy();
  // Canvas growth: the photo layer keeps its base size (3:2 desktop / 75svh mobile) pinned
  // to the bottom; when the chain makes the canvas taller, `canvasExtended` turns on a
  // soft fade at the photo's top edge so the wall colour above it blends in.
  const canvasRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [canvasExtended, setCanvasExtended] = useState(false);
  // Cart preview image: an off-screen, UI-free render of the design captured on Add to Cart.
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  // Popover is portaled to document.body (so it can escape the scrollable
  // preview canvas — see FIX 1), so it needs its own anchor/position tracking
  // instead of being positioned via normal CSS flow relative to its column.
  const anchorElRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Tracks each column's add-link button by column id, so a just-created
  // column's button can be located as soon as it mounts.
  const linkButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const closePicker = () => {
    setAddPickerColId(null);
    setPopoverPos(null);
    anchorElRef.current = null;
  };

  const computePopoverPosition = (anchor: HTMLElement, popoverWidth: number) => {
    const rect = anchor.getBoundingClientRect();
    const rawLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    const left = Math.min(
      Math.max(rawLeft, POPOVER_VIEWPORT_MARGIN),
      window.innerWidth - popoverWidth - POPOVER_VIEWPORT_MARGIN
    );
    // Prefer below the anchor; if that runs off the bottom of the screen, flip above it;
    // if neither fits, hold it inside the screen edge.
    const height = popoverRef.current?.offsetHeight ?? POPOVER_HEIGHT_ESTIMATE;
    const below = rect.bottom + 8;
    let top = below;
    if (below + height > window.innerHeight - POPOVER_VIEWPORT_MARGIN) {
      const above = rect.top - 8 - height;
      top = above >= POPOVER_VIEWPORT_MARGIN
        ? above
        : Math.max(POPOVER_VIEWPORT_MARGIN, window.innerHeight - POPOVER_VIEWPORT_MARGIN - height);
    }
    return { top, left };
  };

  useEffect(() => {
    // Portaled popover lives outside builderRef in the DOM, so it must be
    // treated as "inside" here too, or clicking a swatch would register as
    // an outside click (via mousedown, before the swatch's onClick fires)
    // and close the picker before the selection registers.
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBuilder = builderRef.current?.contains(target);
      const insidePopover = popoverRef.current?.contains(target);
      if (!insideBuilder && !insidePopover) {
        closePicker();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Detect when the canvas is taller than the base photo layer.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    if (!canvas || !photo) return;
    const update = () => setCanvasExtended(canvas.clientHeight - photo.offsetHeight > 2);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    ro.observe(photo);
    return () => ro.disconnect();
  }, []);

  // Keep the popover pinned to its trigger while open — refines the position
  // once the popover has mounted and measured its real width, and re-tracks
  // on scroll (including the horizontal-scrolling preview canvas) or resize.
  useLayoutEffect(() => {
    if (!addPickerColId || !anchorElRef.current) return;
    const anchor = anchorElRef.current;
    const update = () => {
      const width = popoverRef.current?.offsetWidth ?? POPOVER_WIDTH_ESTIMATE;
      setPopoverPos(computePopoverPosition(anchor, width));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [addPickerColId]);

  // A new column's add-link button doesn't exist until it mounts, so opening
  // its picker has to wait one render past the column being created — this
  // picks up the button as soon as it's registered in linkButtonRefs and
  // opens the picker exactly like a normal add-link click would.
  useLayoutEffect(() => {
    if (!pendingAutoOpenColId) return;
    const anchor = linkButtonRefs.current.get(pendingAutoOpenColId);
    if (anchor) {
      anchorElRef.current = anchor;
      setPopoverPos(computePopoverPosition(anchor, popoverRef.current?.offsetWidth ?? POPOVER_WIDTH_ESTIMATE));
      setAddPickerColId(pendingAutoOpenColId);
    }
    setPendingAutoOpenColId(null);
  }, [pendingAutoOpenColId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalLinks = columns.reduce((sum, col) => sum + col.links.length, 0);
  const lineTotal = totalLinks * pricePerLink;

  // ── Actions ────────────────────────────────────────────────────────────────
  const addColumn = () => {
    if (columns.length >= MAX_COLUMNS) return;
    const newId = uid();
    setColumns((prev) => [...prev, { id: newId, links: [] }]);
    setPendingAutoOpenColId(newId);
  };

  const resetBuild = () => {
    setColumns([{ id: uid(), links: [] }]);
    closePicker();
    setConfirmingReset(false);
  };

  const removeColumn = (colId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    if (addPickerColId === colId) closePicker();
  };

  const removeLink = (colId: string, linkId: string) =>
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
      )
    );

  const openAddPicker = (colId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const willOpen = addPickerColId !== colId;
    if (willOpen) {
      anchorElRef.current = e.currentTarget;
      setPopoverPos(computePopoverPosition(e.currentTarget, popoverRef.current?.offsetWidth ?? POPOVER_WIDTH_ESTIMATE));
      setAddPickerColId(colId);
    } else {
      closePicker();
    }
  };

  const commitLink = (colId: string, colorOptionId: string) => {
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId
          ? { ...c, links: [...c.links, { id: uid(), colorOptionId }] }
          : c
      )
    );
    closePicker();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getColor = (id: string): ColorOption | undefined =>
    colorOptions.find((c) => c._id === id) ?? colorOptions[0];

  const colorName = (opt: ColorOption | undefined) =>
    opt ? (opt.name[lang] ?? opt.name.en) : "";

  const buildColorSummary = (): ColorSummaryEntry[] => {
    const counts: Record<string, ColorSummaryEntry> = {};
    columns.forEach((col) => {
      col.links.forEach((link) => {
        const opt = getColor(link.colorOptionId);
        if (!opt) return;
        const name = colorName(opt);
        if (!counts[link.colorOptionId]) {
          counts[link.colorOptionId] = { colorOptionId: link.colorOptionId, colorName: name, count: 0 };
        }
        counts[link.colorOptionId].count += 1;
      });
    });
    return Object.values(counts);
  };

  const handleAddToCart = async () => {
    if (totalLinks === 0 || capturing) return;
    setCapturing(true);
    let previewImage: string | undefined;
    try {
      if (captureRef.current) {
        previewImage = await toJpeg(captureRef.current, {
          quality: 0.85,
          pixelRatio: 1,
          cacheBust: true,
          backgroundColor: ROOM_WALL_COLOR,
        });
      }
    } catch (err) {
      // The cart falls back to its chain icon if the image cannot be captured.
      console.warn("[chainbuilder] preview capture failed", err);
    }
    setCapturing(false);
    onAddToCart({
      columns: columns.map((col) => ({
        links: col.links.map((link) => ({
          colorOptionId: link.colorOptionId,
          colorName: colorName(getColor(link.colorOptionId)),
        })),
      })),
      totalLinks,
      lineTotal,
      colorSummary: buildColorSummary(),
      previewImage,
    });
  };

  // ── Placeholder styling ────────────────────────────────────────────────────
  // Shared look for the three "click here" targets (empty-column placeholder,
  // add-more zone, new-column ghost): flat white face, no border — depth and
  // interactivity come from a soft ambient shadow and, on hover/active, a
  // warm brass-toned glow ring instead of the old dashed outline. Plays a
  // one-shot scale pulse on mount (see tailwind.config's `pulse-once`) to cue
  // first-time visitors without looping indefinitely.
  // `bare` (New Column ghost only): no white face and no resting shadow — just the
  // plus + label over the room photo, in a darker tone so it stays readable.
  const placeholderClasses = (active: boolean, bare = false) =>
    `${bare ? "bg-transparent" : "bg-white"} rounded-md flex flex-col items-center justify-center transition-shadow duration-300 animate-pulse-once ${
      active
        ? `text-stone-700 shadow-[0_0_0_4px_rgba(${PLACEHOLDER_GLOW},0.28),0_6px_14px_-4px_rgba(28,25,23,0.14)]`
        : `${bare ? "text-stone-600 hover:text-stone-900" : "text-stone-400 shadow-[0_1px_3px_rgba(28,25,23,0.10)] hover:text-stone-700"} hover:shadow-[0_0_0_4px_rgba(${PLACEHOLDER_GLOW},0.20),0_6px_14px_-4px_rgba(28,25,23,0.12)]`
    }`;

  // ── Preview column ─────────────────────────────────────────────────────────
  // `clean` = capture mode: only mounts + links (no numbers, crosses, or add/placeholder buttons).
  const renderPreviewColumn = (col: ColumnState, colIdx: number, clean = false) => (
    <div key={col.id} className="relative flex flex-col items-center flex-shrink-0">

      {/* Column remove — absolute badge so it doesn't displace the column number */}
      {!clean && columns.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
          aria-label={`${t.removeColumn} ${colIdx + 1}`}
          className="group absolute -top-4 -right-5 z-10 w-11 h-11 flex items-center justify-center"
        >
          <span className="w-5 h-5 flex items-center justify-center text-stone-600 group-hover:text-red-500 transition-colors">
            <X size={9} />
          </span>
        </button>
      )}

      {/* Column number — sits ABOVE the mount so it doesn't create a gap
          between the mount and the first link */}
      {!clean && (
        <span className="font-bold uppercase tracking-widest text-stone-500 mb-1" style={{ fontSize: 8 }}>
          {colIdx + 1}
        </span>
      )}

      {/* Brass mount/stud — no bottom margin; first link overlaps it below.
          Soft drop-shadow ties it visually to the placeholder/link below. */}
      <img
        src={MOUNT_IMG}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: MOUNT_W,
          height: "auto",
          display: "block",
          position: "relative",
          top: REAL_COLUMN_MOUNT_OFFSET_PX,
          filter: "drop-shadow(0 4px 5px rgba(28,25,23,0.14))",
        }}
      />

      {col.links.length === 0 ? clean ? null : (
        /* Empty column placeholder — overlaps mount by PLACEHOLDER_OVERLAP_PX,
           identical treatment to the first real link in a column */
        <button
          ref={(el) => {
            if (el) linkButtonRefs.current.set(col.id, el);
            else linkButtonRefs.current.delete(col.id);
          }}
          onClick={(e) => openAddPicker(col.id, e)}
          aria-label={t.addFirstLink}
          style={{ marginTop: -PLACEHOLDER_OVERLAP_PX }}
          className={`w-[72px] h-[88px] gap-2 ${placeholderClasses(addPickerColId === col.id)}`}
        >
          <Plus size={16} strokeWidth={1.75} />
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none text-center px-1">
            {t.addFirstLink}
          </span>
        </button>
      ) : (
        <>
          {/* Link stack — the container pulls up by LINK_OVERLAP_PX so the first
              link overlaps the mount the same way every subsequent link overlaps
              the one above it. Per-link marginTop is unchanged. */}
          <div
            className="relative flex flex-col items-center"
            style={{ width: 72, marginTop: -LINK_OVERLAP_PX, isolation: "isolate" }}
          >
            {col.links.map((link, linkIdx) => {
              const opt = getColor(link.colorOptionId);
              // Alternate face / side view down the column: 1st, 3rd… = face, 2nd, 4th… = side.
              // Colour options without a side view photo keep the face view.
              const isSideView = linkIdx % 2 === 1 && !!opt?.sideViewImage;
              const viewImage = isSideView ? opt.sideViewImage : opt?.image;
              // Layering: side view links always sit above face view links; within the
              // same kind, later links sit above earlier ones. (The layer is set on the
              // image itself so the remove button below can rise above every link.)
              const layer = isSideView ? SIDE_VIEW_LAYER_BASE + linkIdx : linkIdx + 1;
              return (
                <div
                  key={link.id}
                  className="relative group/link"
                  style={{ marginTop: linkIdx === 0 ? 0 : -LINK_OVERLAP_PX, width: 72 }}
                >
                  {viewImage ? (
                    <img
                      src={imgUrl.thumb(viewImage)}
                      alt={colorName(opt)}
                      width={72}
                      height={72}
                      className="w-full h-auto object-cover"
                      aria-label={colorName(opt)}
                      title={colorName(opt)}
                      loading={clean ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      style={{
                        display: "block",
                        width: isSideView ? `${SIDE_VIEW_SCALE * 100}%` : "100%",
                        margin: isSideView ? "0 auto" : undefined,
                        height: "auto",
                        position: "relative",
                        zIndex: layer,
                        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10))",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        position: "relative",
                        zIndex: layer,
                        background: opt?.hexSwatch ?? "#d6d3d1",
                        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10))",
                      }}
                    />
                  )}
                  {!clean && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeLink(col.id, link.id); }}
                    aria-label={t.removeLink}
                    // Hover-capable devices: cross appears only while hovering this link (or its
                    // cross). Touch devices have no hover, so it stays visible there.
                    className="group absolute top-0 -right-2 w-11 h-11 flex items-center justify-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/link:opacity-100 focus-visible:opacity-100"
                    style={{ zIndex: REMOVE_BUTTON_LAYER }}
                  >
                    <span className="w-[18px] h-[18px] flex items-center justify-center text-stone-700 group-hover:text-red-500 transition-colors">
                      <X size={9} />
                    </span>
                  </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add-more zone — below the link stack, normal flow */}
          {!clean && (
          <button
            ref={(el) => {
              if (el) linkButtonRefs.current.set(col.id, el);
              else linkButtonRefs.current.delete(col.id);
            }}
            onClick={(e) => openAddPicker(col.id, e)}
            aria-label={t.addLink}
            className={`w-[72px] gap-1.5 mt-1.5 py-2.5 ${placeholderClasses(addPickerColId === col.id)}`}
          >
            <Plus size={14} strokeWidth={1.75} />
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none">
              {t.addLink}
            </span>
          </button>
          )}
        </>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="w-full flex flex-col lg:flex-row gap-8 lg:gap-10"
      ref={builderRef}
    >

      {/* ── LEFT SIDEBAR — order summary + cart ───────────────────────────── */}
      <div className="lg:w-52 flex-shrink-0 flex flex-col gap-6">

        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
          {t.buildNote}
        </p>

        {/* Order summary */}
        <div className="bg-stone-100 px-4 py-4 flex flex-col gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
            {t.total}
          </span>
          <span className="font-sans font-black text-3xl text-stone-900 leading-none">
            {currency} {lineTotal.toLocaleString()}
          </span>
          <span className="text-xs text-stone-400 mt-0.5">
            {totalLinks} {t.links} × {currency} {pricePerLink.toLocaleString()} {t.perLink}
          </span>
        </div>

        {/* Add to Cart (centred label) + trust microcopy — same look as the bundle product buttons */}
        <div>
          <button
            onClick={handleAddToCart}
            disabled={totalLinks === 0 || capturing}
            className={`w-full h-[52px] px-6 rounded-md font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-4 ${
              totalLinks === 0
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : justAdded
                ? "bg-stone-600 text-white"
                : "bg-stone-900 text-white hover:bg-stone-700"
            }`}
          >
            {justAdded ? t.added : t.addToCart}
          </button>

          <p className="text-[10px] text-stone-400 mt-2.5 leading-relaxed">
            {t.trustPrefix}{" "}
            <button
              type="button"
              onClick={openDeliveryPolicy}
              className="underline underline-offset-2 hover:text-stone-600 transition-colors"
            >
              {t.termsLink}
            </button>
          </p>
        </div>

        {/* Selected links — count per colour, e.g. "3× Dark Khaki" */}
        {totalLinks > 0 && (
          <ul className="flex flex-col gap-1 text-xs text-stone-600">
            {buildColorSummary().map((entry) => (
              <li key={entry.colorOptionId}>
                {entry.count}× {entry.colorName}
              </li>
            ))}
          </ul>
        )}

      </div>

      {/* ── RIGHT — preview canvas ────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400">
            {t.preview}
          </p>

          {/* Reset / start over — inline confirm, no browser alert() */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] font-bold uppercase tracking-[0.2em]">
            {confirmingReset ? (
              <>
                <span className="text-stone-500">{t.resetConfirm}</span>
                <button
                  onClick={resetBuild}
                  className="text-red-500 hover:text-red-600 transition-colors py-1"
                >
                  {t.resetConfirmYes}
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="text-stone-300 hover:text-stone-600 transition-colors py-1"
                >
                  {t.cancel}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmingReset(true)}
                className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 transition-colors py-1"
              >
                <RotateCcw size={12} />
                {t.reset}
              </button>
            )}
          </div>
        </div>

        {/* Preview backdrop — a room photo framed by a soft ambient shadow and
            hairline border so it reads as its own defined zone on the page. */}
        <div
          ref={canvasRef}
          className="relative grid grid-cols-[minmax(0,1fr)] border border-stone-200/70"
          style={{
            backgroundColor: ROOM_WALL_COLOR,
            boxShadow: "0 1px 2px rgba(28,25,23,0.05), 0 14px 28px -14px rgba(28,25,23,0.14)",
          }}
        >
          {/* Photo layer — base size (3:2 on desktop, 75% of the screen on mobile), pinned
              to the bottom of the canvas. Short builds fill the canvas exactly like before;
              when the chain is taller, the canvas grows above it and the wall colour shows. */}
          <div
            ref={photoRef}
            aria-hidden="true"
            className="[grid-area:1/1] self-end relative w-full min-h-[75svh] md:min-h-0 pointer-events-none"
            style={{
              aspectRatio: ROOM_BACKGROUND_ASPECT,
              backgroundImage: `url(${ROOM_BACKGROUND_IMG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {canvasExtended && (
              <div
                className="absolute inset-x-0 top-0 h-[30%]"
                style={{ background: `linear-gradient(to bottom, ${ROOM_WALL_COLOR}, transparent)` }}
              />
            )}
          </div>

          {/* Content layer — same grid cell, so the canvas is as tall as the photo layer or the chain, whichever is larger. */}
          <div className="[grid-area:1/1] relative" style={{ padding: "24px 24px 28px" }}>
          {columns.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-[10px] uppercase tracking-widest">
              {t.emptyPreview}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Small screens only: chains render ~13% smaller (CSS zoom keeps mounts, overlaps and buttons in proportion); md+ unchanged. */}
              <div className="flex gap-8 items-start w-fit mx-auto p-2 [zoom:0.87] md:[zoom:1]">
                {columns.map((col, colIdx) => renderPreviewColumn(col, colIdx))}

                {/* "New Column" ghost — same structure as real columns so the
                    ghost mount aligns at the same height as real column mounts.
                    Hidden once MAX_COLUMNS columns exist. */}
                {columns.length < MAX_COLUMNS && (
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <span className="font-bold uppercase tracking-widest text-stone-400/70 mb-1" style={{ fontSize: 8 }}>
                      {columns.length + 1}
                    </span>
                    <img
                      src={MOUNT_IMG}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className="opacity-40"
                      style={{
                        width: MOUNT_W,
                        height: "auto",
                        display: "block",
                        position: "relative",
                        top: PLACEHOLDER_MOUNT_OFFSET_PX,
                        filter: "drop-shadow(0 4px 5px rgba(28,25,23,0.14))",
                      }}
                    />
                    {/* "New Column" button overlaps ghost mount by LINK_OVERLAP_PX */}
                    <button
                      onClick={addColumn}
                      aria-label={t.addColumn}
                      style={{ marginTop: -LINK_OVERLAP_PX }}
                      className={`w-[72px] h-[88px] gap-2 ${placeholderClasses(false, true)}`}
                    >
                      <Plus size={16} strokeWidth={1.75} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none text-center px-1">
                        {t.addColumn}
                      </span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}
          </div>
        </div>

      </div>

      {/* Off-screen, UI-free copy of the design - captured to an image on Add to Cart. */}
      {totalLinks > 0 && (
        <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
          <div
            ref={captureRef}
            style={{
              display: "inline-flex",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 32,
              padding: "36px 44px 44px",
              minWidth: 360,
              minHeight: 400,
              backgroundColor: ROOM_WALL_COLOR,
              backgroundImage: `url(${ROOM_BACKGROUND_IMG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {columns.map((col, colIdx) => (
              <React.Fragment key={col.id}>{renderPreviewColumn(col, colIdx, true)}</React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Floating color picker — portaled to <body> so it can escape the
          scrollable preview canvas (FIX 1) and be positioned/clamped in
          viewport coordinates for edge-collision avoidance (FIX 3). */}
      {addPickerColId && popoverPos && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-40 bg-white border border-stone-200 shadow-xl p-3"
          style={{ top: popoverPos.top, left: popoverPos.left, minWidth: 156 }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2.5">
            {t.chooseColor}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {colorOptions.map((option) => {
              const optName = colorName(option);
              return (
                <button
                  key={option._id}
                  onClick={() => commitLink(addPickerColId, option._id)}
                  aria-label={optName}
                  title={optName}
                  className="w-8 h-8 border border-stone-200 overflow-hidden hover:border-stone-700 hover:scale-110 transition-all active:scale-95"
                  style={{ background: !option.image && option.hexSwatch ? option.hexSwatch : undefined }}
                >
                  {option.image && (
                    <img src={imgUrl.thumb(option.image)} alt={optName} className="w-full h-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={closePicker}
            className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300 hover:text-stone-600 transition-colors"
          >
            {t.cancel}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ChainBuilder;
