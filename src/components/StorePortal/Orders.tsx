"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import { useGetAllProductsQuery } from "@/redux/api/Products/productsApi";
import { useGetStoreByIdQuery } from "@/redux/api/Stores/stores";
import {
  useGetStoreCreditBalanceQuery,
  useApplyStoreCreditMutation,
} from "@/redux/api/StoreCredit/storeCreditApi";
import { useCreateOrderMutation } from "@/redux/api/orders/orders";
import { buildCards, lineColor, ep } from "@/lib/orderHelpers";
import { Lightbox } from "./orders/Lightbox";
import { CartPanel } from "./orders/CartPanel";
import type { CartEntry, ProductImage, RawProduct } from "@/types/storePortal/orders";

export function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<IStoreUser | null>(null);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("asap");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [lightbox, setLightbox] = useState<{ images: ProductImage[]; index: number } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const didInitCategory = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
      else router.replace("/store-portal/login");
    } catch {
      router.replace("/store-portal/login");
    }
  }, [router]);

  const { data: allProductsData, isLoading: loadingProducts } = useGetAllProductsQuery(undefined);
  const { data: storeInfo } = useGetStoreByIdQuery(user?.storeId || "", { skip: !user?.storeId });
  const { data: creditData } = useGetStoreCreditBalanceQuery(user?.storeId || "", {
    skip: !user?.storeId,
  });
  const [createOrder] = useCreateOrderMutation();
  const [applyStoreCredit] = useApplyStoreCreditMutation();

  const rawProducts: RawProduct[] = Array.isArray(allProductsData)
    ? allProductsData
    : (allProductsData as any)?.products || [];

  const cards = buildCards(rawProducts);

  const liveRep = storeInfo?.rep && typeof storeInfo.rep === "object" ? storeInfo.rep : null;
  const repId: string = (liveRep as any)?._id || "";

  const creditBalance = creditData?.balance ?? 0;

  const categories = Array.from(
    new Map(cards.map((c) => [c.productLineName, c.productLineDisplayOrder])).entries()
  )
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name)
    .filter(Boolean);

  useEffect(() => {
    if (didInitCategory.current || categories.length === 0) return;
    setActiveCategory(categories[0]);
    didInitCategory.current = true;
  }, [categories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleCards = cards.filter((c) => !activeCategory || c.productLineName === activeCategory);

  const cartQty = useCallback(
    (rowKey: string) => cart.find((e) => e.rowKey === rowKey)?.qty ?? 0,
    [cart]
  );

  const setRowQty = useCallback((entry: Omit<CartEntry, "qty">, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((e) => e.rowKey !== entry.rowKey);
      const existing = prev.find((e) => e.rowKey === entry.rowKey);
      if (existing) return prev.map((e) => (e.rowKey === entry.rowKey ? { ...e, qty } : e));
      return [...prev, { ...entry, qty }];
    });
  }, []);

  const cartTotal = cart.reduce(
    (sum, e) => sum + ep(e.price, e.discountPrice, e.onSale) * e.qty,
    0
  );
  const cartItemCount = cart.reduce((sum, e) => sum + e.qty, 0);
  const creditApplied = Math.min(creditBalance, cartTotal);
  const finalTotal = Math.max(0, cartTotal - creditApplied);

  const handleSubmit = async () => {
    if (cart.length === 0) { setSubmitError("Add at least one product."); return; }
    if (!user?.storeId) { setSubmitError("Store ID missing — please sign out and back in."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      await createOrder({
        storeId: user.storeId,
        repId,
        items: cart.map((e) => ({
          product: e.productId,
          unitLabel: e.rowLabel || null,
          qty: e.qty,
          applyDiscount: e.onSale,
        })),
        note: notes,
        deliveryDate: deliveryDate === "asap" ? "ASAP" : deliveryDate,
      }).unwrap();

      if (creditApplied > 0) {
        try {
          await applyStoreCredit({
            storeId: user.storeId,
            orderTotal: cartTotal,
            orderRef: "store-order",
          }).unwrap();
        } catch {
          // order already placed; credit balance refreshes on next load
        }
      }

      setSubmitted(true);
      setCart([]);
      setNotes("");
      setDeliveryDate("asap");
      setCartOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as any)?.data?.message || "Could not submit. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-5"
          style={{ background: "#f0f7f2", color: "#2a7a4e" }}
        >
          ✓
        </div>
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ fontFamily: "Georgia, serif", color: "#2a2518" }}
        >
          Order Submitted
        </h2>
        <p className="text-sm mb-6" style={{ color: "#6b6045" }}>
          Your rep will confirm within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-5 py-2.5 rounded text-sm font-medium"
          style={{ background: "#c45a1a", color: "#fff" }}
        >
          Place Another Order
        </button>
      </div>
    );
  }

  const cartPanelProps = {
    cart,
    cartTotal,
    creditBalance,
    creditApplied,
    finalTotal,
    deliveryDate,
    setDeliveryDate,
    notes,
    setNotes,
    submitError,
    submitting,
    handleSubmit,
    setRowQty,
  };

  return (
    <div>
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <p className="text-sm mb-5" style={{ color: "#6b6045" }}>
        Select products from our current lineup. Your rep will confirm within 24 hours.
      </p>

      {/* Desktop: two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Product catalog */}
        <div className="lg:col-span-2 pb-24 lg:pb-0">
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0"
                  style={{
                    background: activeCategory === cat ? "#c45a1a" : "#fff",
                    color: activeCategory === cat ? "#fff" : "#4a4535",
                    border: "1px solid",
                    borderColor: activeCategory === cat ? "#c45a1a" : "#d6d0b4",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loadingProducts && (
            <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
              Loading products…
            </div>
          )}

          {!loadingProducts && visibleCards.length === 0 && (
            <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
              No products found.
            </div>
          )}

          {!loadingProducts && visibleCards.length > 0 && (
            <div className="space-y-3">
              {visibleCards.map((card) => {
                const lc = lineColor(card.productLineName);
                const cardImages = card.images && card.images.length > 0 ? card.images : null;
                const thumbUrl = cardImages ? cardImages[0].url : card.imageUrl || null;

                return (
                  <div
                    key={card.cardKey}
                    className="p-4 rounded-xl"
                    style={{ background: "#fff", border: "1px solid #d6d0b4" }}
                  >
                    {/* Card header */}
                    <div className="flex gap-3 mb-3">
                      {thumbUrl && (
                        <button
                          onClick={() =>
                            setLightbox({
                              images: cardImages || [{ url: thumbUrl, publicId: "" }],
                              index: 0,
                            })
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
                            onClick={() => setLightbox({ images: cardImages, index: 0 })}
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
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart sidebar */}
        <div className="hidden lg:block space-y-4">
          <div
            className="p-5 rounded-xl"
            style={{ background: "#fff", border: "1px solid #d6d0b4" }}
          >
            <CartPanel {...cartPanelProps} />
          </div>
        </div>
      </div>

      {/* Mobile sticky cart footer */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 100,
          background: "#2a2518",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.35)",
        }}
      >
        <button
          onClick={() => setCartOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 16px",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f5f2e8" }}>
              {cartItemCount === 0
                ? "Your Order"
                : `${cartItemCount} item${cartItemCount !== 1 ? "s" : ""}`}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e8a06a" }}>
              — ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span
            style={{
              fontSize: 20, color: "#f5f2e8",
              transform: cartOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            ▲
          </span>
        </button>

        {cartOpen && (
          <div
            style={{
              maxHeight: "70vh", overflowY: "auto",
              padding: "0 16px 24px",
              borderTop: "1px solid #3d3526",
            }}
          >
            <CartPanel {...cartPanelProps} />
          </div>
        )}
      </div>
    </div>
  );
}
