import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDeliveryPolicy } from "./DeliveryReturnsModal";
import { Plus, X, RotateCcw, ChevronUp, Palette, Ruler, Sun, Moon, Loader2 } from "lucide-react";
import { toJpeg } from "html-to-image";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DropAnimation,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Language, ColorOption } from "../types";
import { imgUrl } from "../lib/sanityImage";

// ─── Visual tuning ────────────────────────────────────────────────────────────
const LINK_OVERLAP_PX = 36;        // mount → first real link, and link → link
const PLACEHOLDER_OVERLAP_PX = 16; // mount → placeholder boxes (empty column / new-column ghost)
const PLACEHOLDER_MOUNT_OFFSET_PX = 0;    // vertical nudge for the mount image inside the "New Column" ghost (positive = down)
const REAL_COLUMN_MOUNT_OFFSET_PX = 22;   // vertical nudge for the mount image above a real column's first link (positive = down)
const ROOM_BACKGROUND_IMG = "/room-background.png"; // preview canvas backdrop (public folder)
const ROOM_BACKGROUND_ASPECT = "1536 / 1024";        // natural size of the photo — the base canvas keeps this ratio so it's never cropped
const ROOM_BACKGROUND_DARK_IMG = "/room-background-dark.png"; // dark mode backdrop (public folder)
const ROOM_WALL_COLOR_DARK = "#8a6a46";              // wall tone along the dark photo's top edge
const MOBILE_ROOM_POSITION_X = "20%";               // phones: horizontal crop of the room photo (50% = centred, lower = photo moves right)
const ROOM_WALL_COLOR = "#d4cac2";                // wall tone along the photo's top edge — fills the canvas above the photo when the chain outgrows it
const SIDE_VIEW_LAYER_BASE = 10000; // side view links stack above every face view link (which use 1, 2, 3…)
const SIDE_VIEW_SCALE = 0.82;       // side view links render slightly smaller than face view (1 = same width as face)
const REMOVE_BUTTON_LAYER = 100000; // remove (✕) buttons rise above all links so none is ever covered
const MAX_COLUMNS = 8;             // no "New Column" placeholder once this many columns exist (links per column stay unlimited)
const MOUNT_IMG = "/chain-mount.png";
const MOUNT_W = 36; // px — adjust if the physical stud needs to be bigger/smaller
const MOBILE_PREVIEW_ZOOM = 0.87;   // small screens render the chain this much smaller (must match the [zoom:0.87] class)
const TOUCH_DRAG_DELAY_MS = 220;    // touch: hold this long before a drag starts, so normal swipes still scroll
const PLACEHOLDER_GLOW = "180, 137, 84"; // warm brass-toned rgb triplet used for the placeholder hover/active glow ring
const MOBILE_STRIP_CLEARANCE_PX = 140; // phones: bottom padding under the chain while the colour strip is open
const NEXT_LINK_TUCK_PX = 12;      // the selected column's "next link" oval tucks this far under the last link
const SELECTED_COLUMN_HIGHLIGHT = "rgba(255,255,255,0.15)"; // soft wash behind the selected column
const FIRST_LINK_CM = 16;          // height scale: the first link (with its mount) adds this much…
const EXTRA_LINK_CM = 14;          // …and every further link this much
// ─────────────────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

// True on md+ screens (no preview zoom, larger colour panel); false on phones.
const useIsDesktop = () => {
  const query = "(min-width: 768px)";
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return matches;
};

type SortableState = ReturnType<typeof useSortable>;

// Render-prop wrapper so the builder's render helpers can use useSortable per item.
const Sortable: React.FC<{
  id: string;
  data: Record<string, unknown>;
  disabled?: Parameters<typeof useSortable>[0]["disabled"];
  children: (s: SortableState) => React.ReactNode;
}> = ({ id, data, disabled, children }) => <>{children(useSortable({ id, data, disabled }))}</>;

// Same idea for plain draggables (colour panel swatches) and drop zones (New Column, the panel).
const Draggable: React.FC<{
  id: string;
  data: Record<string, unknown>;
  children: (d: ReturnType<typeof useDraggable>) => React.ReactNode;
}> = ({ id, data, children }) => <>{children(useDraggable({ id, data }))}</>;

const Droppable: React.FC<{
  id: string;
  data: Record<string, unknown>;
  children: (d: ReturnType<typeof useDroppable>) => React.ReactNode;
}> = ({ id, data, children }) => <>{children(useDroppable({ id, data }))}</>;

const NEW_COLUMN_DROP_ID = "new-column";
const PANEL_DROP_ID = "colour-panel";

