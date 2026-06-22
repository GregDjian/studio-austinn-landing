import React, { useEffect, useRef, useState } from "react";
import { Plus, X, ShoppingBag } from "lucide-react";
import { Language, ColorOption } from "../types";
import { imgUrl } from "../lib/sanityImage";

// ─── Visual tuning ────────────────────────────────────────────────────────────
const LINK_OVERLAP_PX = 36;        // mount → first real link, and link → link
const PLACEHOLDER_OVERLAP_PX = 16; // mount → dashed placeholder boxes (empty column / new-column ghost)
const PLACEHOLDER_MOUNT_OFFSET_PX = 0;    // vertical nudge for the mount image inside the "New Column" ghost (positive = down)
const REAL_COLUMN_MOUNT_OFFSET_PX = 22;   // vertical nudge for the mount image above a real column's first link (positive = down)
const WALL_COLOR_INITIAL = "#f9f8f6";
const WALL_VIGNETTE = 0.10; // edge/corner darkening on wall zone            (0 = off, 0.20 = noticeable)
const WALL_LIGHT   = 0.07; // directional light from upper-left on wall zone (0 = off, 0.15 = bright)
const WALL_SHADOW  = 0.12; // ambient shadow beneath the full chain group     (0 = off, 0.22 = noticeable)
// Room zone strips — fixed colors, unaffected by the wallColor picker
const CEILING_COLOR = "#e8e6e2"; // painted ceiling — light neutral warm white
const CEILING_LINE  = "rgba(0,0,0,0.07)"; // subtle wall-meets-ceiling join
const CEILING_H     = 36;  // ceiling strip height in px
const MOUNT_IMG = "/chain-mount.png";
const MOUNT_W = 36; // px — adjust if the physical stud needs to be bigger/smaller
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
      added: "تمت الإضافة ✓",
      emptyPreview: "أضف عموداً للبدء",
      chooseColor: "اختر اللون",
      links: "حلقات",
      preview: "معاينة",
      wallColor: "لون الجدار",
      cancel: "إلغاء",
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
    added: "Added ✓",
    emptyPreview: "Add a column to start building",
    chooseColor: "Choose colour",
    links: "links",
    preview: "Preview",
    wallColor: "Wall colour",
    cancel: "Cancel",
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
  // Wall color: visualisation-only — intentionally NOT in cart/order data.
  const [wallColor, setWallColor] = useState(WALL_COLOR_INITIAL);
  const builderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (builderRef.current && !builderRef.current.contains(e.target as Node)) {
        setAddPickerColId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalLinks = columns.reduce((sum, col) => sum + col.links.length, 0);
  const lineTotal = totalLinks * pricePerLink;

  // ── Actions ────────────────────────────────────────────────────────────────
  const addColumn = () => {
    setColumns((prev) => [...prev, { id: uid(), links: [] }]);
    setAddPickerColId(null);
  };

  const removeColumn = (colId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setAddPickerColId((prev) => (prev === colId ? null : prev));
  };

  const removeLink = (colId: string, linkId: string) =>
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
      )
    );

  const openAddPicker = (colId: string) =>
    setAddPickerColId((prev) => (prev === colId ? null : colId));

  const commitLink = (colId: string, colorOptionId: string) => {
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId
          ? { ...c, links: [...c.links, { id: uid(), colorOptionId }] }
          : c
      )
    );
    setAddPickerColId(null);
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

  const handleAddToCart = () => {
    if (totalLinks === 0) return;
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
    });
  };

  // ── Preview column ─────────────────────────────────────────────────────────
  const renderPreviewColumn = (col: ColumnState, colIdx: number) => (
    <div key={col.id} className="relative flex flex-col items-center flex-shrink-0">

      {/* Column remove — absolute badge so it doesn't displace the column number */}
      {columns.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
          aria-label={`${t.removeColumn} ${colIdx + 1}`}
          className="absolute -top-1 -right-2 z-10 w-5 h-5 rounded-full bg-white/90 border border-stone-200 flex items-center justify-center text-stone-300 hover:text-red-400 hover:border-red-200 transition-colors"
        >
          <X size={9} />
        </button>
      )}

      {/* Column number — sits ABOVE the mount so it doesn't create a gap
          between the mount and the first link */}
      <span className="font-bold uppercase tracking-widest text-stone-400 mb-1" style={{ fontSize: 8 }}>
        {colIdx + 1}
      </span>

      {/* Brass mount/stud — no bottom margin; first link overlaps it below */}
      <img
        src={MOUNT_IMG}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: MOUNT_W, height: "auto", display: "block", position: "relative", top: REAL_COLUMN_MOUNT_OFFSET_PX }}
      />

      {col.links.length === 0 ? (
        /* Empty column placeholder — overlaps mount by LINK_OVERLAP_PX,
           identical treatment to the first real link in a column */
        <button
          onClick={() => openAddPicker(col.id)}
          aria-label={t.addFirstLink}
          style={{ marginTop: -PLACEHOLDER_OVERLAP_PX }}
          className={`w-[72px] h-[88px] bg-white border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            addPickerColId === col.id
              ? "border-stone-600 text-stone-600"
              : "border-stone-400 text-stone-500 hover:border-stone-700 hover:text-stone-700"
          }`}
        >
          <Plus size={14} strokeWidth={1.5} />
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] leading-none text-center px-1">
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
            style={{ width: 72, marginTop: -LINK_OVERLAP_PX }}
          >
            {col.links.map((link, linkIdx) => {
              const opt = getColor(link.colorOptionId);
              return (
                <div
                  key={link.id}
                  className="relative"
                  style={{ marginTop: linkIdx === 0 ? 0 : -LINK_OVERLAP_PX, zIndex: linkIdx + 1, width: 72 }}
                >
                  {opt?.image ? (
                    <img
                      src={imgUrl.thumb(opt.image)}
                      alt={colorName(opt)}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10))",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        background: opt?.hexSwatch ?? "#d6d3d1",
                        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.10))",
                      }}
                    />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeLink(col.id, link.id); }}
                    aria-label={t.removeLink}
                    className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-white/90 border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-400 hover:border-red-200 transition-colors"
                    style={{ zIndex: linkIdx + 10 }}
                  >
                    <X size={9} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add-more zone — below the link stack, normal flow */}
          <button
            onClick={() => openAddPicker(col.id)}
            aria-label={t.addLink}
            className={`w-[72px] bg-white border-2 border-dashed flex flex-col items-center justify-center gap-1.5 mt-1.5 py-2.5 transition-colors ${
              addPickerColId === col.id
                ? "border-stone-600 text-stone-600"
                : "border-stone-400 text-stone-500 hover:border-stone-700 hover:text-stone-700"
            }`}
          >
            <Plus size={12} strokeWidth={1.5} />
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] leading-none">
              {t.addLink}
            </span>
          </button>
        </>
      )}

      {/* Floating color picker — anchored below this column */}
      {addPickerColId === col.id && (
        <div
          className="absolute z-40 bg-white border border-stone-200 shadow-xl p-3"
          style={{ top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", minWidth: 156 }}
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
                  onClick={() => commitLink(col.id, option._id)}
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
            onClick={() => setAddPickerColId(null)}
            className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300 hover:text-stone-600 transition-colors"
          >
            {t.cancel}
          </button>
        </div>
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

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={totalLinks === 0}
          className={`w-full flex items-center justify-center gap-3 py-4 font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-all duration-300 ${
            totalLinks === 0
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : justAdded
              ? "bg-stone-600 text-white"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          <ShoppingBag size={15} />
          {justAdded ? t.added : t.addToCart}
        </button>

      </div>

      {/* ── RIGHT — preview canvas + wall colour picker ────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400">
          {t.preview}
        </p>

        {/* Room backdrop — three stacked zones: ceiling / wall / floor */}
        <div className="flex flex-col" style={{ minHeight: 340 }}>

          {/* Ceiling — fixed color, never changes with wallColor picker */}
          <div
            aria-hidden="true"
            style={{
              height: CEILING_H,
              backgroundColor: CEILING_COLOR,
              borderBottom: `1px solid ${CEILING_LINE}`,
              flexShrink: 0,
            }}
          />

          {/* Wall zone — chain hangs here; background tracks wallColor picker */}
          <div
            className="relative"
            style={{
              // isolation:isolate creates a stacking context so the z-index:-1 shadow
              // renders above this background but behind the chain content
              isolation: "isolate",
              flex: 1,
              background: [
                `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,${WALL_VIGNETTE}) 100%)`,
                `radial-gradient(ellipse 130% 90% at -5% -5%, rgba(255,255,255,${WALL_LIGHT}) 0%, transparent 55%)`,
                wallColor,
              ].join(", "),
              padding: "16px 24px 16px",
            }}
          >
            {columns.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-[10px] uppercase tracking-widest">
                {t.emptyPreview}
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="flex gap-8 items-start">
                    {columns.map((col, colIdx) => renderPreviewColumn(col, colIdx))}

                    {/* "New Column" ghost — same structure as real columns so the
                        ghost mount aligns at the same height as real column mounts */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span className="font-bold uppercase tracking-widest text-stone-300 mb-1" style={{ fontSize: 8 }}>
                        {columns.length + 1}
                      </span>
                      <img
                        src={MOUNT_IMG}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className="opacity-40"
                        style={{ width: MOUNT_W, height: "auto", display: "block", position: "relative", top: PLACEHOLDER_MOUNT_OFFSET_PX }}
                      />
                      {/* Dashed "New Column" button overlaps ghost mount by LINK_OVERLAP_PX */}
                      <button
                        onClick={addColumn}
                        aria-label={t.addColumn}
                        style={{ marginTop: -LINK_OVERLAP_PX }}
                        className="w-[72px] h-[88px] bg-white border-2 border-dashed border-stone-400 flex flex-col items-center justify-center gap-2 text-stone-500 hover:border-stone-700 hover:text-stone-700 transition-colors"
                      >
                        <Plus size={14} strokeWidth={1.5} />
                        <span className="text-[8px] font-bold uppercase tracking-[0.12em] leading-none text-center px-1">
                          {t.addColumn}
                        </span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Grounding shadow — soft ellipse beneath the full chain group */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{
                    height: "50%",
                    background: `radial-gradient(ellipse 70% 55% at 50% 100%, rgba(0,0,0,${WALL_SHADOW}) 0%, transparent 100%)`,
                    zIndex: -1,
                  }}
                />
              </>
            )}
          </div>

        </div>

        {/* Wall colour picker */}
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
            {t.wallColor}
          </span>
          <label className="relative cursor-pointer flex-shrink-0" title={t.wallColor}>
            <div
              className="w-5 h-5 border border-stone-300 hover:border-stone-600 transition-colors"
              style={{ backgroundColor: wallColor }}
            />
            <input
              type="color"
              value={wallColor}
              onChange={(e) => setWallColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={t.wallColor}
            />
          </label>
        </div>

      </div>
    </div>
  );
};

export default ChainBuilder;
