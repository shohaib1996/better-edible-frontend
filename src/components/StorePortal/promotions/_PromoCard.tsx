"use client";

import { Card } from "@/components/ui/card";
import type { Promo, ClaimItem } from "./_types";
import { fmtDate } from "./_types";

interface PromoCardProps {
  promo: Promo;
  enrollingId: string | null;
  claimOpenId: string | null;
  claimItems: ClaimItem[];
  submittingClaim: boolean;
  claimError: string;
  onEnroll: (id: string) => void;
  onOpenClaim: (id: string) => void;
  onCloseClaim: () => void;
  onAddRow: () => void;
  onRemoveRow: (i: number) => void;
  onUpdateRow: (i: number, field: keyof ClaimItem, val: string) => void;
  onSubmitClaim: (id: string) => void;
}

function calcTotal(items: ClaimItem[]) {
  return items.reduce(
    (sum, r) => sum + (parseFloat(r.unitsSold) || 0) * (parseFloat(r.unitPrice) || 0),
    0
  );
}

export function PromoCard({
  promo,
  enrollingId,
  claimOpenId,
  claimItems,
  submittingClaim,
  claimError,
  onEnroll,
  onOpenClaim,
  onCloseClaim,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onSubmitClaim,
}: PromoCardProps) {
  const claimOpen = claimOpenId === promo._id;
  const total = claimOpen ? calcTotal(claimItems) : 0;

  return (
    <Card className="p-5" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
      <div className="flex items-start gap-4">
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ background: "#c45a1a", minHeight: 40 }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "#2a2518" }}>
              {promo.title}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#fff3ed", color: "#c45a1a" }}
            >
              {promo.discountPercent}% credit on sales
            </span>
            {promo.enrolled && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#f0f7f2", color: "#2a7a4e" }}
              >
                ✓ Enrolled
              </span>
            )}
          </div>
          {promo.description && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: "#6b6045" }}>
              {promo.description}
            </p>
          )}
          <div className="text-xs" style={{ color: "#9a8f6e" }}>
            {fmtDate(promo.startDate)} — {fmtDate(promo.endDate)}
          </div>
          {promo.claim && (
            <div className="mt-2 text-xs flex items-center gap-2" style={{ color: "#6b6045" }}>
              <span>Claim status:</span>
              <ClaimStatusBadge status={promo.claim.status} />
              {promo.claim.status === "approved" && (
                <span className="font-medium" style={{ color: "#2a7a4e" }}>
                  ${promo.claim.creditEarned.toFixed(2)} credit earned
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {!promo.enrolled && !promo.claim && (
            <button
              onClick={() => onEnroll(promo._id)}
              disabled={enrollingId === promo._id}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: "#c45a1a",
                color: "#fff",
                opacity: enrollingId === promo._id ? 0.6 : 1,
              }}
            >
              {enrollingId === promo._id ? "Enrolling…" : "Enroll"}
            </button>
          )}
          {promo.enrolled && !promo.claim && (
            <button
              onClick={() => onOpenClaim(promo._id)}
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ border: "1px solid #c45a1a", color: "#c45a1a", background: "transparent" }}
            >
              Submit Sales
            </button>
          )}
        </div>
      </div>

      {/* Inline claim form */}
      {claimOpen && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e8e2cc" }}>
          <p className="text-xs font-medium mb-3" style={{ color: "#4a4535" }}>
            Enter units of Better Edibles product sold during this promotion:
          </p>
          <div className="space-y-2">
            {claimItems.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="flex-1 px-2 py-1.5 rounded text-xs border outline-none"
                  style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
                  placeholder="Product name"
                  value={row.productName}
                  onChange={(e) => onUpdateRow(i, "productName", e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  className="w-20 px-2 py-1.5 rounded text-xs border outline-none"
                  style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
                  placeholder="Units"
                  value={row.unitsSold}
                  onChange={(e) => onUpdateRow(i, "unitsSold", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24 px-2 py-1.5 rounded text-xs border outline-none"
                  style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
                  placeholder="Unit price $"
                  value={row.unitPrice}
                  onChange={(e) => onUpdateRow(i, "unitPrice", e.target.value)}
                />
                {claimItems.length > 1 && (
                  <button
                    onClick={() => onRemoveRow(i)}
                    className="text-xs px-2 py-1.5 rounded"
                    style={{ color: "#b91c1c", background: "#fef2f2" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button onClick={onAddRow} className="text-xs" style={{ color: "#c45a1a" }}>
              + Add product
            </button>
            <div className="text-xs" style={{ color: "#6b6045" }}>
              Total sales: <strong>${total.toFixed(2)}</strong>
              {" · "}Est. credit:{" "}
              <strong style={{ color: "#2a7a4e" }}>
                ${((total * promo.discountPercent) / 100).toFixed(2)}
              </strong>
            </div>
          </div>

          {claimError && (
            <div
              className="mt-2 text-xs px-3 py-2 rounded"
              style={{ background: "#fef2f2", color: "#b91c1c" }}
            >
              {claimError}
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <button
              onClick={() => onSubmitClaim(promo._id)}
              disabled={submittingClaim}
              className="px-4 py-1.5 rounded text-xs font-semibold"
              style={{ background: "#2a7a4e", color: "#fff", opacity: submittingClaim ? 0.6 : 1 }}
            >
              {submittingClaim ? "Submitting…" : "Submit Claim"}
            </button>
            <button
              onClick={onCloseClaim}
              className="px-4 py-1.5 rounded text-xs"
              style={{ background: "#f5f2e8", color: "#4a4535" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ClaimStatusBadge({ status }: { status: string }) {
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
