"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";

type AppStatus = "pending_approval" | "pending_setup" | "active" | "rejected";

interface ApplicationData {
  status: AppStatus;
  notes?: string;
  requestedAt: string;
  approvedAt?: string;
}

function StatusBadge({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { bg: string; color: string; label: string }> = {
    pending_approval: { bg: "#fff8e6", color: "#b5860e", label: "Application Received" },
    pending_setup:    { bg: "#e8f4ff", color: "#1d6fa4", label: "Under Review" },
    active:           { bg: "#f0f7f2", color: "#2a7a4e", label: "Approved" },
    rejected:         { bg: "#fef2f2", color: "#b91c1c", label: "Not Approved" },
  };
  const s = map[status];
  return (
    <span
      className="inline-block text-xs px-3 py-1 rounded-full font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
        style={{ background: "#c45a1a", color: "#fff", fontFamily: "Georgia, serif" }}
      >
        {number}
      </div>
      <div>
        <div className="text-sm font-semibold mb-0.5" style={{ color: "#2a2518", fontFamily: "Georgia, serif" }}>
          {title}
        </div>
        <div className="text-xs leading-relaxed" style={{ color: "#6b6045" }}>
          {body}
        </div>
      </div>
    </div>
  );
}

export function PartnershipPage() {
  const [user, setUser] = useState<IStoreUser | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // TODO: fetch status from GET /api/partnership/status?storeId=
  // TODO: handleApply → POST /api/partnership/join

  return (
    <div>
      {/* Intro */}
      <div className="mb-6">
        <p className="text-sm leading-relaxed" style={{ color: "#4a4535" }}>
          The Better Edibles Partnership Program is a <strong>consignment model</strong> — we stock
          your shelves, integrate with your POS, and you only pay for what sells. No upfront
          purchase orders, no dead inventory risk.
        </p>
      </div>

      {/* How it works */}
      <Card className="p-5 mb-6" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#9a8f6e" }}>
          How It Works
        </h2>
        <div className="space-y-5">
          <Step
            number="1"
            title="Apply to Join"
            body="Submit your application with one click. Our team reviews each store individually — we look at location, traffic, and fit with our brand."
          />
          <Step
            number="2"
            title="POS Integration"
            body="Once approved, we connect to your point-of-sale system. We support all major cannabis POS platforms so we can monitor inventory levels in real time."
          />
          <Step
            number="3"
            title="We Stock Your Shelves"
            body="Better Edibles delivers and merchandises your initial inventory. Restocking is handled by us based on your sales velocity — you never have to place a reorder."
          />
          <Step
            number="4"
            title="Monthly Invoice — Net 30"
            body="On the first of each month you receive an invoice for all product sold during the prior calendar month. Payment is due by the last day of that month."
          />
        </div>
      </Card>

      {/* Billing callout */}
      <div
        className="rounded-lg px-5 py-4 mb-6 flex items-start gap-3"
        style={{ background: "#f5f2e8", border: "1px solid #d6d0b4" }}
      >
        <div className="text-lg" style={{ lineHeight: 1 }}>📅</div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9a8f6e" }}>
            Billing Cycle
          </div>
          <div className="text-sm" style={{ color: "#4a4535" }}>
            Invoice issued <strong>1st of the month</strong> for the prior calendar month&apos;s sales.
            Payment due <strong>end of that same month</strong> (Net 30).
          </div>
        </div>
      </div>

      {/* Apply / Status */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#c45a1a" }}
          />
        </div>
      ) : application ? (
        <Card className="p-5" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9a8f6e" }}>
            Your Application
          </h2>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <StatusBadge status={application.status} />
            <span className="text-xs" style={{ color: "#9a8f6e" }}>
              Submitted{" "}
              {new Date(application.requestedAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </span>
          </div>
          {application.notes && (
            <div
              className="mt-3 text-xs px-4 py-3 rounded"
              style={{ background: "#f5f2e8", color: "#4a4535", border: "1px solid #d6d0b4" }}
            >
              <strong>Note from our team:</strong> {application.notes}
            </div>
          )}
          {application.status === "active" && (
            <div
              className="mt-4 text-sm px-4 py-3 rounded font-medium"
              style={{ background: "#f0f7f2", color: "#2a7a4e", border: "1px solid #b8dfc8" }}
            >
              Welcome to the program! Your account rep will be in touch shortly to schedule your POS integration and first delivery.
            </div>
          )}
          {(application.status === "pending_approval" || application.status === "pending_setup") && (
            <div className="mt-3 text-xs" style={{ color: "#9a8f6e" }}>
              We typically review applications within 2–3 business days. We&apos;ll reach out once a decision is made.
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 text-center" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
          <div className="text-2xl mb-2">🤝</div>
          <div
            className="text-base font-semibold mb-1"
            style={{ fontFamily: "Georgia, serif", color: "#2a2518" }}
          >
            Ready to join?
          </div>
          <div className="text-xs mb-5" style={{ color: "#6b6045" }}>
            We already have your store information on file. One click is all it takes.
          </div>
          {applyError && (
            <div
              className="text-xs px-3 py-2 rounded mb-4"
              style={{ background: "#fef2f2", color: "#b91c1c" }}
            >
              {applyError}
            </div>
          )}
          <button
            onClick={() => {/* TODO: handleApply */}}
            disabled={applying}
            className="px-8 py-3 rounded text-sm font-semibold transition-opacity"
            style={{
              background: applying ? "#d6d0b4" : "#c45a1a",
              color: "#fff",
              opacity: applying ? 0.7 : 1,
            }}
          >
            {applying ? "Submitting…" : "Apply to the Partnership Program"}
          </button>
          <div className="mt-4 text-xs" style={{ color: "#9a8f6e" }}>
            Questions?{" "}
            <a href="mailto:partners@better-edibles.com" className="underline" style={{ color: "#c45a1a" }}>
              partners@better-edibles.com
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
