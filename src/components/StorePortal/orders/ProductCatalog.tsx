"use client";

import type { ProductCard as ProductCardType, ProductImage, CartEntry } from "@/types/storePortal/orders";
import { ProductCard } from "./ProductCard";

interface Props {
  visibleCards: ProductCardType[];
  loadingProducts: boolean;
  cartQty: (rowKey: string) => number;
  setRowQty: (entry: Omit<CartEntry, "qty">, qty: number) => void;
  onLightbox: (images: ProductImage[], index: number) => void;
}

export function ProductCatalog({ visibleCards, loadingProducts, cartQty, setRowQty, onLightbox }: Props) {
  if (loadingProducts) {
    return (
      <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
        Loading products…
      </div>
    );
  }

  if (visibleCards.length === 0) {
    return (
      <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
        No products found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleCards.map((card) => (
        <ProductCard
          key={card.cardKey}
          card={card}
          cartQty={cartQty}
          setRowQty={setRowQty}
          onLightbox={onLightbox}
        />
      ))}
    </div>
  );
}
