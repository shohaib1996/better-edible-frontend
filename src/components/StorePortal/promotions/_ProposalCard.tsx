"use client";

import { Card } from "@/components/ui/card";
import type { IPartnerProposal } from "@/types/promotions/partnerPromos";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: "#fff8e6", color: "#b5860e", label: "Pending Review" },
    approved: { bg: "#f0f7f2", color: "#2a7a4e", label: "Approved" },
    rejected: { bg: "#fef2f2", color: "#b91c1c", label: "Rejected" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function ProposalCard({ proposal: p }: { proposal: IPartnerProposal }) {
  return (
    <Card className="p-4" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium" style={{ color: "#2a2518" }}>
              {p.title}
            </span>
            <StatusBadge status={p.status} />
          </div>
          <div className="text-xs" style={{ color: "#9a8f6e" }}>
            {p.proposedDiscount}% off · {fmtDate(p.proposedStartDate)} — {fmtDate(p.proposedEndDate)}
          </div>
          {p.adminNote && (
            <div
              className="mt-2 text-xs px-3 py-2 rounded"
              style={{ background: "#f5f2e8", color: "#4a4535" }}
            >
              <strong>Team note:</strong> {p.adminNote}
            </div>
          )}
        </div>
        <div className="text-xs shrink-0" style={{ color: "#9a8f6e" }}>
          {new Date(p.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
}
