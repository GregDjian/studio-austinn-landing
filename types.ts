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
  image: any;
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
}

export type ProductSize = 'small' | 'medium' | 'large';

export interface Product {
  _id: string;
  productType: ProductType;
  title: LocalizedString;
  slug: { current: string };
  images: any[];
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
