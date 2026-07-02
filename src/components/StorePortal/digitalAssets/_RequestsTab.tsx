"use client";

import type { IDesignRequest } from "@/types/designRequests/designRequests";
import { RequestCard } from "./_RequestCard";

interface RequestsTabProps {
  requests: IDesignRequest[];
  loading: boolean;
  error: boolean;
}

export function RequestsTab({ requests, loading, error }: RequestsTabProps) {
  const reqCounts = {
    pending:    requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    revision:   requests.filter((r) => r.status === "revision-requested").length,
    completed:  requests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: "#6b6045" }}>
        {loading
          ? "Loading…"
          : `${requests.length} total request${requests.length !== 1 ? "s" : ""}`}
      </p>

      {!loading && requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pending",     count: reqCounts.pending,    dot: "#9a8f6e", text: "#6b6045" },
            { label: "In Progress", count: reqCounts.inProgress, dot: "#e8a832", text: "#b5860e" },
            { label: "Revision",    count: reqCounts.revision,   dot: "#e07040", text: "#c45a1a" },
            { label: "Completed",   count: reqCounts.completed,  dot: "#3a9a5e", text: "#2a7a4e" },
          ].map(({ label, count, dot, text }) => (
            <div
              key={label}
              className="rounded-lg px-4 py-3 flex items-center gap-3"
              style={{ background: "#fff", border: "1px solid #d6d0b4" }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
              <div>
                <p className="text-lg font-bold leading-none" style={{ color: text }}>{count}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg px-4 py-4 flex items-center gap-4 animate-pulse"
              style={{ background: "#fff", border: "1px solid #d6d0b4" }}
            >
              <div className="w-1 h-12 rounded-full" style={{ background: "#e5e0c8" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded w-2/3" style={{ background: "#e5e0c8" }} />
                <div className="h-3 rounded w-1/3" style={{ background: "#e5e0c8" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm py-4 px-4 rounded" style={{ background: "#fdf0ec", color: "#c45a1a", border: "1px solid #f0c4a8" }}>
          Could not load requests. Please try again.
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
          No design requests yet. Contact your rep to get started.
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard key={req._id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
