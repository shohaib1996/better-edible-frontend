"use client";

import { C, fmt } from "./_constants";
import { MathFlow } from "./_MathFlow";

interface TierCardProps {
  name: string;
  price: number;
  pouches: number;
  netCost: number;
  discount: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}

export function TierCard({
  name,
  price,
  pouches,
  netCost,
  discount,
  features,
  highlight,
  badge,
  selected,
  onSelect,
}: TierCardProps) {
  const netAfterTax = 0.8;
  const totalNetGain = pouches * netAfterTax;
  const discountSavings = pouches * discount;
  const totalAdvantage = totalNetGain + discountSavings;

  return (
    <div
      style={{
        position: "relative",
        background: C.creamCard,
        border: selected
          ? `2px solid ${C.orange}`
          : highlight
          ? `2px solid ${C.orangeSoft}`
          : `1px solid ${C.lineStrong}`,
        borderRadius: 16,
        padding: "1.75rem 1.5rem 1.5rem",
        boxShadow: highlight
          ? "0 12px 32px rgba(196,90,26,0.12)"
          : "0 4px 14px rgba(42,37,24,0.05)",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s",
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.orange,
            color: "#fff",
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0.3rem 0.85rem",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.15rem",
        }}
      >
        <h3
          style={{
            fontFamily: C.serif,
            fontSize: "1.4rem",
            fontWeight: 700,
            margin: 0,
            color: C.ink,
          }}
        >
          {name}
        </h3>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.4rem",
          marginBottom: "1rem",
        }}
      >
        <span style={{ fontFamily: C.serif, fontSize: "2rem", fontWeight: 700, color: C.orange }}>
          {fmt(price)}
        </span>
        <span style={{ fontSize: "0.72rem", color: C.faint }}>one-time</span>
      </div>

      <div
        style={{
          background: highlight ? "rgba(45,122,58,0.06)" : C.cream,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: "0.85rem 1rem",
          marginBottom: "1.1rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.faint,
            marginBottom: "0.25rem",
          }}
        >
          Total advantage vs. unbranded
        </div>
        <div
          style={{
            fontFamily: C.serif,
            fontSize: "1.85rem",
            fontWeight: 700,
            color: C.green,
            lineHeight: 1,
          }}
        >
          {fmt(totalAdvantage)}
        </div>
        <div style={{ fontSize: "0.7rem", color: C.muted, marginTop: "0.3rem" }}>
          across {pouches.toLocaleString()} units
        </div>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 0.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
        }}
      >
        {features.map((f, i) => (
          <li
            key={i}
            style={{ display: "flex", gap: "0.55rem", fontSize: "0.85rem", color: C.muted, lineHeight: 1.5 }}
          >
            <span style={{ color: C.orange, fontWeight: 800, flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <MathFlow netCost={netCost} />

      <div
        style={{
          fontSize: "0.72rem",
          color: C.faint,
          textAlign: "center",
          margin: "0.85rem 0 1rem",
        }}
      >
        +{fmt(totalNetGain)} net margin · +{fmt(discountSavings)} production savings
      </div>

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginTop: "auto",
          padding: "0.85rem",
          background: selected ? C.orange : highlight ? C.orange : "#fff",
          color: selected || highlight ? "#fff" : C.orange,
          border: `1.5px solid ${C.orange}`,
          borderRadius: 10,
          fontSize: "0.85rem",
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: C.sans,
          letterSpacing: "0.02em",
        }}
      >
        {selected ? "✓ Selected" : `Choose ${name}`}
      </button>
    </div>
  );
}
