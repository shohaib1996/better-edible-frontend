"use client";

import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import { LABEL_STAGES_ORDER, LABEL_STAGE_LABELS } from "@/lib/privateLabelHelpers";

export function InProgressLabels({ labels }: { labels: IStoreDraftLabel[] }) {
  if (labels.length === 0) return null;

  return (
    <>
      <div className="mb-3">
        <h3 className="font-bold text-sm" style={{ color: "#2a2518" }}>
          In Progress
        </h3>
      </div>
      <div className="space-y-2">
        {labels.map((lbl) => {
          const stageIdx = LABEL_STAGES_ORDER.indexOf(lbl.currentStage);
          const pct =
            stageIdx < 0
              ? 0
              : Math.round(((stageIdx + 1) / LABEL_STAGES_ORDER.length) * 100);
          return (
            <div
              key={lbl._id}
              className="rounded-xl p-4"
              style={{ background: "#fff", border: "1px solid #d6d0b4" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {lbl.gummyColorHex && (
                    <div
                      className="w-6 h-6 rounded-full shrink-0"
                      style={{
                        background: lbl.gummyColorHex,
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    />
                  )}
                  <div className="text-sm font-semibold truncate" style={{ color: "#2a2518" }}>
                    {lbl.flavorName}
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: "#fdf3ec", color: "#c45a1a" }}
                >
                  {LABEL_STAGE_LABELS[lbl.currentStage] || lbl.currentStage}
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden h-1.5 mb-1"
                style={{ background: "#f0ece0" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: "#c45a1a" }}
                />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: "#9a8f6e" }}>
                <span>Design</span>
                <span>OLCC</span>
                <span>Production</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
