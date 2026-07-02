"use client";

import { useState } from "react";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import type { IStoreOrder } from "@/types/privateLabel/gummyBuilder";
import type { IPrivateLabelProduct } from "@/types/privateLabel/privateLabel";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { useGetMyOrdersQuery, usePlaceOrderMutation } from "@/redux/api/PrivateLabel/storeOrderApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import {
  LABEL_STAGE_LABELS,
  ORDER_MINIMUM,
  UNIT_OPTIONS,
  fmtCurrency,
  isPoolEligible,
  buildCannabinoidKey,
  normCannabinoids,
} from "@/lib/privateLabelHelpers";
import { InProgressLabels } from "./InProgressLabels";
import { OrdersTab } from "./OrdersTab";
import { LabelDetailsModal } from "./LabelDetailsModal";
import { StoreOrderModal } from "./StoreOrderModal";
import { PoolModal } from "./PoolModal";

function isOrderable(lbl: IStoreDraftLabel) {
  return lbl.currentStage === "ready_for_production";
}

function unitPriceFor(lbl: IStoreDraftLabel, priceMap: Record<string, number>): number {
  if (typeof lbl.unitCost === "number" && lbl.unitCost > 0) return lbl.unitCost;
  return priceMap[(lbl.productType || "").trim().toLowerCase()] || 0;
}

interface AccountTabProps {
  storeId: string;
  enabled: boolean;
  onSwitchToBuilder: () => void;
}

