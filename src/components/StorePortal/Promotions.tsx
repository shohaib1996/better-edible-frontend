"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import type { Promo, Proposal, ClaimItem, ProposeFormData } from "./promotions/_types";
import { isActive, isUpcoming, fmtDate } from "./promotions/_types";
import { PromoCard } from "./promotions/_PromoCard";
import { ProposeForm } from "./promotions/_ProposeForm";
import { ProposalCard } from "./promotions/_ProposalCard";

const API = process.env.NEXT_PUBLIC_API_URL;

export function PromotionsPage() {
  const [user, setUser] = useState<IStoreUser | null>(null);

  const [promos, setPromos]               = useState<Promo[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);

  const [proposals, setProposals]               = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);

  const [creditBalance, setCreditBalance] = useState(0);

  // Claim state
  const [enrollingId, setEnrollingId]         = useState<string | null>(null);
  const [claimOpenId, setClaimOpenId]         = useState<string | null>(null);
  const [claimItems, setClaimItems]           = useState<ClaimItem[]>([{ productName: "", unitsSold: "", unitPrice: "" }]);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimError, setClaimError]           = useState("");

  // Propose state
  const [showProposeForm, setShowProposeForm]       = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposeError, setProposeError]             = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const fetchPromos = useCallback(async (storeId: string) => {
    setLoadingPromos(true);
    try {
      const r = await fetch(`${API}/store/promotions?storeId=${storeId}`, { credentials: "include" });
      const data = await r.json();
      setPromos(data.promotions || []);
    } catch {
      setPromos([]);
    } finally {
      setLoadingPromos(false);
    }
  }, []);

  const fetchProposals = useCallback(async (storeId: string) => {
    setLoadingProposals(true);
    try {
      const r = await fetch(`${API}/store/promotions/my-proposals?storeId=${storeId}`, { credentials: "include" });
      const data = await r.json();
      setProposals(data.proposals || []);
    } catch {
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  const fetchCredits = useCallback(async (storeId: string) => {
    try {
      const r = await fetch(`${API}/store/promotions/credits?storeId=${storeId}`, { credentials: "include" });
      const data = await r.json();
      setCreditBalance(data.balance || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.storeId) return;
    fetchPromos(user.storeId);
    fetchProposals(user.storeId);
    fetchCredits(user.storeId);
  }, [user?.storeId, fetchPromos, fetchProposals, fetchCredits]);

  async function handleEnroll(promoId: string) {
    if (!user?.storeId) return;
    setEnrollingId(promoId);
    try {
      const r = await fetch(`${API}/store/promotions/${promoId}/enroll`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: user.storeId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to enroll");
      fetchPromos(user.storeId);
    } catch (e: any) {
      alert(e.message || "Failed to enroll");
    } finally {
      setEnrollingId(null);
    }
  }

  function openClaim(promoId: string) {
    setClaimOpenId(promoId);
    setClaimItems([{ productName: "", unitsSold: "", unitPrice: "" }]);
    setClaimError("");
  }

  async function handleSubmitClaim(promoId: string) {
    if (!user?.storeId) return;
    const promo = promos.find((p) => p._id === promoId);
    if (!promo) return;

    const items = claimItems
      .filter((r) => r.productName && r.unitsSold && r.unitPrice)
      .map((r) => ({
        productName: r.productName,
        unitsSold: parseInt(r.unitsSold, 10),
        unitPrice: parseFloat(r.unitPrice),
      }));
    if (items.length === 0) { setClaimError("Add at least one product row"); return; }

    setSubmittingClaim(true);
    setClaimError("");
    try {
      const r = await fetch(`${API}/store/promotions/${promoId}/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: user.storeId, items }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to submit claim");
      setClaimOpenId(null);
      fetchPromos(user.storeId);
    } catch (e: any) {
      setClaimError(e.message || "Failed to submit claim");
    } finally {
      setSubmittingClaim(false);
    }
  }

  async function handleSubmitProposal(form: ProposeFormData) {
    if (!user?.storeId) return;
    if (!form.title || !form.proposedDiscount || !form.proposedStartDate || !form.proposedEndDate) {
      setProposeError("Please fill in all required fields");
      return;
    }
    setSubmittingProposal(true);
    setProposeError("");
    try {
      const r = await fetch(`${API}/store/promotions/propose`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: user.storeId,
          storeName: user.storeName || "",
          title: form.title,
          description: form.description,
          proposedDiscount: parseFloat(form.proposedDiscount),
          proposedStartDate: form.proposedStartDate,
          proposedEndDate: form.proposedEndDate,
          notes: form.notes,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to submit proposal");
      setShowProposeForm(false);
      fetchProposals(user.storeId);
    } catch (e: any) {
      setProposeError(e.message || "Failed to submit proposal");
    } finally {
      setSubmittingProposal(false);
    }
  }

  const activePromos   = promos.filter(isActive);
  const upcomingPromos = promos.filter(isUpcoming);
  const pastPromos     = promos.filter((p) => !isActive(p) && !isUpcoming(p));

  const claimProps = {
    enrollingId,
    claimOpenId,
    claimItems,
    submittingClaim,
    claimError,
    onEnroll: handleEnroll,
    onOpenClaim: openClaim,
    onCloseClaim: () => setClaimOpenId(null),
    onAddRow: () => setClaimItems((prev) => [...prev, { productName: "", unitsSold: "", unitPrice: "" }]),
    onRemoveRow: (i: number) => setClaimItems((prev) => prev.filter((_, idx) => idx !== i)),
    onUpdateRow: (i: number, field: keyof ClaimItem, val: string) =>
      setClaimItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: val } : row))),
    onSubmitClaim: handleSubmitClaim,
  };

  return (
    <div>
      {/* Credit balance banner */}
      {creditBalance > 0 && (
        <div
          className="mb-5 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium"
          style={{ background: "#f0f7f2", border: "1px solid #a8d8b8", color: "#2a7a4e" }}
        >
          <span>💰</span>
          <span>
            You have <strong>${creditBalance.toFixed(2)}</strong> in store credit — apply it on your next order.
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: "#6b6045" }}>
          Current deals, campaigns, and your custom promotion proposals.
        </p>
        <button
          onClick={() => { setShowProposeForm((v) => !v); setProposeError(""); }}
          className="px-4 py-2 rounded text-xs font-semibold transition-colors"
          style={{
            background: showProposeForm ? "#e8e2cc" : "#c45a1a",
            color: showProposeForm ? "#4a4535" : "#fff",
          }}
        >
          {showProposeForm ? "Cancel" : "+ Propose a Promotion"}
        </button>
      </div>

      {showProposeForm && (
        <ProposeForm
          submitting={submittingProposal}
          error={proposeError}
          onSubmit={handleSubmitProposal}
          onCancel={() => setShowProposeForm(false)}
        />
      )}

      {loadingPromos && (
        <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
          Loading promotions…
        </div>
      )}

      {!loadingPromos && (
        <>
          {/* Active */}
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9a8f6e" }}>
            Active Promotions
          </h3>
          {activePromos.length === 0 ? (
            <div className="text-sm py-8 text-center mb-6" style={{ color: "#9a8f6e" }}>
              No active promotions right now.
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {activePromos.map((promo) => (
                <PromoCard key={promo._id} promo={promo} {...claimProps} />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcomingPromos.length > 0 && (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9a8f6e" }}>
                Upcoming
              </h3>
              <div className="space-y-2 mb-6">
                {upcomingPromos.map((promo) => (
                  <Card key={promo._id} className="p-4" style={{ background: "#fafaf7", border: "1px solid #e5e0c8" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#4a4535" }}>{promo.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>
                          Starts {fmtDate(promo.startDate)}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#e8f4ff", color: "#1d6fa4" }}>
                        Upcoming
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Past */}
          {pastPromos.length > 0 && (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9a8f6e" }}>
                Past Promotions
              </h3>
              <div className="space-y-2 mb-6">
                {pastPromos.map((promo) => (
                  <Card key={promo._id} className="p-4" style={{ background: "#fafaf7", border: "1px solid #e5e0c8", opacity: 0.6 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#6b6045" }}>{promo.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>
                          Ended {fmtDate(promo.endDate)}
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: "#9a8f6e" }}>Expired</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* My Proposals */}
      {!loadingProposals && proposals.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-2" style={{ color: "#9a8f6e" }}>
            My Promotion Proposals
          </h3>
          <div className="space-y-3">
            {proposals.map((p) => (
              <ProposalCard key={p._id} proposal={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
