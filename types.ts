export type Language = 'en' | 'ar';

export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export type Availability = 'in_stock' | 'sold' | 'made_to_order';
export type ProductType = 'bundle' | 'loose-link';

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface ColorOption {
  _id: string;
  name: LocalizedString;
  /** Face view of the link — also the picker swatch. */
  image: any;
  /** Side view — used for even positions in the builder preview; falls back to `image`. */
  sideViewImage?: any;
  hexSwatch?: string;
  displayOrder: number;
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
  previewImage?: string;
}

export type ProductSize = 'small' | 'medium' | 'large';

/** Bundle products only — a colour variant with its own photo and stock status. */
export interface ProductVariant {
  _key: string;
  name: LocalizedString;
  image: any;
  availability: Availability;
  /** Optional per-variant materials; falls back to the product's own. */
  materials?: LocalizedString;
}

/** Bundle products only — a size option (free-text label) with its own price. */
export interface ProductSizeOption {
  _key: string;
  label: string;
  price: number;
}

export interface Product {
  _id: string;
  _createdAt?: string;
  productType: ProductType;
  title: LocalizedString;
  slug: { current: string };
  images: any[];
  variants?: ProductVariant[];
  sizes?: ProductSizeOption[];
  price?: number;
  pricePerLink?: number;
  currency: string;
  description: LocalizedString;
  subtitle?: LocalizedString;
  dimensions?: LocalizedString;
  materials?: LocalizedString;
  availability: Availability;
  sku?: string;
  featured: boolean;
  collection?: string;
  colorOptions?: ColorOption[];
  weightKg?: number;
  size?: ProductSize;
}
