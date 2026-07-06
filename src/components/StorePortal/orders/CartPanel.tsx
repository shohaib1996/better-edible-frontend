"use client";

import { lineColor, ep } from "@/lib/orderHelpers";
import type { CartEntry } from "@/types/storePortal/orders";

interface CartPanelProps {
  cart: CartEntry[];
  cartTotal: number;
  creditBalance: number;
  creditApplied: number;
  finalTotal: number;
  deliveryDate: string;
  setDeliveryDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  submitError: string;
  submitting: boolean;
  handleSubmit: () => void;
  setRowQty: (entry: Omit<CartEntry, "qty">, qty: number) => void;
}

export function CartPanel({
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
}: CartPanelProps) {
  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#9a8f6e" }}>
        Your Order ({cart.length} item{cart.length !== 1 ? "s" : ""})
      </h3>

      {cart.length > 0 ? (
        <div className="text-sm py-6 text-center" style={{ color: "#9a8f6e" }}>
          No items added yet
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {cart.map((item) => {
            const itemEp = ep(item.price, item.discountPrice, item.onSale);
            return (
              <div key={item.rowKey} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                    style={{ color: lineColor(item.productLineName).accent }}
                  >
                    {item.productLineName}
                  </div>
                  <div className="text-xs font-medium leading-snug" style={{ color: "#2a2518" }}>
                    {item.rowLabel ? `${item.name} — ${item.rowLabel}` : item.name}
                  </div>
                  <div className="text-xs" style={{ color: "#9a8f6e" }}>
                    ${itemEp.toFixed(2)} × {item.qty} = ${(itemEp * item.qty).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setRowQty(item, item.qty - 1)}
                    className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                    style={{ background: "#f5f2e8", color: "#6b6045" }}
                  >
                    −
                  </button>
                  <span className="text-xs w-6 text-center" style={{ color: "#2a2518" }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => setRowQty(item, item.qty + 1)}
                    className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                    style={{ background: "#f5f2e8", color: "#6b6045" }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <div className="py-3 mb-4" style={{ borderTop: "1px solid #e5e0c8" }}>
          {creditApplied > 0 ? (
            <>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: "#6b6045" }}>Subtotal</span>
                <span style={{ color: "#2a2518" }}>
                  ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: "#2a7a4e" }}>Store credit applied</span>
                <span style={{ color: "#2a7a4e", fontWeight: 600 }}>
                  −${creditApplied.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                className="flex justify-between text-sm font-semibold pt-2"
                style={{ borderTop: "1px dashed #e5e0c8" }}
              >
                <span style={{ color: "#2a2518" }}>Estimated Total</span>
                <span style={{ color: "#c45a1a" }}>
                  ${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs mt-1.5" style={{ color: "#9a8f6e" }}>
                ${creditBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credit available
                {" · "}
                ${Math.max(0, creditBalance - creditApplied).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will remain
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm font-semibold">
              <span style={{ color: "#2a2518" }}>Estimated Total</span>
              <span style={{ color: "#c45a1a" }}>
                ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mb-3">
        <label
          className="text-xs font-medium uppercase tracking-wider mb-1.5 block"
          style={{ color: "#6b6045" }}
        >
          Desired Delivery Date
        </label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setDeliveryDate("asap")}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: deliveryDate === "asap" ? "#c45a1a" : "#fff",
              color: deliveryDate === "asap" ? "#fff" : "#4a4535",
              border: "1px solid",
              borderColor: deliveryDate === "asap" ? "#c45a1a" : "#d6d0b4",
            }}
          >
            ASAP
          </button>
          <button
            onClick={() => setDeliveryDate("")}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: deliveryDate !== "asap" ? "#c45a1a" : "#fff",
              color: deliveryDate !== "asap" ? "#fff" : "#4a4535",
              border: "1px solid",
              borderColor: deliveryDate !== "asap" ? "#c45a1a" : "#d6d0b4",
            }}
          >
            Pick a date
          </button>
        </div>
        {deliveryDate !== "asap" && (
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full text-sm px-3 py-2 rounded"
            style={{ background: "#fafaf7", border: "1px solid #d6d0b4", color: "#2a2518", outline: "none" }}
          />
        )}
      </div>

      <div className="mb-4">
        <label
          className="text-xs font-medium uppercase tracking-wider mb-1.5 block"
          style={{ color: "#6b6045" }}
        >
          Order Notes (optional)
        </label>
        <textarea
          placeholder="Delivery instructions, special requests…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full text-sm px-3 py-2 rounded resize-none"
          style={{ background: "#fafaf7", border: "1px solid #d6d0b4", color: "#2a2518", outline: "none" }}
        />
      </div>

      {submitError && (
        <div
          className="text-xs mb-3 px-3 py-2 rounded"
          style={{ background: "#fdf3ec", color: "#c45a1a", border: "1px solid #f0c8a8" }}
        >
          {submitError}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || cart.length === 0}
        className="w-full py-2.5 rounded text-sm font-semibold transition-colors"
        style={{
          background: submitting || cart.length === 0 ? "#e5e0c8" : "#c45a1a",
          color: submitting || cart.length === 0 ? "#9a8f6e" : "#fff",
        }}
      >
        {submitting ? "Submitting…" : "Submit Order"}
      </button>

      <p className="text-xs text-center mt-2" style={{ color: "#9a8f6e" }}>
        Rep confirms within 24 hours.
      </p>
    </>
  );
}
