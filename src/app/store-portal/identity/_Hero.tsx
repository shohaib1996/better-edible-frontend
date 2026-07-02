"use client";

import { C } from "./_constants";
import { StatPill } from "./_Bits";

export function Hero({ onScrollToForm }: { onScrollToForm: () => void }) {
  return (
    <div style={{ background: C.ink, color: "#f5f0e8", padding: "3.5rem 1.5rem 3rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            fontSize: "0.66rem",
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.orangeSoft,
            marginBottom: "1rem",
          }}
        >
          Private Label Program
        </p>
        <h1
          style={{
            fontFamily: C.serif,
            fontSize: "clamp(2.1rem, 7vw, 3.4rem)",
            fontWeight: 700,
            lineHeight: 1.12,
            margin: "0 0 1.25rem",
          }}
        >
          Own Your Brand.
          <br />
          <span style={{ color: C.orangeSoft }}>Own Your Shelf.</span>
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#d8d0bd",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: "0 auto 0.6rem",
          }}
        >
          The same gummy your customers already love — now in <em>your</em> packaging, under{" "}
          <em>your</em> name, exclusive to your store.
        </p>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#f5f0e8",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: "0 auto 2rem",
            fontWeight: 600,
          }}
        >
          Pay <span style={{ color: C.orangeSoft }}>$0.20 more</span> per bag. Sell it for{" "}
          <span style={{ color: C.orangeSoft }}>$1.00 more</span>.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.5rem 0",
            borderTop: "1px solid rgba(245,240,232,0.15)",
            borderBottom: "1px solid rgba(245,240,232,0.15)",
            padding: "1.4rem 0",
            marginBottom: "2rem",
          }}
        >
          <StatPill big="5×" small="Return on cost" />
          <div style={{ width: 1, background: "rgba(245,240,232,0.15)" }} />
          <StatPill big="$0.80" small="Kept per bag" />
          <div style={{ width: 1, background: "rgba(245,240,232,0.15)" }} />
          <StatPill big="100%" small="Yours, exclusive" />
        </div>

        <button
          type="button"
          onClick={onScrollToForm}
          style={{
            padding: "0.9rem 2rem",
            background: C.orange,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: C.sans,
            letterSpacing: "0.03em",
            boxShadow: "0 8px 22px rgba(196,90,26,0.35)",
          }}
        >
          Start the conversation →
        </button>
      </div>
    </div>
  );
}
