import React, { createContext, useContext, useReducer, useMemo } from "react";
import { Availability, ColorSummaryEntry } from "../types";

// ─── Bundle cart item (existing shape — unchanged) ────────────────────────────

export interface CartItem {
  /** Unique per cart line — assigned by the reducer via crypto.randomUUID().
   *  Two lines can share the same productId (e.g. gold vs silver variant). */
  id: string;
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  availability: Availability;
  quantity: number;
  weightKg?: number;
  size?: 'small' | 'medium' | 'large';
  /** Selected colour variant's display name (current language) — absent when the
   *  product has no variants. `title` already includes it ("Paravent Rome — Gold");
   *  this is kept separately so checkout can send it as the Stripe description. */
  variantName?: string;
  /** Selected size label (e.g. "120cm x 140cm") — absent when the product has no
   *  size options. `title` includes it; `price` is that size's price. */
  sizeLabel?: string;
}

// ─── Loose-link cart item ─────────────────────────────────────────────────────

export interface LooseLinkCartItem {
  /** Unique per cart entry — assigned by the reducer via crypto.randomUUID(). */
  id: string;
  productId: string;
  productType: "loose-link";
  title: string;
  currency: string;
  configuration: {
    columns: { links: Array<{ colorOptionId: string; colorName: string }> }[];
  };
  totalLinks: number;
  pricePerLink: number;
  lineTotal: number;
  colorSummary: ColorSummaryEntry[];
  /** JPEG data URL of the finished design, shown in the cart. Absent if capture failed. */
  previewImage?: string;
  weightKg?: number;
  size?: 'small' | 'medium' | 'large';
}

export type AnyCartItem = CartItem | LooseLinkCartItem;

/** Discriminant — true only for LooseLinkCartItem. */
export const isLooseLinkItem = (item: AnyCartItem): item is LooseLinkCartItem =>
  (item as LooseLinkCartItem).productType === "loose-link";

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface CartState {
  items: AnyCartItem[];
}

type CartAction =
  | { type: "ADD_ITEM";       payload: Omit<CartItem, "quantity" | "id"> }
  | { type: "ADD_LOOSE_LINK"; payload: Omit<LooseLinkCartItem, "id"> }
  | { type: "REMOVE_ITEM";    id: string }
  | { type: "UPDATE_QTY";     id: string; quantity: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      // Bundle items deduplicate by productId + variant + size — the same combination
      // increments quantity on its existing line; any different variant or size
      // becomes its own line (own id) so they never merge into one line.
      const matches = (i: AnyCartItem) =>
        !isLooseLinkItem(i) &&
        i.productId === action.payload.productId &&
        i.variantName === action.payload.variantName &&
        i.sizeLabel === action.payload.sizeLabel;
      const existing = state.items.find(matches);
      if (existing) {
        return {
          items: state.items.map((i) =>
            matches(i) ? { ...i, quantity: (i as CartItem).quantity + 1 } : i
          ),
        };
      }
      return {
        items: [...state.items, { ...action.payload, id: crypto.randomUUID(), quantity: 1 }],
      };
    }

    case "ADD_LOOSE_LINK":
      // Each configuration is a unique custom piece — always a new line item.
      return {
        items: [...state.items, { ...action.payload, id: crypto.randomUUID() }],
      };

    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.id !== action.id) };

    case "UPDATE_QTY": {
      if (action.quantity < 1) {
        return { items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        items: state.items.map((i) => {
          // Quantity controls only apply to bundle items.
          if (isLooseLinkItem(i) || i.id !== action.id) return i;
          return { ...i, quantity: action.quantity };
        }),
      };
    }

    case "CLEAR":
      return { items: [] };

    default:
      return state;
  }
}

// ─── Context value ────────────────────────────────────────────────────────────

interface CartContextValue {
  items: AnyCartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity" | "id">) => void;
  addLooseLinkItem: (item: Omit<LooseLinkCartItem, "id">) => void;
  removeItem: (id: string) => void;
  /** Only meaningful for bundle items — no-op on loose-link items. */
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Loose-link items count as 1 line; bundle items count by quantity.
  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + (isLooseLinkItem(i) ? 1 : i.quantity), 0),
    [state.items]
  );

  // Loose-link total is lineTotal; bundle total is price × quantity.
  const totalPrice = useMemo(
    () =>
      state.items.reduce(
        (sum, i) => sum + (isLooseLinkItem(i) ? i.lineTotal : i.price * i.quantity),
        0
      ),
    [state.items]
  );

  const value: CartContextValue = {
    items:            state.items,
    itemCount,
    totalPrice,
    addItem:          (item) => dispatch({ type: "ADD_ITEM",       payload: item }),
    addLooseLinkItem: (item) => dispatch({ type: "ADD_LOOSE_LINK", payload: item }),
    removeItem:       (id)   => dispatch({ type: "REMOVE_ITEM",    id }),
    updateQuantity:   (id, quantity) => dispatch({ type: "UPDATE_QTY", id, quantity }),
    clearCart:        ()     => dispatch({ type: "CLEAR" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
