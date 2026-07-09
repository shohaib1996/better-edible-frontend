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
import { buildCards, ep } from "@/lib/orderHelpers";
import { Lightbox } from "./orders/Lightbox";
import { CartPanel } from "./orders/CartPanel";
import { OrderSubmittedScreen } from "./orders/OrderSubmittedScreen";
import { CategoryTabs } from "./orders/CategoryTabs";
import { ProductCatalog } from "./orders/ProductCatalog";
import { MobileCartFooter } from "./orders/MobileCartFooter";
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
    return <OrderSubmittedScreen onReset={() => setSubmitted(false)} />;
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
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          <ProductCatalog
            visibleCards={visibleCards}
            loadingProducts={loadingProducts}
            cartQty={cartQty}
            setRowQty={setRowQty}
            onLightbox={(images, index) => setLightbox({ images, index })}
          />
        </div>

        {/* Desktop cart sidebar */}
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
      <MobileCartFooter
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        cartOpen={cartOpen}
        onToggle={() => setCartOpen((o) => !o)}
        cartPanelProps={cartPanelProps}
      />
    </div>
  );
}
