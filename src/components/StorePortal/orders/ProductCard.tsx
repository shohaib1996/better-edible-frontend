"use client";

import { lineColor, ep } from "@/lib/orderHelpers";
import type { ProductCard as ProductCardType, ProductImage, CartEntry } from "@/types/storePortal/orders";

interface Props {
  card: ProductCardType;
  cartQty: (rowKey: string) => number;
  setRowQty: (entry: Omit<CartEntry, "qty">, qty: number) => void;
  onLightbox: (images: ProductImage[], index: number) => void;
}

export function ProductCard({ card, cartQty, setRowQty, onLightbox }: Props) {
  const lc = lineColor(card.productLineName);
  const cardImages = card.images && card.images.length > 0 ? card.images : null;
  const thumbUrl = cardImages ? cardImages[0].url : card.imageUrl || null;

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: "#fff", border: "1px solid #d6d0b4" }}
    >
      {/* Card header */}
      <div className="flex gap-3 mb-3">
        {thumbUrl && (
          <button
            onClick={() =>
              onLightbox(cardImages || [{ url: thumbUrl, publicId: "" }], 0)
            }
            style={{
              flexShrink: 0, width: 64, height: 64,
              borderRadius: 6, overflow: "hidden",
              border: "1px solid #e5e0c8",
              cursor: "pointer", background: "none", padding: 0,
            }}
            title="View images"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt={card.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-0.5"
            style={{ color: lc.accent }}
          >
            {card.productLineName}
          </div>
          <div className="text-sm font-bold" style={{ color: "#2a2518" }}>
            {card.name}
          </div>
          {card.description && (
            <div className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>
              {card.description}
            </div>
          )}
          {cardImages && cardImages.length > 1 && (
            <button
              onClick={() => onLightbox(cardImages, 0)}
              style={{
                marginTop: 4, fontSize: 10, color: lc.accent,
                background: "none", border: "none", padding: 0,
                cursor: "pointer", textDecoration: "underline",
              }}
            >
              +{cardImages.length - 1} more photo{cardImages.length > 2 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {card.rows.map((row) => {
          const qty = cartQty(row.rowKey);
          const rowEp = ep(row.price, row.discountPrice, row.onSale);

          const cartEntryBase: Omit<CartEntry, "qty"> = {
            productId: row.productId,
            productLineName: card.productLineName,
            name: card.name,
            pricingType: card.pricingType,
            rowKey: row.rowKey,
            rowLabel: row.label,
            price: row.price,
            discountPrice: row.discountPrice,
            onSale: row.onSale,
          };

          return (
            <div
              key={row.rowKey}
              className="flex items-center justify-between gap-3 py-2"
              style={{ borderTop: "1px solid #f0ece0" }}
            >
              <div className="flex items-baseline gap-3 flex-1 min-w-0">
                {row.label && (
                  <span
                    className="text-sm font-medium w-24 shrink-0"
                    style={{ color: "#4a4535" }}
                  >
                    {row.label}
                  </span>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold" style={{ color: "#c45a1a" }}>
                    ${rowEp.toFixed(2)}
                  </span>
                  {row.onSale && row.discountPrice && (
                    <span className="text-xs line-through" style={{ color: "#9a8f6e" }}>
                      ${row.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "#9a8f6e" }}>/ case</span>
                </div>
              </div>

              {qty === 0 ? (
                <button
                  onClick={() => setRowQty(cartEntryBase, 1)}
                  className="px-3 py-1 rounded text-xs font-medium shrink-0"
                  style={{ background: "#c45a1a", color: "#fff" }}
                >
                  + Add
                </button>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setRowQty(cartEntryBase, qty - 1)}
                    className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                    style={{ background: "#f5f2e8", color: "#6b6045" }}
                  >
                    −
                  </button>
                  <span
                    className="text-xs w-6 text-center font-semibold"
                    style={{ color: "#2a2518" }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setRowQty(cartEntryBase, qty + 1)}
                    className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                    style={{ background: "#f5f2e8", color: "#6b6045" }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
