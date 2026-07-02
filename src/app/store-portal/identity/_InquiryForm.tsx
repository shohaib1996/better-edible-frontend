"use client";

import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import { C } from "./_constants";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.9rem",
  background: "#fff",
  border: `1px solid ${C.lineStrong}`,
  borderRadius: 8,
  fontSize: "0.9rem",
  color: C.ink,
  fontFamily: C.sans,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.faint,
  marginBottom: "0.4rem",
};

interface InquiryFormProps {
  user: IStoreUser | null;
  selectedPackage: "partner" | "owner" | "";
  onSelectPackage: (v: "partner" | "owner") => void;
  phone: string;
  onPhone: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
  submitting: boolean;
  submitError: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function InquiryForm({
  user,
  selectedPackage,
  onSelectPackage,
  phone,
  onPhone,
  notes,
  onNotes,
  submitting,
  submitError,
  onSubmit,
}: InquiryFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: C.creamCard,
        border: `1px solid ${C.lineStrong}`,
        borderRadius: 16,
        padding: "2rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxShadow: "0 8px 24px rgba(42,37,24,0.06)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2
          style={{ fontFamily: C.serif, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.35rem" }}
        >
          Claim your shelf.
        </h2>
        <p style={{ fontSize: "0.85rem", color: C.muted, margin: 0 }}>
          Pick a tier and your rep will walk you through the next step.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {[
          { id: "partner", label: "Brand Partner", price: "$25,000" },
          { id: "owner", label: "Brand Owner", price: "$50,000" },
        ].map((pkg) => {
          const active = selectedPackage === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelectPackage(pkg.id as "partner" | "owner")}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "0.85rem 0.5rem",
                background: active ? C.orange : "#fff",
                color: active ? "#fff" : C.orange,
                border: `1.5px solid ${C.orange}`,
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: C.sans,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{pkg.label}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: "0.15rem" }}>
                {pkg.price}
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <label style={labelStyle}>Best Phone Number *</label>
        <input
          type="tel"
          required
          placeholder="(503) 555-0100"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Questions or Notes{" "}
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
            (optional)
          </span>
        </label>
        <textarea
          placeholder="e.g. We have an existing logo, interested in 3 flavors to start…"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {submitError && (
        <p style={{ fontSize: "0.82rem", color: C.red, margin: 0 }}>{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedPackage}
        style={{
          padding: "1rem",
          background: submitting || !selectedPackage ? C.line : C.orange,
          color: submitting || !selectedPackage ? C.faint : "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: "0.95rem",
          fontWeight: 700,
          fontFamily: C.sans,
          cursor: submitting || !selectedPackage ? "default" : "pointer",
          letterSpacing: "0.04em",
          boxShadow: submitting || !selectedPackage ? "none" : "0 8px 20px rgba(196,90,26,0.3)",
        }}
      >
        {submitting ? "Submitting…" : "Request a Conversation →"}
      </button>

      <p style={{ fontSize: "0.75rem", color: C.faint, margin: 0, textAlign: "center" }}>
        No commitment today. Your rep will follow up within 1 business day.
      </p>
    </form>
  );
}

export function SuccessCard({ storeName }: { storeName?: string }) {
  return (
    <div
      style={{
        background: C.creamCard,
        border: `1px solid ${C.lineStrong}`,
        borderRadius: 16,
        textAlign: "center",
        padding: "3rem 2rem",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(45,122,58,0.12)",
          color: C.green,
          fontSize: "1.6rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        ✓
      </div>
      <h2
        style={{ fontFamily: C.serif, fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.6rem" }}
      >
        We&apos;ll be in touch.
      </h2>
      <p style={{ fontSize: "0.9rem", color: C.muted, lineHeight: 1.8, margin: 0 }}>
        Thanks{storeName ? `, ${storeName}` : ""}. Your rep will follow up within 1 business day
        to map out your label.
      </p>
    </div>
  );
}
