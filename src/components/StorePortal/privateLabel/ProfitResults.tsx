"use client";

import { useState } from "react";

interface ProfitMetrics {
  capturedUnits: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
  annualProfit: number;
}

interface ProfitResultsProps {
  metrics: ProfitMetrics;
  retailPrice: number;
  unitPrice: number;
  taxRate: number;
}

export function ProfitResults({ metrics, retailPrice, unitPrice, taxRate }: ProfitResultsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const fmtDec = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #145c2d 0%, #0d2e15 100%)",
        border: "1px solid rgba(26,122,60,0.5)",
        borderRadius: 14,
        padding: "1.5rem",
        textAlign: "center",
        marginBottom: "1rem",
      }}
    >
      <p
        style={{
          fontSize: "0.62rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "0.35rem",
        }}
      >
        Your monthly profit
      </p>
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "3.5rem",
          fontWeight: 700,
          color: "#4ade80",
          lineHeight: 1,
          marginBottom: "0.2rem",
          textShadow: "0 0 40px rgba(26,122,60,0.7)",
        }}
      >
        {fmt(metrics.profit)}
      </div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "1.25rem" }}>
        {metrics.capturedUnits.toLocaleString()} units/mo ·{" "}
        <strong style={{ color: "#4ade80" }}>{metrics.margin.toFixed(0)}% margin</strong>
      </p>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}
      >
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "0.75rem 0.5rem" }}>
          <p
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: "0.25rem",
            }}
          >
            Annual
          </p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: "#4ade80" }}>
            {fmt(metrics.annualProfit)}
          </p>
        </div>
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "0.75rem 0.5rem" }}>
          <p
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: "0.25rem",
            }}
          >
            Per Unit
          </p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>
            {fmtDec(metrics.profit / (metrics.capturedUnits || 1))}
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowDetails((v) => !v)}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          fontSize: "0.65rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        {showDetails ? "Hide breakdown" : "Show breakdown"}
      </button>

      {showDetails && (
        <div
          style={{
            marginTop: "0.75rem",
            textAlign: "left",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              paddingBottom: "0.15rem",
            }}
          >
            <span>
              Revenue ({metrics.capturedUnits} units × {fmtDec(retailPrice / (1 + taxRate))} shelf)
            </span>
            <span style={{ color: "#fff" }}>{fmt(metrics.revenue)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              paddingBottom: "0.15rem",
            }}
          >
            <span>
              Your cost ({fmtDec(unitPrice)}/unit × {metrics.capturedUnits})
            </span>
            <span style={{ color: "#f87171" }}>−{fmt(metrics.cogs)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "0.15rem",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#fff" }}>Your Profit</span>
            <span style={{ color: "#4ade80" }}>{fmt(metrics.profit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
