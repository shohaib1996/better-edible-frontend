"use client";

import { C } from "./_constants";
import { Benefit } from "./_Bits";

export function WhySection() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2
          style={{ fontFamily: C.serif, fontSize: "1.7rem", fontWeight: 700, margin: "0 0 0.6rem" }}
        >
          Why stock someone else&apos;s name?
        </h2>
        <p
          style={{
            fontSize: "0.95rem",
            color: C.muted,
            lineHeight: 1.7,
            maxWidth: 580,
            margin: "0 auto",
          }}
        >
          Right now you sell our brand. With an Identity Package, every bag on your shelf builds{" "}
          <em>your</em> name — and the margin comes home to you.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "1rem",
          marginBottom: "3.5rem",
        }}
      >
        <Benefit
          title="Customers can't price-shop you"
          body="An exclusive label means no other dispensary carries the exact same bag. You set the price; you own the shelf."
        />
        <Benefit
          title="Margin you keep forever"
          body="The $0.80 you net per bag isn't a one-time promo — it's baked into every unit you sell, on every reorder."
        />
        <Benefit
          title="Your brand, our kitchen"
          body="We handle the gummy, the compliance, the printing. You get a polished, Oregon-compliant product with your name on it."
        />
        <Benefit
          title="A real asset, not a logo"
          body="Custom molds and formulations turn your store into a brand customers ask for by name — equity that compounds."
        />
      </div>
    </div>
  );
}
