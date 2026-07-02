"use client";

import type { IStoreOrder } from "@/types/privateLabel/gummyBuilder";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  fmtDate,
  fmtCurrency,
} from "@/lib/privateLabelHelpers";

type OrderItem = {
  flavorName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  label?: { flavorName?: string };
};

interface OrdersTabProps {
  orders: IStoreOrder[];
  onViewOrder: (order: IStoreOrder) => void;
}

export function OrdersTab({ orders, onViewOrder }: OrdersTabProps) {
  if (orders.length === 0) {
    return (
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: "#fff", border: "1px solid #d6d0b4" }}
      >
        <div className="text-3xl mb-3">📦</div>
        <p className="text-sm font-medium" style={{ color: "#2a2518" }}>
          No orders yet
        </p>
        <p className="text-xs mt-1" style={{ color: "#9a8f6e" }}>
          Orders from your approved labels will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const statusColors = ORDER_STATUS_COLORS[order.status] || { bg: "#f5f2e8", text: "#6b6045" };
        const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
        const items = ((order as { items?: unknown[] }).items ?? []) as OrderItem[];

        return (
          <div
            key={order._id}
            className="rounded-xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #d6d0b4" }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: "#fafaf7", borderBottom: "1px solid #f0ece0" }}
            >
              <div>
                <div className="text-xs font-semibold" style={{ color: "#2a2518" }}>
                  {fmtDate(order.createdAt)}
                </div>
                {order.expectedDeliveryDate && (
                  <div className="text-[10px]" style={{ color: "#9a8f6e" }}>
                    Est. delivery: {fmtDate(order.expectedDeliveryDate)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: statusColors.bg, color: statusColors.text }}
                >
                  {statusLabel}
                </span>
                <span className="text-sm font-bold" style={{ color: "#c45a1a" }}>
                  {fmtCurrency(order.total)}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              {items.map((it, i) => {
                const name = it.flavorName || it.label?.flavorName || "Item";
                return (
                  <div
                    key={i}
                    className="flex justify-between text-xs py-1"
                    style={{ borderBottom: i < items.length - 1 ? "1px solid #f0ece0" : "none" }}
                  >
                    <span style={{ color: "#2a2518" }}>
                      {name}{" "}
                      {it.quantity ? (
                        <span style={{ color: "#9a8f6e" }}>
                          × {it.quantity.toLocaleString()}
                        </span>
                      ) : null}
                    </span>
                    <span style={{ color: "#6b6045" }}>
                      {it.lineTotal ? fmtCurrency(it.lineTotal) : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onViewOrder(order)}
              className="w-full py-2 text-xs"
              style={{
                background: "none",
                border: "none",
                borderTop: "1px solid #f0ece0",
                color: "#9a8f6e",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              View details
            </button>
          </div>
        );
      })}
    </div>
  );
}
