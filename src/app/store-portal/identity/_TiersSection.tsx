"use client";

import { C } from "./_constants";
import { TierCard } from "./_TierCard";

interface TiersSectionProps {
  selectedPackage: "partner" | "owner" | "";
  onSelect: (pkg: "partner" | "owner") => void;
}

export function TiersSection({ selectedPackage, onSelect }: TiersSectionProps) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
        <h2
          style={{ fontFamily: C.serif, fontSize: "1.7rem", fontWeight: 700, margin: "0 0 0.5rem" }}
        >
          Two ways in. Both pay for themselves.
        </h2>
        <p style={{ fontSize: "0.9rem", color: C.muted, margin: 0 }}>
          The packaging cost is a rounding error against what you take home.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "1.5rem",
          marginBottom: "3.5rem",
          alignItems: "stretch",
        }}
      >
        <TierCard
          name="Brand Partner"
          price={25000}
          pouches={100000}
          netCost={0.2}
          discount={0.05}
          selected={selectedPackage === "partner"}
          onSelect={() => onSelect("partner")}
          features={[
            "100,000 custom-printed child-resistant pouches",
            "6 custom designs",
            "Custom gummy mold (we retain ownership)",
            "$0.05/unit production discount — you pay $0.20/bag",
          ]}
        />
        <TierCard
          name="Brand Owner"
          price={50000}
          pouches={200000}
          netCost={0.18}
          discount={0.07}
          highlight
          badge="Best value"
          selected={selectedPackage === "owner"}
          onSelect={() => onSelect("owner")}
          features={[
            "200,000 custom-printed child-resistant pouches",
            "10 custom designs",
            "Custom gummy mold — you own it outright",
            "Custom gummy formulation, unique to your brand",
            "$0.07/unit production discount — you pay $0.18/bag",
          ]}
        />
      </div>
    </div>
  );
}
