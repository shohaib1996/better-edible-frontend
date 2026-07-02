"use client";

import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import { LABEL_STAGE_LABELS, fmtDate, fmtCurrency } from "@/lib/privateLabelHelpers";

interface LabelDetailsModalProps {
  label: IStoreDraftLabel;
  onClose: () => void;
}

export function LabelDetailsModal({ label, onClose }: LabelDetailsModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(42,37,24,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="scrollbar-hidden"
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "1.5rem",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#9a8f6e",
            fontSize: "1.25rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div className="flex items-center gap-3 mb-4">
          {label.gummyColorHex && (
            <div
              className="w-12 h-12 rounded-full shrink-0"
              style={{ background: label.gummyColorHex, border: "1px solid rgba(0,0,0,0.08)" }}
            />
          )}
          <div>
            <div className="text-base font-bold" style={{ color: "#2a2518" }}>
              {label.flavorName}
            </div>
            {label.gummyColorName && (
              <div className="text-xs" style={{ color: "#9a8f6e" }}>
                {label.gummyColorName}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {[
            ["Stage", LABEL_STAGE_LABELS[label.currentStage] || label.currentStage],
            ["Product", label.productType || "Custom Gummy"],
            ["Oil Type", label.oilType],
            ["Effect", label.effect],
            ["Size", label.size],
            ["Units", label.unitsOrdered?.toLocaleString()],
            ["Unit Price", label.unitCost ? fmtCurrency(label.unitCost) : "—"],
            ["Submitted", fmtDate(label.submittedAt)],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span style={{ color: "#9a8f6e" }}>{k}</span>
                <span style={{ color: "#2a2518", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          {(label.cannabinoids ?? []).length > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "#9a8f6e" }}>Add-ons</span>
              <span style={{ color: "#2a2518", fontWeight: 500, textAlign: "right" }}>
                {(label.cannabinoids ?? []).map((c) => `${c.name} ${c.mg}mg`).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
