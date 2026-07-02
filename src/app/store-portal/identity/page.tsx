"use client";

import { useState, useRef, useEffect } from "react";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import { C, INQUIRY_URL } from "./_constants";
import { Hero } from "./_Hero";
import { WhySection } from "./_WhySection";
import { TiersSection } from "./_TiersSection";
import { TrustSection } from "./_TrustSection";
import { InquiryForm, SuccessCard } from "./_InquiryForm";

export default function IdentityPackagePage() {
  const [user, setUser] = useState<IStoreUser | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<"partner" | "owner" | "">("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const selectAndScroll = (pkg: "partner" | "owner") => {
    setSelectedPackage(pkg);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(INQUIRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          storeName: user?.storeName || "Unknown Store",
          contactName: user?.name || "Unknown",
          phone,
          notes,
          packageName: selectedPackage === "partner" ? "Brand Partner" : "Brand Owner",
          packagePrice: selectedPackage === "partner" ? 25000 : 50000,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string }).message || "Submission failed.");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: C.sans, color: C.ink }}>
      {/* Header bar */}
      <div
        style={{
          background: C.ink,
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/hFK3bZtNMbaPzAzvvjdqbb/portal-logo-icon-YNBxLmmfhMnbfMG9NnzYy8.png"
            alt="Better Edibles"
            style={{ width: 28, height: 28, borderRadius: 5 }}
          />
          <span style={{ color: "#f5f0e8", fontSize: "0.9rem", fontWeight: 600 }}>
            Better Edibles
          </span>
        </div>
        <span
          style={{
            color: C.orangeSoft,
            fontSize: "0.62rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Identity Package
        </span>
      </div>

      <Hero onScrollToForm={scrollToForm} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3.25rem 1.5rem 5rem" }}>
        <WhySection />
        <TiersSection selectedPackage={selectedPackage} onSelect={selectAndScroll} />
        <TrustSection />

        <div ref={formRef} style={{ scrollMarginTop: "1rem" }}>
          {submitted ? (
            <SuccessCard storeName={user?.storeName} />
          ) : (
            <InquiryForm
              user={user}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
              phone={phone}
              onPhone={setPhone}
              notes={notes}
              onNotes={setNotes}
              submitting={submitting}
              submitError={submitError}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
