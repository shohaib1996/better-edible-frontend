"use client";

import type { IDesignRequest } from "@/types/designRequests/designRequests";
import { STATUS_COLORS, STATUS_LABELS, fmtDate } from "./_constants";

export function RequestCard({ req }: { req: IDesignRequest }) {
  const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
  const label = STATUS_LABELS[req.status] || req.status;
  return (
    <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
      <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: sc.dot, minHeight: 40 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug mb-1.5" style={{ color: "#2a2518" }}>
          {req.description || "(No description)"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.text }}>
            {label}
          </span>
          {req.requestType && (
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "#f5f2e8", color: "#6b6045", border: "1px solid #d6d0b4" }}
            >
              {req.requestType}
            </span>
          )}
          {req.productLine && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f0ece0", color: "#4a4535" }}>
              {req.productLine}
            </span>
          )}
          {req.revisionCount && req.revisionCount > 0 ? (
            <span className="text-xs" style={{ color: "#c45a1a" }}>
              ↺ {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs" style={{ color: "#9a8f6e" }}>{fmtDate(req.createdAt)}</p>
        {req.requestId && (
          <p className="text-[10px] mt-0.5" style={{ color: "#c0b89a" }}>{req.requestId}</p>
        )}
      </div>
    </div>
  );
}
