"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import type { LineItem, SelectedCannabinoid } from "@/types/storePortal/privateLabel";
import type { CannabinoidName } from "@/types/privateLabel/gummyBuilder";
import {
  useCreateDraftLabelMutation,
  useSubmitLineMutation,
} from "@/redux/api/PrivateLabel/storeLabelApi";
import {
  GUMMY_SIZES,
  OIL_TYPES,
  EFFECTS_BY_OIL,
  CANNABINOID_OPTIONS,
  ORDER_MINIMUM,
  isPoolEligible,
} from "@/lib/privateLabelHelpers";
import { GummyBuilder } from "./privateLabel/GummyBuilder";
import { MyLinePanel } from "./privateLabel/MyLinePanel";
import { AccountTab } from "./privateLabel/AccountTab";
import { ProfitModal } from "./privateLabel/ProfitModal";

const PROCESS_STEPS = [
  {
    n: 1,
    title: "Design & Proofing",
    desc: "Your rep builds label artwork for each flavor using your brand assets and the colors you generated, then sends digital proofs for your approval.",
  },
  {
    n: 2,
    title: "Your Approval",
    desc: "You review and sign off on every label. Nothing moves forward until you approve the final artwork and copy.",
  },
  {
    n: 3,
    title: "OLCC Label Submission",
    desc: "We submit your approved labels to the OLCC for compliance pre-approval. Oregon requires every cannabis edible label to clear state review before packaging — this is the longest step and is outside our control.",
  },
  {
    n: 4,
    title: "Production & Fulfillment",
    desc: "Once OLCC clears your labels, we schedule your batch, produce your gummies at 100mg THC per piece (10 pieces per package), and coordinate delivery.",
  },
];

