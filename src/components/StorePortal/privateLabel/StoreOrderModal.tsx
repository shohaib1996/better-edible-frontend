"use client";

import type { IStoreOrder } from "@/types/privateLabel/gummyBuilder";
import { ORDER_STATUS_LABELS, fmtDate, fmtCurrency } from "@/lib/privateLabelHelpers";

interface StoreOrderModalProps {
  order: IStoreOrder;
  onClose: () => void;
}

type OrderItem = {
  flavorName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  label?: { flavorName?: string };
};

export function StoreOrderModal({ order, onClose }: StoreOrderModalProps) {
  const items = ((order as { items?: unknown[] }).items ?? []) as OrderItem[];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(42,37,24,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="scrollbar-hidden"
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "1.5rem",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#9a8f6e",
            fontSize: "1.25rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div className="text-base font-bold mb-4" style={{ color: "#2a2518" }}>
          Order Details
        </div>

        <div className="space-y-1 text-sm mb-4">
          {[
            ["Date", fmtDate(order.createdAt)],
            ["Status", ORDER_STATUS_LABELS[order.status] || order.status],
            ["Est. Delivery", order.expectedDeliveryDate ? fmtDate(order.expectedDeliveryDate) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span style={{ color: "#9a8f6e" }}>{k}</span>
              <span style={{ color: "#2a2518", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <div
          className="rounded-lg overflow-hidden mb-4"
          style={{ border: "1px solid #e5e0c8" }}
        >
          {items.map((it, i) => {
            const name = it.flavorName || it.label?.flavorName || "Item";
            return (
              <div
                key={i}
                className="flex justify-between px-3 py-2 text-xs"
                style={{ borderBottom: i < items.length - 1 ? "1px solid #f0ece0" : "none" }}
              >
                <div>
                  <div style={{ color: "#2a2518", fontWeight: 500 }}>{name}</div>
                  {it.quantity && (
                    <div style={{ color: "#9a8f6e" }}>
                      {it.quantity.toLocaleString()} units
                      {it.unitPrice ? ` · ${fmtCurrency(it.unitPrice)}/ea` : ""}
                    </div>
                  )}
                </div>
                <div className="font-semibold" style={{ color: "#c45a1a" }}>
                  {it.lineTotal ? fmtCurrency(it.lineTotal) : ""}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-sm font-semibold">
          <span style={{ color: "#2a2518" }}>Total</span>
          <span style={{ color: "#c45a1a" }}>{fmtCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
