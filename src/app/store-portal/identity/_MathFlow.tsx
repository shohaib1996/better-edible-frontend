"use client";

import { C, fmt } from "./_constants";

export function MathFlow({ netCost }: { netCost: number }) {
  const retailPremium = 1.0;
  const taxRate = 0.2;
  const taxOnPremium = retailPremium * taxRate;
  const netAfterTax = retailPremium - taxOnPremium;
  const roiPerUnit = ((netAfterTax / netCost) * 100).toFixed(0);

  const step = (label: string, value: string, color: string, sign: string) => (
    <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.faint,
          marginBottom: "0.3rem",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: C.serif, fontSize: "1.25rem", fontWeight: 700, color }}>
        {sign}
        {value}
      </div>
    </div>
  );

  const arrow = (
    <div
      style={{
        color: C.lineStrong,
        fontSize: "1.1rem",
        padding: "0 0.15rem",
        alignSelf: "flex-end",
        marginBottom: "0.15rem",
      }}
    >
      →
    </div>
  );

  return (
    <div
      style={{
        background: C.cream,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "1.1rem 1rem",
        marginTop: "1.1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "0.2rem",
        }}
      >
        {step("You pay", fmt(netCost, 2), C.red, "−")}
        {arrow}
        {step("Customer pays", fmt(retailPremium, 2), C.green, "+")}
        {arrow}
        {step("OR tax (20%)", fmt(taxOnPremium, 2), C.red, "−")}
        {arrow}
        {step("You keep", fmt(netAfterTax, 2), C.green, "+")}
      </div>
      <div
        style={{
          marginTop: "0.9rem",
          paddingTop: "0.8rem",
          borderTop: `1px dashed ${C.lineStrong}`,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: C.muted }}>
          Return on every {fmt(netCost, 2)} pouch:{" "}
        </span>
        <span style={{ fontFamily: C.serif, fontSize: "1.15rem", fontWeight: 700, color: C.orange }}>
          +{roiPerUnit}%
        </span>
      </div>
    </div>
  );
}
