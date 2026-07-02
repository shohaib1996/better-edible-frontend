"use client";

import type { LineItem } from "@/types/storePortal/privateLabel";
import {
  GUMMY_SIZES,
  OIL_TYPES,
  EFFECTS_BY_OIL,
  ORDER_MINIMUM,
} from "@/lib/privateLabelHelpers";

const allEffects = [...EFFECTS_BY_OIL.biomax, ...EFFECTS_BY_OIL.rosin];

interface MyLinePanelProps {
  line: LineItem[];
  onRemove: (id: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string;
}

export function MyLinePanel({
  line,
  onRemove,
  onSubmit,
  submitting,
  submitError,
}: MyLinePanelProps) {
  const lineTotal = line.reduce((sum, item) => sum + item.units * item.unitPrice, 0);
  const lineUnits = line.reduce((sum, item) => sum + item.units, 0);
  const orderReady = lineTotal >= ORDER_MINIMUM;

  return (
    <div className="space-y-3 lg:sticky lg:top-4">
      {/* My Line card */}
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #d6d0b4" }}>
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: "#2a2518", color: "#f5f0e8" }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              My Line
            </div>
            <div className="text-[11px]" style={{ color: "rgba(245,240,232,0.55)" }}>
              {line.length} flavor{line.length !== 1 ? "s" : ""} &middot; {lineUnits.toLocaleString()} units
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: "#e8a87c" }}>
              ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px]" style={{ color: "rgba(245,240,232,0.45)" }}>
              of $1,000 min
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: "#e5e0c8", height: 3 }}>
          <div
            style={{
              height: 3,
              width: `${Math.min(100, (lineTotal / ORDER_MINIMUM) * 100)}%`,
              background: orderReady ? "#2d7a3a" : "#c45a1a",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Flavor list */}
        {line.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 text-center px-4"
            style={{ background: "#fafaf7" }}
          >
            <div className="text-2xl mb-2">🍬</div>
            <p className="text-xs" style={{ color: "#9a8f6e" }}>
              No flavors yet. Build your first one on the left.
            </p>
          </div>
        ) : (
          <div style={{ background: "#fafaf7" }}>
            {line.map((item, idx) => {
              const sizeLabel =
                GUMMY_SIZES.find((s) => s.value === item.gummySize)?.label || item.gummySize;
              const oilLabel =
                OIL_TYPES.find((o) => o.value === item.oilType)?.label || item.oilType;
              const effLabel =
                allEffects.find((e) => e.value === item.effect)?.label || item.effect;
              const itemTotal = item.units * item.unitPrice;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 px-4 py-3"
                  style={{ borderBottom: idx < line.length - 1 ? "1px solid #e5e0c8" : "none" }}
                >
                  <div
                    className="shrink-0 w-7 h-7 rounded mt-0.5"
                    style={{ background: item.color.hex, border: "1px solid rgba(0,0,0,0.08)" }}
                    title={item.color.color_name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: "#2a2518" }}>
                          {item.flavorName}
                        </div>
                        <div className="text-[10px]" style={{ color: "#9a8f6e" }}>
                          {sizeLabel} · {oilLabel} · {effLabel}
                        </div>
                        <div className="text-[10px]" style={{ color: "#9a8f6e" }}>
                          {item.units.toLocaleString()} units · ${item.unitPrice.toFixed(2)}/ea
                        </div>
                        {item.cannabinoids.length > 0 && (
                          <div className="text-[10px]" style={{ color: "#9a8f6e" }}>
                            + {item.cannabinoids.map((c) => `${c.name} ${c.mg}mg`).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold" style={{ color: "#c45a1a" }}>
                          ${itemTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-[10px] mt-0.5 hover:underline"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9a8f6e", padding: 0 }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {line.length > 0 && (
          <div className="px-4 py-3" style={{ borderTop: "1px solid #e5e0c8", background: "#fff" }}>
            <div className="flex justify-between text-xs mb-1" style={{ color: "#6b6045" }}>
              <span>Subtotal</span>
              <span>${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {!orderReady && (
              <div className="text-xs" style={{ color: "#c45a1a" }}>
                ${(ORDER_MINIMUM - lineTotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more to reach minimum
              </div>
            )}
            {orderReady && (
              <div className="text-xs font-medium" style={{ color: "#2d7a3a" }}>✓ Order minimum reached</div>
            )}
          </div>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <p className="text-xs font-medium px-1" style={{ color: "#b91c1c" }}>{submitError}</p>
      )}

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={submitting || !orderReady || line.length === 0}
        className="w-full py-3 rounded text-sm font-semibold transition-all active:scale-[0.98]"
        style={{
          background: submitting || !orderReady || line.length === 0 ? "#e5e0c8" : "#c45a1a",
          color: submitting || !orderReady || line.length === 0 ? "#9a8f6e" : "#fff",
        }}
      >
        {submitting
          ? "Submitting…"
          : line.length === 0
            ? "Add flavors to submit"
            : !orderReady
              ? `Need $${(ORDER_MINIMUM - lineTotal).toFixed(2)} more`
              : `Submit Line (${line.length} flavor${line.length !== 1 ? "s" : ""})`}
      </button>

      <p className="text-xs text-center" style={{ color: "#9a8f6e" }}>
        $1,000 minimum &middot; 140 units per flavor &middot; Rep follows up within 2 business days.
      </p>
    </div>
  );
}
