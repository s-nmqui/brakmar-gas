export type ProductType =
  | "garrafa_llena"
  | "garrafa_vacia"
  | "recarga"
  | "accesorio";

export type Availability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "unknown";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  categoryId: number | null;
  categoryName: string | null;
  productType: ProductType;
  description: string;
  priceCents: number | null;
  promoPriceCents: number | null;
  costCents: number | null;
  imagePath: string | null;
  extraImages: string[];
  stock: number;
  lowStockThreshold: number;
  availability: Availability;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: number;
  title: string;
  slug: string;
  description: string;
  discountLabel: string;
  productId: number | null;
  productName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MidesInfo {
  description: string;
  requirements: string;
  eligibility: string;
  normalPriceCents: number | null;
  benefitPriceCents: number | null;
  validFrom: string;
  validUntil: string;
  extraConditions: string;
  sourceUrl: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  displayName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt: string | null;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
}

export interface SeoSettings {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  keywords: string;
}

export interface SiteConfig {
  companyName: string;
  slogan: string;
  whatsapp: string;
  whatsappDisplay: string;
  schedule: string;
  locality: string;
  address: string;
  deliveryInfo: string;
  shippingInfo: string;
  email: string;
  googleMapsUrl: string;
  social: SocialLinks;
  seo: SeoSettings;
  midesSourceUrlDefault: string;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  unitPriceCents: number | null;
  quantity: number;
}
