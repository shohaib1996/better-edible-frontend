"use client";

import type { CartEntry } from "@/types/storePortal/orders";
import { CartPanel } from "./CartPanel";

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

interface Props {
  cartItemCount: number;
  cartTotal: number;
  cartOpen: boolean;
  onToggle: () => void;
  cartPanelProps: CartPanelProps;
}

export function MobileCartFooter({ cartItemCount, cartTotal, cartOpen, onToggle, cartPanelProps }: Props) {
  return (
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
        onClick={onToggle}
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
            —{" "}
            ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  );
}
