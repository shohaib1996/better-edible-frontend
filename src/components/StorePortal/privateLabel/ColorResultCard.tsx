"use client";

import { isColorDark } from "@/lib/privateLabelHelpers";
import type { GummyResult } from "@/types/storePortal/privateLabel";

export function ColorResultCard({ result }: { result: GummyResult }) {
  return (
    <div className="mt-2 rounded overflow-hidden" style={{ border: "1px solid #e5e0c8" }}>
      <div className="flex" style={{ borderBottom: "1px solid #e5e0c8" }}>
        <div
          className="w-1/2 text-xs font-bold text-center py-1.5"
          style={{ background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.55)" }}
        >
          Color
        </div>
        <div
          className="w-1/2 text-xs font-bold text-center py-1.5"
          style={{ background: "#f0ece0", color: "#6b6045", borderLeft: "1px solid #e5e0c8" }}
        >
          Flavor
        </div>
      </div>
      <div className="flex" style={{ minHeight: 120 }}>
        <div
          className="w-1/2 flex flex-col items-center justify-center px-4 py-5 gap-1.5"
          style={{ background: result.hex }}
        >
          <div
            className="text-sm font-bold text-center"
            style={{
              color: isColorDark(result.hex) ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.80)",
              textShadow: isColorDark(result.hex) ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
            }}
          >
            {result.color_name}
          </div>
          {result.rationale && (
            <div
              className="text-[10px] text-center leading-snug"
              style={{
                color: isColorDark(result.hex) ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.5)",
              }}
            >
              {result.rationale}
            </div>
          )}
        </div>
        <div
          className="w-1/2 flex flex-col items-center justify-center px-4 py-5 gap-1.5"
          style={{ background: "#fafaf7", borderLeft: "1px solid #e5e0c8" }}
        >
          {result.lorann_components.length > 0 ? (
            <>
              <div
                className="text-xs font-bold text-center leading-snug"
                style={{ color: "#2a2518" }}
              >
                {result.lorann_components.map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ color: "#b0a882" }}> · </span>}
                    {c.name}{" "}
                    <span style={{ color: "#c45a1a" }}>({c.ratio_pct}%)</span>
                  </span>
                ))}
              </div>
              {result.flavor_description && (
                <div
                  className="text-[10px] text-center leading-snug"
                  style={{ color: "rgba(0,0,0,0.5)" }}
                >
                  {result.flavor_description}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-center" style={{ color: "#9a8f6e" }}>
              We&apos;ll match the flavor to your name.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
