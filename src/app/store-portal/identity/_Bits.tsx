"use client";

import { C } from "./_constants";

export function StatPill({ big, small }: { big: string; small: string }) {
  return (
    <div style={{ textAlign: "center", padding: "0 0.5rem" }}>
      <div
        style={{
          fontFamily: C.serif,
          fontSize: "1.75rem",
          fontWeight: 700,
          color: C.orangeSoft,
          lineHeight: 1,
        }}
      >
        {big}
      </div>
      <div
        style={{
          fontSize: "0.66rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#cfc6b0",
          marginTop: "0.4rem",
        }}
      >
        {small}
      </div>
    </div>
  );
}

export function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background: C.creamCard,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "1.25rem 1.35rem",
      }}
    >
      <h4
        style={{
          fontFamily: C.serif,
          fontSize: "1.05rem",
          fontWeight: 700,
          margin: "0 0 0.4rem",
          color: C.ink,
        }}
      >
        {title}
      </h4>
      <p style={{ fontSize: "0.86rem", color: C.muted, lineHeight: 1.65, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