// Stand-in for the off-screen capture copy, which must not register duplicate drag ids.
const STATIC_SORTABLE = {
  setNodeRef: () => {},
  setActivatorNodeRef: () => {},
  listeners: undefined,
  attributes: {},
  transform: null,
  transition: undefined,
  isDragging: false,
} as unknown as SortableState;

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
  /** Top of the sidebar on large screens: back link, logo, title, description. */
  sidebarHeader?: React.ReactNode;
  /** Bottom of the sidebar on large screens: cart + language. */
  sidebarFooter?: React.ReactNode;
  /** Slim bar above the preview on smaller screens. */
  mobileTopBar?: React.ReactNode;
  /** Extra content in the bottom bar's expandable details panel (smaller screens). */
  mobileDetails?: React.ReactNode;
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      buildNote: "اختر عموداً ثم لوناً — سلسلتك تتحدّث مع بنائك",
      addColumn: "عمود جديد",
      addLink: "إضافة حلقة",
      addFirstLink: "إضافة حلقة",
      removeColumn: "حذف العمود",
      removeLink: "حذف الحلقة",
      column: "عمود",
      total: "الإجمالي",
      perLink: "/ حلقة",
      addToCart: "أضف إلى السلة",
      inclVat: "شامل الضريبة",
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
      dragHint: "اسحب أي حلقة أو مثبّت العمود لإعادة الترتيب",
      details: "التفاصيل",
      colours: "الألوان",
      addingHere: "الإضافة هنا",
      select: "اختيار",
      addingTo: "إلى العمود",
      closePanel: "إغلاق الألوان",
      cm: "سم",
      adding: "جارٍ الإضافة…",
      showScale: "إظهار المقياس",
      hideScale: "إخفاء المقياس",
      lightMode: "الوضع الفاتح",
      darkMode: "الوضع الداكن",
    };
  }
  return {
    buildNote: "Pick a column, then a colour — your chain updates as you build it",
    addColumn: "New Column",
    addLink: "Add Link",
    addFirstLink: "Add Link",
    removeColumn: "Remove column",
    removeLink: "Remove link",
    column: "Col",
    total: "Total",
    perLink: "/ link",
    addToCart: "Add to Cart",
    inclVat: "incl. VAT",
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
    dragHint: "Drag a link, or a column's mount, to rearrange",
    details: "Details",
    colours: "Colours",
    addingHere: "Adding here",
    select: "Select",
    addingTo: "To column",
    closePanel: "Close colours",
    cm: "cm",
    adding: "Adding…",
    showScale: "Show scale",
    hideScale: "Hide scale",
    lightMode: "Light mode",
    darkMode: "Dark mode",
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
  sidebarHeader,
  sidebarFooter,
  mobileTopBar,
  mobileDetails,
}) => {
  const t = getContent(lang);

  const [columns, setColumns] = useState<ColumnState[]>([{ id: uid(), links: [] }]);
  // Colour panel (docked bottom-left of the preview, open by default): a colour tapped
  // there is added to the selected column — the last column unless another was picked.
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  // Preview toggles (bottom-right buttons): height scale on/off, light/dark room photo.
  const [showScale, setShowScale] = useState(true);
  const [darkRoom, setDarkRoom] = useState(false);
  const roomImg = darkRoom ? ROOM_BACKGROUND_DARK_IMG : ROOM_BACKGROUND_IMG;
  const roomWall = darkRoom ? ROOM_WALL_COLOR_DARK : ROOM_WALL_COLOR;
  // Phones: the colour strip covers the bottom edge, so the toggles sit above it.
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelH, setPanelH] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const openDeliveryPolicy = useDeliveryPolicy();
  // Canvas growth: the photo layer keeps its base size (3:2 desktop / 75svh mobile) pinned
  // to the bottom; when the chain makes the canvas taller, `canvasExtended` turns on a
  // soft fade at the photo's top edge so the wall colour above it blends in.
  const canvasRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [canvasExtended, setCanvasExtended] = useState(false);
  // Visible preview area (the scroll container) — the photo layer is sized to it.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Cart preview image: an off-screen, UI-free render of the design captured on Add to Cart.
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const isDesktop = useIsDesktop();
  const previewZoom = isDesktop ? 1 : MOBILE_PREVIEW_ZOOM;
  // Drag & drop: links move within/between columns, columns reorder by their mount.
  // For "palette" drags (a colour pulled from the panel), `id` is a temporary link that's
  // inserted live into the hovered column, kept on drop and removed if dropped elsewhere.
  const [activeDrag, setActiveDrag] = useState<
    { id: string; type: "link" | "column" | "palette"; colorOptionId?: string } | null
  >(null);
  const paletteDragRef = useRef<{ tempId: string; colorOptionId: string } | null>(null);
  // A drag released back over its own swatch would also fire that swatch's click
  // (and add a second link); this swallows that one click.
  const suppressSwatchClickRef = useRef(false);
  // Kind of the last drag — still known while its drop animation runs (activeDrag is cleared by then).
  const [lastDragType, setLastDragType] = useState<"link" | "column" | "palette" | null>(null);
  // Whether the last palette drag landed on the chain (set on drop, read by its drop animation).
  const palettePlacedRef = useRef(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: TOUCH_DRAG_DELAY_MS, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || isDesktop || !panelOpen) { setPanelH(0); return; }
    const update = () => setPanelH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDesktop, panelOpen]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalLinks = columns.reduce((sum, col) => sum + col.links.length, 0);
  const lineTotal = totalLinks * pricePerLink;
  const activeCol = columns.find((c) => c.id === selectedColId) ?? columns[columns.length - 1];
  const activeColIdx = columns.indexOf(activeCol);
  // Height scale: follows the longest column (the first one on a tie).
  const longestCol = columns.reduce<ColumnState | undefined>(
    (best, col) => (!best || col.links.length > best.links.length ? col : best),
    undefined
  );
  const linksToCm = (n: number) => (n > 0 ? FIRST_LINK_CM + EXTRA_LINK_CM * (n - 1) : 0);

  // The scale bar sits at the canvas's right edge, spanning the longest column's mount to the
  // bottom of its last link, with a tick under each link. Measured with offsetTop (layout
  // positions, so drag transforms don't skew it) inside the chain row.
  const chainRowRef = useRef<HTMLDivElement>(null);
  const [ruler, setRuler] = useState<{ top: number; height: number; ticks: number[] } | null>(null);
  const longestColId = longestCol && longestCol.links.length > 0 ? longestCol.id : null;
  useLayoutEffect(() => {
    const row = chainRowRef.current;
    if (!row || !longestColId) { setRuler(null); return; }
    const topWithin = (el: HTMLElement) => {
      let y = 0;
      for (let n: HTMLElement | null = el; n && n !== row; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      return y;
    };
    const update = () => {
      const colEl = row.querySelector<HTMLElement>(`[data-ruler-col="${longestColId}"]`);
      const mount = colEl?.querySelector<HTMLElement>("[data-ruler-mount]");
      const stack = colEl?.querySelector<HTMLElement>("[data-ruler-stack]");
      if (!mount || !stack || !stack.children.length) { setRuler(null); return; }
      const mountTop = topWithin(mount);
      const ticks = Array.from(stack.children as HTMLCollectionOf<HTMLElement>).map(
        (link) => (topWithin(link) + link.offsetHeight - mountTop) * previewZoom
      );
      // The bar sits in the content layer, outside the zoomed row: convert to its coordinates.
      setRuler({ top: row.offsetTop + mountTop * previewZoom, height: ticks[ticks.length - 1], ticks });
    };
    update();
    // Link images load (and resize the column) after the first layout.
    const ro = new ResizeObserver(update);
    ro.observe(row);
    return () => ro.disconnect();
  }, [columns, longestColId, previewZoom]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const addColumn = () => {
    if (columns.length >= MAX_COLUMNS) return;
    const newId = uid();
    setColumns((prev) => [...prev, { id: newId, links: [] }]);
    setSelectedColId(newId);
    setPanelOpen(true);
  };

  const resetBuild = () => {
    setColumns([{ id: uid(), links: [] }]);
    setSelectedColId(null);
    setConfirmingReset(false);
  };

  const removeColumn = (colId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const removeLink = (colId: string, linkId: string) =>
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
      )
    );

  const selectColumn = (colId: string) => {
    setSelectedColId(colId);
    setPanelOpen(true);
  };

  const commitLink = (colorOptionId: string) => {
    if (!activeCol) return;
    setColumns((prev) =>
      prev.map((c) =>
        c.id === activeCol.id
          ? { ...c, links: [...c.links, { id: uid(), colorOptionId }] }
          : c
      )
    );
  };

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const findColumnOfLink = (linkId: UniqueIdentifier) =>
    columns.find((c) => c.links.some((l) => l.id === linkId));

  // Column drags only see columns. Link drags prefer the link under the pointer;
  // over a column's empty space they snap to that column's nearest link, or to the
  // column itself when it's empty.
  // Palette drags also see the New Column box, and nothing at all over the panel itself.
  const collisionDetection: CollisionDetection = (args) => {
    const type = args.active.data.current?.type;
    const ofType = (t: string) => args.droppableContainers.filter((c) => c.data.current?.type === t);
    const columnTargets = ofType("column");
    if (type === "column") return closestCenter({ ...args, droppableContainers: columnTargets });
    if (type === "palette") {
      if (pointerWithin({ ...args, droppableContainers: ofType("panel") }).length) return [];
      const newColHit = pointerWithin({ ...args, droppableContainers: ofType("new-column") });
      if (newColHit.length) return newColHit;
    }

    const linkTargets = args.droppableContainers.filter((c) => c.data.current?.type === "link");
    const hits = pointerWithin({ ...args, droppableContainers: [...linkTargets, ...columnTargets] });
    const linkHit = hits.find((h) => linkTargets.some((c) => c.id === h.id));
    if (linkHit) return [linkHit];
    const colHit = hits.find((h) => columnTargets.some((c) => c.id === h.id));
    if (colHit) {
      const inColumn = linkTargets.filter((c) => c.data.current?.colId === colHit.id);
      return inColumn.length ? closestCenter({ ...args, droppableContainers: inColumn }) : [colHit];
    }
    return closestCenter({ ...args, droppableContainers: [...linkTargets, ...columnTargets] });
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setLastDragType(active.data.current?.type ?? null);
    if (active.data.current?.type === "palette") {
      const colorOptionId = active.data.current.colorOptionId as string;
      const tempId = uid();
      paletteDragRef.current = { tempId, colorOptionId };
      setActiveDrag({ id: tempId, type: "palette", colorOptionId });
      return;
    }
    setActiveDrag({ id: String(active.id), type: active.data.current?.type });
  };

  const withoutLink = (cols: ColumnState[], linkId: string) =>
    cols.some((c) => c.links.some((l) => l.id === linkId))
      ? cols.map((c) => ({ ...c, links: c.links.filter((l) => l.id !== linkId) }))
      : cols;

  // A colour from the panel: (re)insert its temporary link where it's hovering —
  // above or below the link under the pointer, or at the end of a column — or take
  // it out again when over nothing / the New Column box.
  const handlePaletteDragOver = ({ active, over }: DragOverEvent) => {
    const drag = paletteDragRef.current;
    if (!drag) return;
    if (over?.id === drag.tempId) return;
    setColumns((prev) => {
      const base = withoutLink(prev, drag.tempId);
      const overType = over?.data.current?.type;
      if (!over || (overType !== "link" && overType !== "column")) return base;
      const toCol = overType === "column"
        ? base.find((c) => c.id === over.id)
        : base.find((c) => c.links.some((l) => l.id === over.id));
      if (!toCol) return base;
      const overIdx = toCol.links.findIndex((l) => l.id === over.id);
      const translated = active.rect.current.translated;
      const below = translated && translated.top + translated.height / 2 > over.rect.top + over.rect.height / 2;
      const insertAt = overIdx < 0 ? toCol.links.length : overIdx + (below ? 1 : 0);
      const tempLink = { id: drag.tempId, colorOptionId: drag.colorOptionId };
      return base.map((c) => {
        if (c.id !== toCol.id) return c;
        const links = [...c.links];
        links.splice(insertAt, 0, tempLink);
        return { ...c, links };
      });
    });
  };

  const swallowNextSwatchClick = () => {
    suppressSwatchClickRef.current = true;
    setTimeout(() => { suppressSwatchClickRef.current = false; }, 0);
  };

  const finishPaletteDrag = (over: DragEndEvent["over"]) => {
    const drag = paletteDragRef.current;
    paletteDragRef.current = null;
    swallowNextSwatchClick();
    if (!drag) return;
    if (over?.data.current?.type === "new-column" && columns.length < MAX_COLUMNS) {
      const newId = uid();
      setColumns((prev) => [
        ...withoutLink(prev, drag.tempId),
        { id: newId, links: [{ id: drag.tempId, colorOptionId: drag.colorOptionId }] },
      ]);
      setSelectedColId(newId);
      palettePlacedRef.current = true;
      return;
    }
    const placedIn = over ? columns.find((c) => c.links.some((l) => l.id === drag.tempId)) : undefined;
    palettePlacedRef.current = !!placedIn;
    if (placedIn) setSelectedColId(placedIn.id);
    else setColumns((prev) => withoutLink(prev, drag.tempId));
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
    palettePlacedRef.current = false;
    const drag = paletteDragRef.current;
    paletteDragRef.current = null;
    if (drag) swallowNextSwatchClick();
    if (drag) setColumns((prev) => withoutLink(prev, drag.tempId));
  };

  // Moving a link into another column happens live while hovering, so the
  // target column opens a gap for it; reordering within a column is settled on drop.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (active.data.current?.type === "palette") return handlePaletteDragOver(event);
    if (!over || active.data.current?.type !== "link") return;
    const overIsColumn = over.data.current?.type === "column";
    setColumns((prev) => {
      const fromCol = prev.find((c) => c.links.some((l) => l.id === active.id));
      const toCol = overIsColumn
        ? prev.find((c) => c.id === over.id)
        : prev.find((c) => c.links.some((l) => l.id === over.id));
      if (!fromCol || !toCol || fromCol.id === toCol.id) return prev;
      const link = fromCol.links.find((l) => l.id === active.id);
      if (!link) return prev;
      const overIdx = toCol.links.findIndex((l) => l.id === over.id);
      const translated = active.rect.current.translated;
      const below = translated && translated.top + translated.height / 2 > over.rect.top + over.rect.height / 2;
      const insertAt = overIdx < 0 ? toCol.links.length : overIdx + (below ? 1 : 0);
      return prev.map((c) => {
        if (c.id === fromCol.id) return { ...c, links: c.links.filter((l) => l.id !== link.id) };
        if (c.id === toCol.id) {
          const links = [...c.links];
          links.splice(insertAt, 0, link);
          return { ...c, links };
        }
        return c;
      });
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDrag(null);
    if (active.data.current?.type === "palette") return finishPaletteDrag(over);
    if (!over || active.id === over.id) return;
    if (active.data.current?.type === "column") {
      setColumns((prev) => {
        const from = prev.findIndex((c) => c.id === active.id);
        const to = prev.findIndex((c) => c.id === over.id);
        return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
      });
      return;
    }
    const col = findColumnOfLink(active.id);
    if (!col) return;
    const from = col.links.findIndex((l) => l.id === active.id);
    const to = col.links.findIndex((l) => l.id === over.id);
    if (from < 0 || to < 0) return;
    setColumns((prev) =>
      prev.map((c) => (c.id === col.id ? { ...c, links: arrayMove(c.links, from, to) } : c))
    );
  };

  // The default drop animation glides the overlay back to where the drag started —
  // right for links and columns, but for a colour that's the panel. A placed colour
  // is already sitting in the chain, so the overlay just vanishes; otherwise it fades out where it was let go.
  const paletteDropAnimation: DropAnimation = ({ dragOverlay }) => {
    if (palettePlacedRef.current) return;
    const fade = dragOverlay.node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: "ease-out" });
    return new Promise<void>((resolve) => { fade.onfinish = () => resolve(); });
  };

  // dnd-kit measures in screen pixels; inside the zoomed preview a CSS translate is
  // scaled by the zoom too, so divide it back out or shifted items lag the pointer.
  const sortableStyle = (s: SortableState): React.CSSProperties => ({
    transform: s.transform
      ? CSS.Translate.toString({ ...s.transform, x: s.transform.x / previewZoom, y: s.transform.y / previewZoom })
      : undefined,
    transition: s.transition,
  });

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
        ? `text-[rgb(${PLACEHOLDER_GLOW})] shadow-[0_0_0_2px_rgb(${PLACEHOLDER_GLOW}),0_0_0_6px_rgba(${PLACEHOLDER_GLOW},0.22),0_6px_14px_-4px_rgba(28,25,23,0.14)]`
        : `${bare ? "text-stone-600 hover:text-stone-900" : "text-stone-400 shadow-[0_1px_3px_rgba(28,25,23,0.10)] hover:text-stone-700"} hover:shadow-[0_0_0_4px_rgba(${PLACEHOLDER_GLOW},0.20),0_6px_14px_-4px_rgba(28,25,23,0.12)]`
    }`;

  // Add-link targets in columns that aren't selected: a frosted white chip with
  // a plus and "Select" — clicking selects the column.
  const quietTargetClasses =
    "group bg-white/75 backdrop-blur-sm rounded-md border border-white shadow-[0_1px_4px_rgba(28,25,23,0.12)] flex items-center justify-center gap-1.5 text-stone-500 hover:bg-white hover:text-stone-900 transition-colors duration-300";

  // Selected column's add-link target: an empty, link-shaped brass oval with
  // "Adding here" underneath — it reads as the next link in the chain.
  const selectedTargetContent = (
    <>
      <span
        className="w-[50px] h-[68px] rounded-[50%] flex items-center justify-center bg-white/35 backdrop-blur-[2px] animate-pulse-once transition-transform duration-300 group-hover:scale-105"
        style={{
          color: `rgb(${PLACEHOLDER_GLOW})`,
          boxShadow: `0 0 0 2px rgb(${PLACEHOLDER_GLOW}), 0 0 0 7px rgba(${PLACEHOLDER_GLOW},0.22), 0 6px 14px -4px rgba(28,25,23,0.14)`,
        }}
      >
        <Plus size={16} strokeWidth={1.75} />
      </span>
      <span
        className="mt-2.5 text-[8px] font-bold uppercase tracking-[0.14em] leading-none whitespace-nowrap"
        style={{ color: `rgb(${PLACEHOLDER_GLOW})` }}
      >
        {t.addingHere}
      </span>
    </>
  );

  const quietTargetContent = (
    <>
      <Plus size={13} strokeWidth={1.75} />
      <span className="text-[8px] font-bold uppercase tracking-[0.14em] leading-none">
        {t.select}
      </span>
    </>
  );

  // ── Link image ─────────────────────────────────────────────────────────────
  const renderLinkImage = (opt: ColorOption | undefined, isSideView: boolean, layer: number, eager: boolean) => {
    const viewImage = isSideView ? opt?.sideViewImage : opt?.image;
    return viewImage ? (
      <img
        src={imgUrl.thumb(viewImage)}
        alt={colorName(opt)}
        width={72}
        height={72}
        className="w-full h-auto object-cover"
        aria-label={colorName(opt)}
        title={colorName(opt)}
        loading={eager ? "eager" : "lazy"}
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
          WebkitTouchCallout: "none",
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
    );
  };

  // ── Preview column ─────────────────────────────────────────────────────────
  // `clean` = capture mode: only mounts + links (no numbers, crosses, add/placeholder
  // buttons or drag wiring). Used for the cart image and the column drag overlay.
  const renderPreviewColumn = (col: ColumnState, colIdx: number, clean = false) => {
    const canDragColumn = !clean && columns.length > 1;

    const renderLink = (link: LinkSlot, linkIdx: number, s: SortableState) => {
      const opt = getColor(link.colorOptionId);
      // Alternate face / side view down the column: 1st, 3rd… = face, 2nd, 4th… = side.
      // Colour options without a side view photo keep the face view.
      const isSideView = linkIdx % 2 === 1 && !!opt?.sideViewImage;
      // Layering: side view links always sit above face view links; within the
      // same kind, later links sit above earlier ones. (The layer is set on the
      // image itself so the remove button below can rise above every link.)
      const layer = isSideView ? SIDE_VIEW_LAYER_BASE + linkIdx : linkIdx + 1;
      return (
        <div
          key={link.id}
          ref={s.setNodeRef}
          {...s.attributes}
          {...s.listeners}
          className={`relative group/link ${clean ? "" : "cursor-grab touch-manipulation select-none outline-none focus-visible:ring-2 focus-visible:ring-stone-500"} ${s.isDragging ? "opacity-30" : !clean && activeDrag?.type === "palette" && link.id === activeDrag.id ? "opacity-50" : ""}`}
          style={{
            marginTop: linkIdx === 0 ? 0 : -LINK_OVERLAP_PX,
            width: 72,
            ...sortableStyle(s),
            // A transform makes this wrapper its own stacking context, so while it's
            // shifting during a drag it carries the image's layer to keep the overlap order.
            zIndex: s.transform ? layer : undefined,
          }}
        >
          {renderLinkImage(opt, isSideView, layer, clean)}
          {!clean && (
          <button
            onClick={(e) => { e.stopPropagation(); removeLink(col.id, link.id); }}
            // Keep presses on the cross from starting a drag of the link it sits on.
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
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
    };

    const linkStack = (
      /* Link stack — the container pulls up by LINK_OVERLAP_PX so the first
         link overlaps the mount the same way every subsequent link overlaps
         the one above it. Per-link marginTop is unchanged. */
      <div
        data-ruler-stack
        className="relative flex flex-col items-center"
        // zIndex 1: the selected column's "next link" oval tucks underneath the last link.
        style={{ width: 72, marginTop: -LINK_OVERLAP_PX, isolation: "isolate", zIndex: 1 }}
      >
        {col.links.map((link, linkIdx) =>
          clean ? (
            renderLink(link, linkIdx, STATIC_SORTABLE)
          ) : (
            <Sortable key={link.id} id={link.id} data={{ type: "link", colId: col.id }}>
              {(s) => renderLink(link, linkIdx, s)}
            </Sortable>
          )
        )}
      </div>
    );

    const isSelected = !clean && activeCol?.id === col.id;

    const renderColumn = (s: SortableState) => (
    <div
      key={col.id}
      ref={s.setNodeRef}
      data-ruler-col={clean ? undefined : col.id}
      // Clicking anywhere on the column selects it (the crosses stop propagation).
      onClick={clean ? undefined : () => selectColumn(col.id)}
      className={`relative flex flex-col items-center flex-shrink-0 rounded-lg transition-[background-color,box-shadow] duration-300 ${s.isDragging ? "opacity-30" : ""}`}
      style={{
        ...sortableStyle(s),
        // Selected column: a soft wash that reaches past the column without shifting its layout.
        backgroundColor: isSelected ? SELECTED_COLUMN_HIGHLIGHT : undefined,
        boxShadow: isSelected ? `0 0 0 10px ${SELECTED_COLUMN_HIGHLIGHT}` : undefined,
      }}
    >

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

      {/* Column drag handle — the number + mount. */}
      <div
        ref={s.setActivatorNodeRef}
        {...(canDragColumn ? { ...s.attributes, ...s.listeners } : {})}
        className={`flex flex-col items-center ${canDragColumn ? "cursor-grab touch-manipulation select-none outline-none focus-visible:ring-2 focus-visible:ring-stone-500 rounded" : ""}`}
        style={{ WebkitTouchCallout: "none" }}
      >
      {/* Column number — sits ABOVE the mount so it doesn't create a gap
          between the mount and the first link */}
      {!clean && (
        <span
          className={`font-bold uppercase tracking-widest mb-1 transition-colors ${isSelected ? "" : "text-stone-500"}`}
          style={{ fontSize: isSelected ? 10 : 8, color: isSelected ? `rgb(${PLACEHOLDER_GLOW})` : undefined }}
        >
          {colIdx + 1}
        </span>
      )}

      {/* Brass mount/stud — no bottom margin; first link overlaps it below.
          Soft drop-shadow ties it visually to the placeholder/link below. */}
      <img
        data-ruler-mount
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
      </div>

      {col.links.length === 0 ? clean ? null : (
        /* Empty column placeholder — overlaps mount by PLACEHOLDER_OVERLAP_PX,
           identical treatment to the first real link in a column */
        <button
          onClick={() => selectColumn(col.id)}
          aria-label={t.addFirstLink}
          style={{ marginTop: -PLACEHOLDER_OVERLAP_PX }}
          className={isSelected ? "group w-[72px] flex flex-col items-center" : `w-[72px] h-[88px] ${quietTargetClasses}`}
        >
          {isSelected ? selectedTargetContent : quietTargetContent}
        </button>
      ) : (
        <>
          {clean ? linkStack : (
            <SortableContext items={col.links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {linkStack}
            </SortableContext>
          )}

          {/* Add-more zone — below the link stack, normal flow */}
          {!clean && (
          <button
            onClick={() => selectColumn(col.id)}
            aria-label={t.addLink}
            style={isSelected ? { marginTop: -NEXT_LINK_TUCK_PX } : undefined}
            className={isSelected ? "group relative w-[72px] flex flex-col items-center" : `w-[72px] mt-1.5 h-6 ${quietTargetClasses}`}
          >
            {isSelected ? selectedTargetContent : quietTargetContent}
          </button>
          )}
        </>
      )}
    </div>
    );

    // The column stays a drop target even when it can't be dragged (single column).
    return clean ? renderColumn(STATIC_SORTABLE) : (
      <Sortable key={col.id} id={col.id} data={{ type: "column" }} disabled={{ draggable: !canDragColumn }}>
        {renderColumn}
      </Sortable>
    );
  };

  // While the cart image is being captured: a spinner over the (hidden) label, so the
  // button keeps its width.
  const addToCartLabel = (
    <>
      <span className={capturing ? "invisible" : undefined}>{justAdded ? t.added : t.addToCart}</span>
      {capturing && <Loader2 size={18} className="absolute animate-spin" aria-label={t.adding} />}
    </>
  );

  const addToCartClasses = `relative rounded-md font-sans font-bold text-[11px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-4 ${
    totalLinks === 0
      ? "bg-stone-200 text-stone-400 cursor-not-allowed"
      : justAdded
      ? "bg-stone-600 text-white"
      : capturing
      ? "bg-stone-900 text-white cursor-wait"
      : "bg-stone-900 text-white hover:bg-stone-700"
  }`;

  const trustNote = (
    <p className="text-[10px] text-stone-400 leading-relaxed">
      {t.trustPrefix}{" "}
      <button
        type="button"
        onClick={openDeliveryPolicy}
        className="underline underline-offset-2 hover:text-stone-600 transition-colors"
      >
        {t.termsLink}
      </button>
    </p>
  );

  // Selected links — count per colour, e.g. "3× Dark Khaki"
  const colorSummaryList = totalLinks > 0 && (
    <ul className="flex flex-col gap-1 text-xs text-stone-600">
      {buildColorSummary().map((entry) => (
        <li key={entry.colorOptionId}>
          {entry.count}× {entry.colorName}
        </li>
      ))}
    </ul>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  // Full-screen page: sidebar (lg+) or top bar + bottom bar (smaller screens)
  // around a preview that fills the rest of the screen and scrolls on its own.
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="h-[100dvh] w-full flex flex-col lg:flex-row bg-stone-50 overflow-hidden"
    >

      {mobileTopBar && <div className="lg:hidden flex-shrink-0">{mobileTopBar}</div>}

      {/* ── LEFT SIDEBAR (lg+) — page header, order summary + cart ─────────── */}
      <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-shrink-0 flex-col gap-6 overflow-y-auto border-e border-stone-200 px-6 py-6">

        {sidebarHeader}

        <p className="text-[8px] font-bold uppercase tracking-[0.2em] leading-relaxed text-stone-400">
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
            {totalLinks} {t.links} × {currency} {pricePerLink.toLocaleString()} {t.perLink} · {t.inclVat}
          </span>
        </div>

        {/* Add to Cart (centred label) + trust microcopy — same look as the bundle product buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleAddToCart}
            disabled={totalLinks === 0 || capturing}
            className={`w-full h-[52px] px-6 ${addToCartClasses}`}
          >
            {addToCartLabel}
          </button>
          {trustNote}
        </div>

        {totalLinks > 1 && (
          <p className="text-[10px] text-stone-400 leading-relaxed -mt-3">{t.dragHint}</p>
        )}

        {colorSummaryList}

        {sidebarFooter && (
          <div className="mt-auto pt-5 border-t border-stone-200">{sidebarFooter}</div>
        )}
      </aside>

      {/* ── RIGHT — preview canvas ────────────────────── */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">

        {/* Overlaps the preview by the corner radius so the room shows behind the rounded bottom corners. */}
        <div className="relative z-20 -mb-2.5 flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-2 lg:py-3 bg-white border-x border-b border-stone-200 rounded-b-lg shadow-[0_2px_6px_-2px_rgba(28,25,23,0.10)]">
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

        {/* Scroll area — the canvas is at least this tall; a longer chain scrolls here, not the page. */}
        {/* One drag context for the chain and the colour panel, so colours can be dragged onto columns. */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
        <div className="relative flex-1 min-h-0 flex flex-col">
        <div ref={viewportRef} className="flex-1 min-h-0 overflow-y-auto">
        <div
          ref={canvasRef}
          className="relative grid grid-cols-[minmax(0,1fr)]"
          style={{ backgroundColor: roomWall, minHeight: viewportH || undefined }}
        >
          {/* Photo layer — exactly as tall as the visible area, pinned to the bottom of
              the canvas. When the chain is taller, the canvas grows above it and the
              wall colour shows. */}
          <div
            ref={photoRef}
            aria-hidden="true"
            className="[grid-area:1/1] self-end relative w-full pointer-events-none"
            style={{
              height: viewportH || "100%",
              backgroundImage: `url(${roomImg})`,
              backgroundSize: "cover",
              // Phones: photo shifted right (shows more of its left side).
              backgroundPosition: isDesktop ? "center" : `${MOBILE_ROOM_POSITION_X} center`,
            }}
          >
            {canvasExtended && (
              <div
                className="absolute inset-x-0 top-0 h-[30%]"
                style={{ background: `linear-gradient(to bottom, ${roomWall}, transparent)` }}
              />
            )}
          </div>

          {/* Content layer — same grid cell, so the canvas is as tall as the photo layer or the chain, whichever is larger. */}
          {/* Phones: extra bottom room so a long chain can scroll clear of the colour strip. */}
          <div
            className="[grid-area:1/1] relative"
            style={{ padding: `24px 24px ${!isDesktop && panelOpen ? MOBILE_STRIP_CLEARANCE_PX : 28}px` }}
          >
          {/* Height scale — pinned to the canvas's right edge, lined up with the longest
              column (row offsets scaled by the phone zoom). */}
          {showScale && ruler && (
            <div
              className={`absolute right-1 md:right-24 w-14 pointer-events-none ${darkRoom ? "text-stone-900" : "text-stone-600"}`}
              style={{ top: ruler.top, height: ruler.height, zIndex: 1 }}
              aria-hidden="true"
            >
              {/* Spine with a cap at the top */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-500/70" />
              <div className="absolute left-0 top-0 w-2 h-px bg-stone-500/70" />
              {ruler.ticks.map((y, i) => {
                const last = i === ruler.ticks.length - 1;
                return (
                  <div key={i} className="absolute left-0 flex items-center gap-1" style={{ top: y, transform: "translateY(-50%)" }}>
                    <div className={`h-px bg-stone-500/70 ${last ? "w-2" : "w-1.5"}`} />
                    <span
                      className={`whitespace-nowrap leading-none tracking-wider ${last ? "font-bold" : "opacity-70"}`}
                      style={{ fontSize: last ? 10 : 8 }}
                    >
                      {last ? "≈ " : ""}{linksToCm(i + 1)} {t.cm}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {columns.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-[10px] uppercase tracking-widest">
              {t.emptyPreview}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              {/* Small screens only: chains render ~13% smaller (CSS zoom keeps mounts, overlaps and buttons in proportion); md+ unchanged. */}
              <div ref={chainRowRef} className="relative flex gap-8 items-start w-fit mx-auto p-2 [zoom:0.87] md:[zoom:1]">
                <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                  {columns.map((col, colIdx) => renderPreviewColumn(col, colIdx))}
                </SortableContext>

                {/* "New Column" ghost — same structure as real columns so the
                    ghost mount aligns at the same height as real column mounts.
                    Hidden once MAX_COLUMNS columns exist. */}
                {columns.length < MAX_COLUMNS && (
                  <Droppable id={NEW_COLUMN_DROP_ID} data={{ type: "new-column" }}>
                  {(drop) => (
                  // The whole ghost (number, mount, button) adds a column; the button's own
                  // clicks (incl. Enter/Space) bubble up here.
                  <div ref={drop.setNodeRef} onClick={addColumn} className="flex-shrink-0 flex flex-col items-center cursor-pointer">
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
                      aria-label={t.addColumn}
                      style={{ marginTop: -LINK_OVERLAP_PX }}
                      // Lights up while a colour from the panel is held over it.
                      className={`w-[72px] h-[88px] gap-2 ${placeholderClasses(drop.isOver && activeDrag?.type === "palette", true)}`}
                    >
                      <Plus size={16} strokeWidth={1.75} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none text-center px-1">
                        {t.addColumn}
                      </span>
                    </button>
                  </div>
                  )}
                  </Droppable>
                )}

              </div>
            </div>

            {/* What follows the pointer while dragging — portaled so the scrolling
                canvas can't clip it; zoomed to match the preview on small screens. */}
            {createPortal(
              <DragOverlay dropAnimation={lastDragType === "palette" ? paletteDropAnimation : undefined}>
                {activeDrag && (
                  <div className="[zoom:0.87] md:[zoom:1] cursor-grabbing" style={{ filter: "drop-shadow(0 12px 18px rgba(28,25,23,0.22))" }}>
                    {activeDrag.type === "palette" ? (
                      <div style={{ width: 72 }}>{renderLinkImage(getColor(activeDrag.colorOptionId ?? ""), false, 1, true)}</div>
                    ) : activeDrag.type === "column" ? (() => {
                      const idx = columns.findIndex((c) => c.id === activeDrag.id);
                      return idx < 0 ? null : renderPreviewColumn(columns[idx], idx, true);
                    })() : (() => {
                      const link = columns.flatMap((c) => c.links).find((l) => l.id === activeDrag.id);
                      return link ? <div style={{ width: 72 }}>{renderLinkImage(getColor(link.colorOptionId), false, 1, true)}</div> : null;
                    })()}
                  </div>
                )}
              </DragOverlay>,
              document.body
            )}
            </>
          )}
          </div>
        </div>
        </div>

        {/* Colour panel — md+: docked bottom-left over the preview, 80% of its height, frosted;
            phones: a full-width strip along the bottom that scrolls sideways.
            scrolls inside;
            the ✕ folds it into a small "Colours" button. */}
        {panelOpen ? (
          <Droppable id={PANEL_DROP_ID} data={{ type: "panel" }}>
          {(panelDrop) => (
          <div
            ref={(el) => { panelDrop.setNodeRef(el); panelRef.current = el; }}
            role="dialog"
            aria-label={t.chooseColor}
            className={`absolute z-30 bg-white/50 backdrop-blur-md border border-white/60 shadow-xl flex flex-col overflow-hidden ${
              isDesktop ? "bottom-3 start-3 w-[280px] h-[80%] rounded-lg" : "bottom-0 inset-x-0 rounded-t-lg border-b-0"
            }`}
          >
            <div className="flex-shrink-0 flex items-center justify-between gap-2 ps-3 pe-1 py-1 border-b border-stone-900/10">
              <p className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500">
                {t.chooseColor}
                {columns.length > 1 && (
                  <span style={{ color: `rgb(${PLACEHOLDER_GLOW})` }}> · {t.addingTo} {activeColIdx + 1}</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label={t.closePanel}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div
              className={
                isDesktop
                  ? "flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 grid grid-cols-3 content-start gap-x-2 gap-y-3"
                  : "flex gap-2.5 overflow-x-auto overscroll-contain px-3 pt-2 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              }
            >
              {colorOptions.map((option) => {
                const optName = colorName(option);
                return (
                  <Draggable key={option._id} id={`palette:${option._id}`} data={{ type: "palette", colorOptionId: option._id }}>
                  {(drag) => (
                  <button
                    ref={drag.setNodeRef}
                    // Mouse/touch drag only — Enter/Space stay a normal click that adds the colour.
                    onMouseDown={drag.listeners?.onMouseDown as React.MouseEventHandler | undefined}
                    onTouchStart={drag.listeners?.onTouchStart as React.TouchEventHandler | undefined}
                    onClick={() => { if (!suppressSwatchClickRef.current) commitLink(option._id); }}
                    title={optName}
                    className={`group flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-grab touch-manipulation select-none ${isDesktop ? "" : "flex-shrink-0 w-16"} ${drag.isDragging ? "opacity-40" : ""}`}
                    style={{ WebkitTouchCallout: "none" }}
                  >
                    <span
                      className="block w-full aspect-square rounded-md border border-stone-200/80 bg-white/40 overflow-hidden transition-all group-hover:border-stone-700 group-hover:shadow-md"
                      style={{ background: !option.image && option.hexSwatch ? option.hexSwatch : undefined }}
                    >
                      {option.image && (
                        <img
                          src={imgUrl.thumb(option.image)}
                          alt=""
                          draggable={false}
                          className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.1em] leading-tight text-center text-stone-600 group-hover:text-stone-900 line-clamp-2">
                      {optName}
                    </span>
                  </button>
                  )}
                  </Draggable>
                );
              })}
            </div>
          </div>
          )}
          </Droppable>
        ) : (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="absolute bottom-3 start-3 z-30 flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-lg border border-stone-200 shadow-lg text-[9px] font-bold uppercase tracking-[0.2em] text-stone-700 hover:text-stone-900 transition-colors"
          >
            <Palette size={14} />
            {t.colours}
          </button>
        )}

        {/* Preview toggles — bottom-right: height scale and light/dark room. */}
        <div className="absolute end-3 z-30 flex items-center gap-2" style={{ bottom: panelH + 12 }}>
          <button
            type="button"
            onClick={() => setShowScale((v) => !v)}
            aria-pressed={showScale}
            aria-label={showScale ? t.hideScale : t.showScale}
            title={showScale ? t.hideScale : t.showScale}
            className={`w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-stone-200 shadow-lg transition-colors ${showScale ? "text-stone-900" : "text-stone-400 hover:text-stone-700"}`}
          >
            <Ruler size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDarkRoom((v) => !v)}
            aria-label={darkRoom ? t.lightMode : t.darkMode}
            title={darkRoom ? t.lightMode : t.darkMode}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-stone-200 shadow-lg text-stone-700 hover:text-stone-900 transition-colors"
          >
            {darkRoom ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        </div>
        </DndContext>

        {/* ── BOTTOM BAR (below lg) — total, details toggle + Add to Cart ─── */}
        <div className="lg:hidden flex-shrink-0 relative bg-white border-t border-stone-200">
          {detailsOpen && (
            <div className="absolute bottom-full inset-x-0 bg-white border-t border-stone-200 shadow-[0_-12px_24px_-12px_rgba(28,25,23,0.18)] max-h-[55svh] overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {mobileDetails}
              {colorSummaryList}
              {totalLinks > 1 && <p className="text-[10px] text-stone-400 leading-relaxed">{t.dragHint}</p>}
              {trustNote}
            </div>
          )}
          <div className="flex items-center gap-3 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              aria-expanded={detailsOpen}
              className="flex-1 min-w-0 flex flex-col items-start text-start"
            >
              <span className="font-sans font-black text-xl text-stone-900 leading-none">
                {currency} {lineTotal.toLocaleString()}
              </span>
              <span className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">
                {totalLinks} {t.links} · {t.inclVat} · {t.details}
                <ChevronUp size={12} className={`transition-transform ${detailsOpen ? "" : "rotate-180"}`} />
              </span>
            </button>
            <button
              onClick={handleAddToCart}
              disabled={totalLinks === 0 || capturing}
              className={`flex-shrink-0 h-12 px-5 ${addToCartClasses}`}
            >
              {addToCartLabel}
            </button>
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

    </div>
  );
};

export default ChainBuilder;
