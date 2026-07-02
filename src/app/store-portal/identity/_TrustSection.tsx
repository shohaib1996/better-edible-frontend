"use client";

import { C } from "./_constants";

export function TrustSection() {
  return (
    <div
      style={{
        background: C.ink,
        color: "#f5f0e8",
        borderRadius: 16,
        padding: "2rem 1.75rem",
        marginBottom: "3rem",
        textAlign: "center",
      }}
    >
      <h2
        style={{ fontFamily: C.serif, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}
      >
        Low risk. High shelf.
      </h2>
      <p
        style={{
          fontSize: "0.95rem",
          color: "#d8d0bd",
          lineHeight: 1.75,
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        We&apos;ve already perfected the gummy — you&apos;re not gambling on a new product, just
        putting your name on one customers already reach for. Fully Oregon-compliant,
        child-resistant packaging, designed and produced by us. You pick a tier, we handle the
        rest.
      </p>
    </div>
  );
}