export function AccountTab({ storeId, enabled, onSwitchToBuilder }: AccountTabProps) {
  const [accountSubTab, setAccountSubTab] = useState<"labels" | "orders">("labels");
  const [orderQty, setOrderQty] = useState<Record<string, number>>({});
  const [orderMsg, setOrderMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [modalLabel, setModalLabel] = useState<IStoreDraftLabel | null>(null);
  const [modalOrder, setModalOrder] = useState<IStoreOrder | null>(null);
  const [poolKey, setPoolKey] = useState<string | null>(null);
  const [poolRatioLabel, setPoolRatioLabel] = useState("");

  const skip = !storeId || !enabled;

  const { data: approvedData, isLoading: loadingApproved } = useGetMyLabelsQuery(
    { storeId, stageGroup: "approved", limit: 100 },
    { skip },
  );
  const { data: inProgressData, isLoading: loadingInProgress } = useGetMyLabelsQuery(
    { storeId, stageGroup: "in_progress", limit: 100 },
    { skip },
  );
  const { data: ordersData, isLoading: loadingOrders } = useGetMyOrdersQuery(
    { storeId, limit: 50 },
    { skip },
  );
  const { data: productsData } = useGetPrivateLabelProductsQuery({ activeOnly: false }, { skip });

  const [placeOrder, { isLoading: placingOrder }] = usePlaceOrderMutation();

  const approvedLabels: IStoreDraftLabel[] = approvedData?.labels ?? [];
  const inProgressLabels: IStoreDraftLabel[] = inProgressData?.labels ?? [];
  const orders: IStoreOrder[] = ordersData?.orders ?? [];
  const allLabels = [...approvedLabels, ...inProgressLabels];
  const isLoading = loadingApproved || loadingInProgress || loadingOrders;

  const priceMap: Record<string, number> = {};
  (productsData?.products ?? []).forEach((p: IPrivateLabelProduct) => {
    if (p.name && typeof p.unitPrice === "number") {
      priceMap[p.name.trim().toLowerCase()] = p.unitPrice;
    }
  });

  const orderLines = approvedLabels
    .filter((l) => isOrderable(l) && (orderQty[l._id] || 0) > 0)
    .map((l) => ({
      label: l,
      quantity: orderQty[l._id],
      lineTotal: unitPriceFor(l, priceMap) * orderQty[l._id],
      pooled: isPoolEligible(l.cannabinoids),
    }));

  const advancingLines = orderLines.filter((x) => !x.pooled);
  const pooledLines = orderLines.filter((x) => x.pooled);
  const orderTotal = advancingLines.reduce((s, x) => s + x.lineTotal, 0);
  const meetsMinimum = advancingLines.length === 0 ? true : orderTotal >= ORDER_MINIMUM;
  const canSubmitOrder = orderLines.length > 0 && meetsMinimum && !placingOrder;

  const openPoolModal = (lbl: IStoreDraftLabel) => {
    const key = buildCannabinoidKey(lbl.cannabinoids);
    if (!key) return;
    setPoolRatioLabel(
      normCannabinoids(lbl.cannabinoids).map((c) => `${c.name} ${c.mg}mg`).join(" + "),
    );
    setPoolKey(key);
  };

  const handleSubmitOrder = async () => {
    if (!canSubmitOrder) return;
    setOrderMsg(null);
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 21);
    try {
      await placeOrder({
        storeId,
        deliveryDate: delivery.toISOString(),
        items: orderLines.map((x) => ({ labelId: x.label._id, quantity: x.quantity })),
      }).unwrap();
      setOrderMsg({ type: "ok", text: "Order placed successfully." });
      setOrderQty({});
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { data?: { message?: string } })?.data?.message ||
            "Could not place order. Please try again.";
      setOrderMsg({ type: "err", text: msg });
    }
  };

  return (
    <div style={{ marginBottom: 80 }}>
      {/* Sub-tab nav */}
      <div className="flex gap-2 mb-4">
        {(["labels", "orders"] as const).map((st) => (
          <button
            key={st}
            onClick={() => setAccountSubTab(st)}
            className="px-4 py-1.5 rounded text-sm font-semibold transition-colors"
            style={{
              background: accountSubTab === st ? "#c45a1a" : "#f0ece0",
              color: accountSubTab === st ? "#fff" : "#6b6045",
              border: `1px solid ${accountSubTab === st ? "#c45a1a" : "#d6d0b4"}`,
            }}
          >
            {st === "labels"
              ? `My Labels${allLabels.length ? ` (${allLabels.length})` : ""}`
              : `My Orders${orders.length ? ` (${orders.length})` : ""}`}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-sm" style={{ color: "#9a8f6e" }}>
          Loading…
        </div>
      )}

      {/* My Labels */}
      {!isLoading && accountSubTab === "labels" && (
        <div>
          {allLabels.length === 0 ? (
            <div
              className="rounded-xl p-10 text-center"
              style={{ background: "#fff", border: "1px solid #d6d0b4" }}
            >
              <div className="text-3xl mb-3">🏷️</div>
              <p className="text-sm font-medium" style={{ color: "#2a2518" }}>No labels yet</p>
              <p className="text-xs mt-1" style={{ color: "#9a8f6e" }}>
                Submit your first gummy line using the Builder tab.
              </p>
              <button
                onClick={onSwitchToBuilder}
                className="mt-4 px-4 py-2 rounded text-sm font-medium"
                style={{ background: "#c45a1a", color: "#fff" }}
              >
                Go to Builder
              </button>
            </div>
          ) : (
            <>
              {/* Approved labels */}
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-bold text-sm" style={{ color: "#2a2518" }}>
                  Approved labels
                </h3>
                <span className="text-xs" style={{ color: "#9a8f6e" }}>
                  Order anytime · {fmtCurrency(ORDER_MINIMUM)} minimum
                </span>
              </div>
              {approvedLabels.length === 0 ? (
                <div
                  className="rounded-xl p-6 text-center mb-4"
                  style={{ background: "#fff", border: "1px dashed #d6d0b4" }}
                >
                  <p className="text-xs" style={{ color: "#9a8f6e" }}>
                    No approved labels yet. Approved lines will appear here once ready.
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden mb-4"
                  style={{ background: "#fff", border: "1px solid #d6d0b4" }}
                >
                  {approvedLabels.map((lbl, idx) => {
                    const orderable = isOrderable(lbl);
                    const price = unitPriceFor(lbl, priceMap);
                    const qty = orderQty[lbl._id] || 0;
                    const lineTot = orderable ? price * qty : 0;
                    const poolElig = isPoolEligible(lbl.cannabinoids);
                    return (
                      <div
                        key={lbl._id}
                        className="px-4 py-3 flex items-center gap-3"
                        style={{ borderTop: idx === 0 ? "none" : "1px solid #f0ece0" }}
                      >
                        <button
                          onClick={() => setModalLabel(lbl)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          {lbl.gummyColorHex && (
                            <div
                              className="w-9 h-9 rounded-full shrink-0"
                              style={{ background: lbl.gummyColorHex, border: "1px solid rgba(0,0,0,0.08)" }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate" style={{ color: "#2a2518" }}>
                              {lbl.flavorName}
                              <span className="ml-1 text-[11px] font-normal" style={{ color: "#c45a1a" }}>ⓘ</span>
                            </div>
                            <div className="text-xs" style={{ color: "#9a8f6e" }}>
                              {lbl.productType || "Custom Gummy"}
                              {price > 0 ? ` · ${fmtCurrency(price)}/unit` : ""}
                            </div>
                          </div>
                        </button>
                        {poolElig && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openPoolModal(lbl); }}
                            className="text-[10px] px-2 py-1 rounded-full font-bold shrink-0"
                            style={{ background: "#eef2fb", color: "#3a5fa8", border: "1px solid #cdd9f0", cursor: "pointer" }}
                          >
                            POOL ELIGIBLE
                          </button>
                        )}
                        {orderable ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <select
                              value={qty || ""}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                setOrderQty((prev) => {
                                  const next = { ...prev };
                                  if (!v) delete next[lbl._id];
                                  else next[lbl._id] = v;
                                  return next;
                                });
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                border: "1px solid #d6d0b4",
                                background: "#fff",
                                color: "#2a2518",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <option value="">Select</option>
                              {UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>{u.toLocaleString()} units</option>
                              ))}
                            </select>
                            <div className="text-right" style={{ minWidth: 78 }}>
                              {poolElig && qty ? (
                                <div className="text-[10px] font-bold leading-tight" style={{ color: "#3a5fa8" }}>
                                  WAITING<br />ON POOL
                                </div>
                              ) : (
                                <div className="text-sm font-bold" style={{ color: qty ? "#2a2518" : "#c8bfa0" }}>
                                  {fmtCurrency(lineTot)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span
                            className="text-[11px] px-2 py-1 rounded-full font-medium shrink-0"
                            style={{ background: "#fdf3e8", color: "#c45a1a" }}
                          >
                            {LABEL_STAGE_LABELS[lbl.currentStage] || "In production"}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Order summary footer */}
                  <div
                    className="px-4 py-3"
                    style={{ borderTop: "2px solid #f0ece0", background: "#faf8f1" }}
                  >
                    {orderMsg && (
                      <div
                        className="rounded px-3 py-2 text-xs mb-2"
                        style={{
                          background: orderMsg.type === "ok" ? "#eef7f0" : "#fdf0ec",
                          color: orderMsg.type === "ok" ? "#2a7a4e" : "#c45a1a",
                          border: `1px solid ${orderMsg.type === "ok" ? "#bfe3cb" : "#f5c8b0"}`,
                        }}
                      >
                        {orderMsg.text}
                      </div>
                    )}
                    {pooledLines.length > 0 && (
                      <div
                        className="text-[11px] mb-2 rounded px-2 py-1"
                        style={{ color: "#3a5fa8", background: "#eef2fb", border: "1px solid #cdd9f0" }}
                      >
                        {pooledLines.length} pool-eligible line
                        {pooledLines.length !== 1 ? "s" : ""} will wait on pool — not counted
                        toward minimum.
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: "#6b6045" }}>
                        {orderLines.length > 0
                          ? `${orderLines.length} label${orderLines.length > 1 ? "s" : ""} selected`
                          : "Select quantities to order"}
                      </span>
                      <span className="text-base font-bold" style={{ color: "#2a2518" }}>
                        {fmtCurrency(orderTotal)}
                      </span>
                    </div>
                    {!meetsMinimum && advancingLines.length > 0 && (
                      <p className="text-[11px] mb-2" style={{ color: "#9a8f6e" }}>
                        {fmtCurrency(ORDER_MINIMUM - orderTotal)} more to reach{" "}
                        {fmtCurrency(ORDER_MINIMUM)} minimum
                      </p>
                    )}
                    <button
                      onClick={handleSubmitOrder}
                      disabled={!canSubmitOrder}
                      className="w-full py-2 rounded text-sm font-semibold transition-colors"
                      style={{
                        background: canSubmitOrder ? "#c45a1a" : "#e5e0c8",
                        color: canSubmitOrder ? "#fff" : "#9a8f6e",
                      }}
                    >
                      {placingOrder ? "Placing Order…" : "Place Order"}
                    </button>
                  </div>
                </div>
              )}

              <InProgressLabels labels={inProgressLabels} />
            </>
          )}
        </div>
      )}

      {/* My Orders */}
      {!isLoading && accountSubTab === "orders" && (
        <OrdersTab orders={orders} onViewOrder={setModalOrder} />
      )}

      {/* Modals */}
      {modalLabel && <LabelDetailsModal label={modalLabel} onClose={() => setModalLabel(null)} />}
      {modalOrder && <StoreOrderModal order={modalOrder} onClose={() => setModalOrder(null)} />}
      {poolKey && (
        <PoolModal
          poolKey={poolKey}
          poolRatioLabel={poolRatioLabel}
          onClose={() => setPoolKey(null)}
        />
      )}
    </div>
  );
}