export function PrivateLabelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<IStoreUser | null>(null);
  const [activeTab, setActiveTab] = useState<"builder" | "account">("builder");
  const [line, setLine] = useState<LineItem[]>([]);
  const [lineOpen, setLineOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcUnitPrice, setCalcUnitPrice] = useState(1.75);
  const [initialCannabinoids, setInitialCannabinoids] = useState<SelectedCannabinoid[]>([]);

  const [createDraftLabel] = useCreateDraftLabelMutation();
  const [submitLine] = useSubmitLineMutation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
      else router.replace("/store-portal/login");
    } catch {
      router.replace("/store-portal/login");
    }
  }, [router]);

  // Listen for layout sub-bar "Profit Calculator" button
  useEffect(() => {
    const handler = () => setShowCalcModal(true);
    window.addEventListener("open-profit-calculator", handler);
    return () => window.removeEventListener("open-profit-calculator", handler);
  }, []);

  // Deep-link: ?ratio=CBD-200_CBN-50 preselects cannabinoids
  useEffect(() => {
    const ratio = searchParams.get("ratio");
    if (!ratio) return;
    const picks: SelectedCannabinoid[] = [];
    ratio.split("_").forEach((part) => {
      const dashIdx = part.lastIndexOf("-");
      if (dashIdx < 0) return;
      const name = part.slice(0, dashIdx);
      const mg = parseInt(part.slice(dashIdx + 1), 10);
      const opt = CANNABINOID_OPTIONS.find((o) => o.name.toLowerCase() === name.toLowerCase());
      if (!opt || !mg) return;
      const mgOpt = opt.mgOptions.find((m) => m.mg === mg);
      if (!mgOpt) return;
      picks.push({ name: opt.name, mg: mgOpt.mg, adder: mgOpt.adder });
    });
    if (picks.length > 0) {
      setInitialCannabinoids(picks);
      setActiveTab("builder");
      try { window.history.replaceState({}, "", window.location.pathname); } catch { /* noop */ }
    }
  }, [searchParams]);

  const lineTotal = line.reduce((sum, item) => sum + item.units * item.unitPrice, 0);
  const lineUnits = line.reduce((sum, item) => sum + item.units, 0);
  const orderReady = lineTotal >= ORDER_MINIMUM;

  const handleAddToLine = (item: LineItem) => {
    setLine((prev) => [...prev, item]);
    setCalcUnitPrice(item.unitPrice);
  };

  const handleRemoveFromLine = (id: string) => {
    setLine((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmitLine = async () => {
    if (!orderReady || line.length === 0 || !user?.storeId) {
      setSubmitError("Missing store information. Please sign out and back in.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const createdIds: string[] = [];
      for (const item of line) {
        const sizeValue = item.gummySize === "17g" ? "xl" : "standard";
        const result = await createDraftLabel({
          storeId: user.storeId,
          flavorName: item.flavorName,
          size: sizeValue as "standard" | "xl",
          oilType: item.oilType as "biomax" | "rosin",
          effect: item.effect as "hybrid" | "indica" | "sativa",
          cannabinoids: item.cannabinoids.map((c) => ({
            name: c.name as CannabinoidName,
            mg: c.mg,
          })),
          unitsOrdered: item.units,
          gummyColorHex: item.color.hex,
          gummyColorName: item.color.color_name,
          selectedFlavors:
            item.color.lorann_components.length > 0
              ? item.color.lorann_components.map((c) => c.name)
              : undefined,
        }).unwrap();
        createdIds.push(result.label._id);
      }

      await submitLine({
        storeId: user.storeId,
        logoStatus: "use_existing",
        productionChoices: createdIds.map((id, i) => ({
          labelId: id,
          productionMode: isPoolEligible(line[i].cannabinoids) ? "pool" : "standard",
        })),
      }).unwrap();

      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { data?: { message?: string } })?.data?.message ||
            "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Submitted confirmation ────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-1" style={{ marginBottom: 80 }}>
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5 text-xl"
            style={{ background: "#2d7a3a", color: "#fff" }}
          >
            ✓
          </div>
          <h2
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#2a2518" }}
          >
            Line Submitted
          </h2>
          <p className="text-sm" style={{ color: "#6b6045", maxWidth: 460 }}>
            Thank you. Your private label line is in our queue and your rep will reach out
            within 2 business days to begin the design process.
          </p>
        </div>

        <div className="rounded-lg overflow-hidden mb-8" style={{ border: "1px solid #d6d0b4" }}>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: "#2a2518", color: "#f5f0e8" }}
          >
            <div className="text-sm font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              Submission Summary
            </div>
            <div className="text-[11px]" style={{ color: "rgba(245,240,232,0.55)" }}>
              {line.length} flavor{line.length !== 1 ? "s" : ""} &middot; {lineUnits.toLocaleString()} units
            </div>
          </div>
          <div style={{ background: "#fafaf7" }}>
            {line.map((item, idx) => {
              const sizeLabel = GUMMY_SIZES.find((s) => s.value === item.gummySize)?.label || item.gummySize;
              const oilLabel = OIL_TYPES.find((o) => o.value === item.oilType)?.label || item.oilType;
              const allEffOpts = [...EFFECTS_BY_OIL.biomax, ...EFFECTS_BY_OIL.rosin];
              const effLabel = allEffOpts.find((e) => e.value === item.effect)?.label || item.effect;
              const itemTotal = item.units * item.unitPrice;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 px-4 py-3"
                  style={{ borderBottom: idx < line.length - 1 ? "1px solid #e5e0c8" : "none" }}
                >
                  <div
                    className="shrink-0 w-7 h-7 rounded mt-0.5"
                    style={{ background: item.color.hex, border: "1px solid rgba(0,0,0,0.08)" }}
                    title={item.color.color_name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: "#2a2518" }}>{item.flavorName}</div>
                        <div className="text-[10px]" style={{ color: "#9a8f6e" }}>{sizeLabel} · {oilLabel} · {effLabel}</div>
                        <div className="text-[10px]" style={{ color: "#9a8f6e" }}>{item.units.toLocaleString()} units · ${item.unitPrice.toFixed(2)}/ea</div>
                      </div>
                      <div className="text-xs font-semibold shrink-0" style={{ color: "#c45a1a" }}>
                        ${itemTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: "1px solid #e5e0c8", background: "#fff" }}>
            <span className="text-sm font-semibold" style={{ color: "#2a2518" }}>Estimated Total</span>
            <span className="text-lg font-bold" style={{ color: "#c45a1a" }}>
              ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-semibold mb-4" style={{ color: "#2a2518", fontFamily: "Georgia, serif" }}>What happens next</h3>
        <div className="space-y-4 mb-8">
          {PROCESS_STEPS.map((step) => (
            <div key={step.n} className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#f0ece0", color: "#c45a1a", border: "1px solid #d6d0b4" }}>
                {step.n}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold mb-0.5" style={{ color: "#2a2518" }}>{step.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#6b6045" }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg p-4 mb-8 text-xs leading-relaxed" style={{ background: "#fdf8ef", border: "1px solid #e8d9b8", color: "#6b6045" }}>
          <span className="font-semibold" style={{ color: "#2a2518" }}>A note on timing:</span>{" "}
          Because we operate under Oregon Liquor and Cannabis Commission (OLCC) regulations, every label
          must pass state compliance review before production can begin. Timelines depend on OLCC turnaround
          and are set by the state, not by us. Your rep will keep you updated at each stage.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setActiveTab("account"); }} className="px-6 py-2.5 rounded text-sm font-medium" style={{ background: "#2a2518", color: "#fff" }}>
            View My Labels
          </button>
          <button onClick={() => { setSubmitted(false); setLine([]); }} className="px-6 py-2.5 rounded text-sm font-medium" style={{ background: "#c45a1a", color: "#fff" }}>
            Build a New Line
          </button>
        </div>
      </div>
    );
  }

  // ─── Main layout ───────────────────────────────────────────────────────────

  return (
    <div>
      {showCalcModal && (
        <ProfitModal unitPrice={calcUnitPrice} onClose={() => setShowCalcModal(false)} />
      )}

      {/* Tab nav */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: "2px solid #e8e2d0" }}>
        {(["builder", "account"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              marginBottom: -2,
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #c45a1a" : "2px solid transparent",
              color: activeTab === tab ? "#c45a1a" : "#9a8f6e",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {tab === "builder" ? "Builder" : "My Account"}
          </button>
        ))}
      </div>

      {/* My Account tab */}
      {activeTab === "account" && (
        <AccountTab
          storeId={user?.storeId ?? ""}
          enabled={activeTab === "account"}
          onSwitchToBuilder={() => setActiveTab("builder")}
        />
      )}

      {/* Builder tab */}
      {activeTab === "builder" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start pb-24 lg:pb-0">
            <div className="lg:col-span-2">
              <GummyBuilder
                key={initialCannabinoids.length > 0 ? "preset" : "default"}
                initialCannabinoids={initialCannabinoids}
                onAddToLine={handleAddToLine}
              />
            </div>
            <div className="hidden lg:block">
              <MyLinePanel
                line={line}
                onRemove={handleRemoveFromLine}
                onSubmit={handleSubmitLine}
                submitting={submitting}
                submitError={submitError}
              />
            </div>
          </div>

          {/* Mobile sticky footer */}
          <div
            className="lg:hidden"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              background: "#2a2518",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.35)",
            }}
          >
            {lineOpen && (
              <div style={{ maxHeight: "70vh", overflowY: "auto", padding: "0 16px 24px", borderTop: "1px solid #3d3526" }}>
                <div style={{ background: "#3d3526", height: 3, margin: "12px 0" }}>
                  <div style={{ height: 3, width: `${Math.min(100, (lineTotal / ORDER_MINIMUM) * 100)}%`, background: orderReady ? "#2d7a3a" : "#c45a1a", transition: "width 0.4s ease" }} />
                </div>
                {line.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">🍬</div>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>No flavors yet. Build your first one above.</p>
                  </div>
                ) : (
                  <div className="space-y-0 mb-4">
                    {line.map((item) => {
                      const allEffOpts = [...EFFECTS_BY_OIL.biomax, ...EFFECTS_BY_OIL.rosin];
                      const sizeLabel = GUMMY_SIZES.find((s) => s.value === item.gummySize)?.label || item.gummySize;
                      const oilLabel = OIL_TYPES.find((o) => o.value === item.oilType)?.label || item.oilType;
                      const effLabel = allEffOpts.find((e) => e.value === item.effect)?.label || item.effect;
                      const itemTotal = item.units * item.unitPrice;
                      return (
                        <div key={item.id} className="flex gap-3 py-2.5" style={{ borderBottom: "1px solid #3d3526" }}>
                          <div className="shrink-0 w-6 h-6 rounded mt-0.5" style={{ background: item.color.hex, border: "1px solid rgba(255,255,255,0.15)" }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold truncate" style={{ color: "#f5f0e8" }}>{item.flavorName}</div>
                                <div className="text-[10px]" style={{ color: "rgba(245,240,232,0.45)" }}>{sizeLabel} · {oilLabel} · {effLabel} · {item.units.toLocaleString()} units</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-semibold" style={{ color: "#e8a06a" }}>${itemTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <button onClick={() => handleRemoveFromLine(item.id)} className="text-[10px] mt-0.5" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.35)", padding: 0 }}>remove</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!orderReady && line.length > 0 && (
                  <div className="text-xs mb-3" style={{ color: "#e8a06a" }}>${(ORDER_MINIMUM - lineTotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more to reach $1,000 minimum</div>
                )}
                {orderReady && <div className="text-xs font-medium mb-3" style={{ color: "#4ade80" }}>✓ Order minimum reached</div>}
                {submitError && <p className="text-xs mb-3" style={{ color: "#f87171" }}>{submitError}</p>}
                <button
                  onClick={handleSubmitLine}
                  disabled={submitting || !orderReady || line.length === 0}
                  className="w-full py-2.5 rounded text-sm font-semibold"
                  style={{ background: submitting || !orderReady || line.length === 0 ? "rgba(255,255,255,0.08)" : "#c45a1a", color: submitting || !orderReady || line.length === 0 ? "rgba(245,240,232,0.35)" : "#fff" }}
                >
                  {submitting ? "Submitting…" : line.length === 0 ? "Add flavors to submit" : !orderReady ? `Need $${(ORDER_MINIMUM - lineTotal).toFixed(2)} more` : `Submit Line (${line.length} flavor${line.length !== 1 ? "s" : ""})`}
                </button>
              </div>
            )}
            <button
              onClick={() => setLineOpen((o) => !o)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px", background: "none", border: "none", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🍬</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f5f2e8" }}>{line.length === 0 ? "My Line" : `${line.length} flavor${line.length !== 1 ? "s" : ""}`}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#e8a06a" }}>— ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <span style={{ fontSize: 20, color: "#f5f2e8", transform: lineOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▲</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
