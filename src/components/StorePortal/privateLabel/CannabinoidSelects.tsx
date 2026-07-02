"use client";

import { CANNABINOID_OPTIONS, POOL_THRESHOLD } from "@/lib/privateLabelHelpers";
import type { SelectedCannabinoid } from "@/types/storePortal/privateLabel";

interface CannabinoidSelectsProps {
  selectedCannabinoids: SelectedCannabinoid[];
  onChange: (cannabinoids: SelectedCannabinoid[]) => void;
  units: number;
  onOpenTestFeeModal: () => void;
}

export function CannabinoidSelects({
  selectedCannabinoids,
  onChange,
  units,
  onOpenTestFeeModal,
}: CannabinoidSelectsProps) {
  const hasRatio = selectedCannabinoids.length > 0;
  const testingFeeWaived = hasRatio && units >= POOL_THRESHOLD;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {CANNABINOID_OPTIONS.map((opt) => {
          const selected = selectedCannabinoids.find((c) => c.name === opt.name);
          const isActive = !!selected;
          return (
            <div key={opt.name} className="relative">
              <select
                value={selected ? String(selected.mg) : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onChange(selectedCannabinoids.filter((c) => c.name !== opt.name));
                  } else {
                    const mgOpt = opt.mgOptions.find((m) => String(m.mg) === val)!;
                    const without = selectedCannabinoids.filter((c) => c.name !== opt.name);
                    onChange([...without, { name: opt.name, mg: mgOpt.mg, adder: mgOpt.adder }]);
                  }
                }}
                className="h-8 rounded text-xs font-medium pl-2.5 pr-7 appearance-none cursor-pointer transition-all text-center"
                style={{
                  background: isActive ? "#c45a1a" : "#f0ece0",
                  color: isActive ? "#fff" : "#4a4535",
                  border: `1px solid ${isActive ? "#c45a1a" : "#d6d0b4"}`,
                  boxShadow: isActive ? "0 1px 4px rgba(196,90,26,0.25)" : "none",
                  minWidth: 60,
                }}
              >
                <option value="">{opt.name}</option>
                {opt.mgOptions.map((mgOpt) => (
                  <option key={mgOpt.mg} value={String(mgOpt.mg)}>
                    {mgOpt.mg}mg (+${mgOpt.adder.toFixed(2)})
                  </option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 leading-none"
                style={{ color: isActive ? "rgba(255,255,255,0.8)" : "#6b6045", fontSize: 11 }}
              >
                ▾
              </span>
              <span
                className="pointer-events-none absolute -top-1 -right-0.5 leading-none font-bold"
                style={{ color: "#dc2626", fontSize: 13 }}
              >
                *
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenTestFeeModal}
        className="mt-1.5 text-left text-xs underline"
        style={{ color: "#c45a1a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>{" "}
        Please read how our test fee works on layered cannabinoid gummies
      </button>

      {hasRatio && (
        <div
          className="mt-2 px-3 py-2 rounded text-xs flex items-center gap-2"
          style={{
            background: testingFeeWaived ? "#f0fdf4" : "#fffbeb",
            border: `1px solid ${testingFeeWaived ? "#bbf7d0" : "#fde68a"}`,
            color: testingFeeWaived ? "#166534" : "#92400e",
          }}
        >
          {testingFeeWaived
            ? "✓ Testing fee waived (pool run — 3,000+ units)"
            : "+$250 testing fee applies · waived at 3,000+ units"}
        </div>
      )}
    </div>
  );
}
