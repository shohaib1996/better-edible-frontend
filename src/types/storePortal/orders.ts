export interface PricingStructure {
  type: "simple" | "multi-type" | "variants";
  variantLabels?: string[];
  typeLabels?: string[];
}

export interface ProductLine {
  _id: string;
  name: string;
  displayOrder?: number;
  pricingStructure?: PricingStructure;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface RawProduct {
  _id: string;
  active?: boolean;
  displayOrder?: number;
  productLine?: ProductLine | string;
  itemName?: string;
  price?: number;
  discountPrice?: number;
  applyDiscount?: boolean;
  priceDescription?: string;
  description?: string;
  imageUrl?: string;
  images?: ProductImage[];
  subProductLine?: string;
  prices?: Record<string, { price: number; discountPrice?: number | null }>;
  variants?: { label: string; price: number; discountPrice?: number }[];
}

export interface CartEntry {
  productId: string;
  productLineName: string;
  name: string;
  pricingType: "simple" | "multi-type" | "variants";
  rowKey: string;
  rowLabel: string;
  price: number;
  discountPrice?: number;
  onSale: boolean;
  qty: number;
}

export interface ProductCard {
  cardKey: string;
  productLineName: string;
  productLineDisplayOrder: number;
  cardDisplayOrder: number;
  pricingType: "simple" | "multi-type" | "variants";
  name: string;
  description?: string;
  imageUrl?: string;
  images?: ProductImage[];
  rows: {
    rowKey: string;
    label: string;
    price: number;
    discountPrice?: number;
    onSale: boolean;
    productId: string;
  }[];
}
