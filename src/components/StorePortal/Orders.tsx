"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    if (cart.length === 0) {
      setSubmitError("Add at least one product.");
      return;
    }
    if (!user?.storeId) {
      setSubmitError("Store ID missing — please sign out and back in.");
      return;
    }
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
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-5 bg-[#f0f7f2] text-[#2a7a4e]">
          ✓
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-[#2a2518]" style={{ fontFamily: "Georgia, serif" }}>
          Order Submitted
        </h2>
        <p className="text-sm mb-6 text-[#6b6045]">Your rep will confirm within 24 hours.</p>
        <Button
          onClick={() => setSubmitted(false)}
          className="bg-[#c45a1a] hover:bg-[#b04d15] text-white"
        >
          Place Another Order
        </Button>
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

      <p className="text-sm mb-5 text-[#6b6045]">
        Select products from our current lineup. Your rep will confirm within 24 hours.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Product catalog */}
        <div className="lg:col-span-2 pb-24 lg:pb-0">
          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={activeCategory === cat ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? "bg-[#c45a1a] hover:bg-[#b04d15] border-[#c45a1a] text-white shrink-0"
                      : "border-[#d6d0b4] text-[#4a4535] hover:border-[#c45a1a] hover:text-[#c45a1a] shrink-0"
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {loadingProducts && (
            <p className="text-sm py-12 text-center text-[#9a8f6e]">Loading products…</p>
          )}

          {!loadingProducts && visibleCards.length === 0 && (
            <p className="text-sm py-12 text-center text-[#9a8f6e]">No products found.</p>
          )}

          {!loadingProducts && visibleCards.length > 0 && (
            <div className="flex flex-col gap-3">
              {visibleCards.map((card) => {
                const lc = lineColor(card.productLineName);
                const cardImages = card.images && card.images.length > 0 ? card.images : null;
                const thumbUrl = cardImages ? cardImages[0].url : card.imageUrl || null;

                return (
                  <Card
                    key={card.cardKey}
                    className="border-[#d6d0b4] gap-0 py-0"
                  >
                    <CardContent className="p-4">
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
                            className="shrink-0 w-16 h-16 rounded-md overflow-hidden border border-[#e5e0c8] cursor-pointer bg-transparent p-0"
                            title="View images"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumbUrl}
                              alt={card.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                            style={{ color: lc.accent }}
                          >
                            {card.productLineName}
                          </p>
                          <p className="text-sm font-bold text-[#2a2518]">{card.name}</p>
                          {card.description && (
                            <p className="text-xs mt-0.5 text-[#9a8f6e]">{card.description}</p>
                          )}
                          {cardImages && cardImages.length > 1 && (
                            <button
                              onClick={() => setLightbox({ images: cardImages, index: 0 })}
                              className="mt-1 text-[10px] bg-transparent border-none p-0 cursor-pointer underline"
                              style={{ color: lc.accent }}
                            >
                              +{cardImages.length - 1} more photo{cardImages.length > 2 ? "s" : ""}
                            </button>
                          )}
                        </div>
                      </div>

                      <Separator className="mb-0" />

                      {/* Rows */}
                      <div className="flex flex-col">
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
                              className="flex items-center justify-between gap-3 py-2 border-b border-[#f0ece0] last:border-0"
                            >
                              <div className="flex items-baseline gap-3 flex-1 min-w-0">
                                {row.label && (
                                  <span className="text-sm font-medium w-24 shrink-0 text-[#4a4535]">
                                    {row.label}
                                  </span>
                                )}
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-bold text-[#c45a1a]">
                                    ${rowEp.toFixed(2)}
                                  </span>
                                  {row.onSale && row.discountPrice && (
                                    <span className="text-xs line-through text-[#9a8f6e]">
                                      ${row.price.toFixed(2)}
                                    </span>
                                  )}
                                  <span className="text-xs text-[#9a8f6e]">/ case</span>
                                </div>
                              </div>

                              {qty === 0 ? (
                                <Button
                                  size="sm"
                                  onClick={() => setRowQty(cartEntryBase, 1)}
                                  className="bg-[#c45a1a] hover:bg-[#b04d15] text-white shrink-0"
                                >
                                  + Add
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    onClick={() => setRowQty(cartEntryBase, qty - 1)}
                                    className="h-6 w-6 text-xs rounded"
                                  >
                                    −
                                  </Button>
                                  <span className="text-xs w-6 text-center font-semibold text-[#2a2518]">
                                    {qty}
                                  </span>
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    onClick={() => setRowQty(cartEntryBase, qty + 1)}
                                    className="h-6 w-6 text-xs rounded"
                                  >
                                    +
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart sidebar */}
        <div className="hidden lg:block">
          <Card className="border-[#d6d0b4] gap-0 py-0">
            <CardContent className="p-5">
              <CartPanel {...cartPanelProps} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky cart footer */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#2a2518] shadow-[0_-4px_20px_rgba(0,0,0,0.35)]"
      >
        <button
          onClick={() => setCartOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-5 bg-transparent border-none cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🛒</span>
            <span className="text-sm font-semibold text-[#f5f2e8]">
              {cartItemCount === 0
                ? "Your Order"
                : `${cartItemCount} item${cartItemCount !== 1 ? "s" : ""}`}
            </span>
            <span className="text-sm font-bold text-[#e8a06a]">
              — ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span
            className="text-xl text-[#f5f2e8] transition-transform duration-200"
            style={{ transform: cartOpen ? "rotate(180deg)" : "none" }}
          >
            ▲
          </span>
        </button>

        {cartOpen && (
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-6 border-t border-[#3d3526]">
            <CartPanel {...cartPanelProps} />
          </div>
        )}
      </div>
    </div>
  );
}
