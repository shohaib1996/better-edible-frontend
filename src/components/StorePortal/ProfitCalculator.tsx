"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const CORMORANT = "'Cormorant Garamond', Georgia, serif";
const DM_SANS = "'DM Sans', system-ui, sans-serif";
const GREEN = "#1a7a3c";
const DARK_GREEN = "#145c2d";
const GOLD = "#c8975a";
const BG = "#0d1f0f";

const TAX_RATE = 0.20;
const WHOLESALE_PER_UNIT = 1.75;
const MIN_ORDER = 1000;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDec(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcMetrics(afterTaxPrice: number, unitsPerMonth: number, capturePercent: number) {
  const capturedUnits = Math.round(unitsPerMonth * (capturePercent / 100));
  const shelfPrice = afterTaxPrice / (1 + TAX_RATE);
  const taxPerUnit = afterTaxPrice - shelfPrice;
  const revenue = shelfPrice * capturedUnits;
  const exciseTax = taxPerUnit * capturedUnits;
  const cogs = WHOLESALE_PER_UNIT * capturedUnits;
  const profit = revenue - cogs;
  const margin = cogs > 0 ? (profit / cogs) * 100 : 0;
  const annualProfit = profit * 12;
  const daysToRecoup = profit > 0 ? Math.ceil(MIN_ORDER / (profit / 30)) : 999;
  return { capturedUnits, revenue, exciseTax, cogs, profit, margin, annualProfit, daysToRecoup };
}

export function ProfitCalculator() {
  const router = useRouter();

  const [volumeMode, setVolumeMode] = useState<"day" | "month">("month");
  const [volumeInput, setVolumeInput] = useState("200");
  const [priceInput, setPriceInput] = useState("5.00");
  const [captureInput, setCaptureInput] = useState("20");
  const [showDetails, setShowDetails] = useState(false);

  const volumeRaw = parseFloat(volumeInput) || 0;
  const unitsPerMonth = volumeMode === "day" ? Math.round(volumeRaw * 30) : Math.round(volumeRaw);
  const retailPrice = parseFloat(priceInput) || 0;
  const capturePercent = Math.min(100, Math.max(0, parseFloat(captureInput) || 0));

  const metrics = useMemo(
    () => calcMetrics(retailPrice, unitsPerMonth, capturePercent),
    [retailPrice, unitsPerMonth, capturePercent]
  );

  const minOrderUnits = Math.ceil(MIN_ORDER / WHOLESALE_PER_UNIT);
  const hasValidInputs = retailPrice > 0 && unitsPerMonth > 0 && capturePercent > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .calc-field {
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(200,151,90,0.3);
          border-radius: 10px;
          color: #fff;
          font-family: ${DM_SANS};
          font-size: 1.25rem;
          font-weight: 600;
          padding: 0.75rem 1.1rem;
          width: 100%;
          outline: none;
          transition: border-color 0.18s, background 0.18s;
          -moz-appearance: textfield;
        }
        .calc-field::-webkit-outer-spin-button,
        .calc-field::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .calc-field:focus {
          border-color: ${GOLD};
          background: rgba(255,255,255,0.10);
        }
        .calc-field::placeholder { color: rgba(255,255,255,0.25); }

        .toggle-btn {
          flex: 1;
          padding: 0.45rem 0;
          border: none;
          border-radius: 7px;
          font-family: ${DM_SANS};
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .toggle-btn.active { background: ${GREEN}; color: #fff; }
        .toggle-btn.inactive { background: transparent; color: rgba(255,255,255,0.4); }

        .money-glow {
          text-shadow: 0 0 40px rgba(26,122,60,0.7), 0 0 80px rgba(26,122,60,0.35);
        }
        .fade-in { animation: fadeIn 0.35s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pulse-cta { animation: pulseCta 2.2s ease-in-out infinite; }
        @keyframes pulseCta {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,122,60,0.5); }
          50%       { box-shadow: 0 0 0 14px rgba(26,122,60,0); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: DM_SANS }}>

        <div style={{ borderBottom: "1px solid rgba(200,151,90,0.2)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => router.push("/store-portal")}
            style={{ background: "none", border: "none", color: GOLD, fontFamily: DM_SANS, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: 0.8 }}
          >
            ← Better Edibles
          </button>
          <button
            onClick={() => router.push("/store-portal/login")}
            style={{ background: "none", border: `1px solid rgba(200,151,90,0.4)`, color: GOLD, fontFamily: DM_SANS, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", padding: "0.4rem 1rem", borderRadius: 4 }}
          >
            Retailer Login
          </button>
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>

          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💰</div>
            <h1 style={{ fontFamily: CORMORANT, fontWeight: 700, fontSize: "clamp(2.2rem, 7vw, 3.2rem)", letterSpacing: "0.02em", color: "#fff", lineHeight: 1.05, marginBottom: "0.75rem" }}>
              PROFIT CALCULATOR
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", letterSpacing: "0.04em", lineHeight: 1.7 }}>
              See exactly how much more money your store makes<br />with Better Edibles on your shelf.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,151,90,0.18)", borderRadius: 18, padding: "2rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: DM_SANS, fontWeight: 500, fontSize: "0.68rem", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, marginBottom: "1.75rem" }}>
              Tell us about your store
            </h2>

            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <label style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
                  How many 100mg single-piece gummies do you sell?
                </label>
                <div style={{ display: "flex", gap: "3px", background: "rgba(255,255,255,0.07)", borderRadius: 9, padding: "3px", marginLeft: "1rem", flexShrink: 0 }}>
                  <button className={`toggle-btn ${volumeMode === "day" ? "active" : "inactive"}`} onClick={() => setVolumeMode("day")} style={{ minWidth: 52 }}>/ Day</button>
                  <button className={`toggle-btn ${volumeMode === "month" ? "active" : "inactive"}`} onClick={() => setVolumeMode("month")} style={{ minWidth: 52 }}>/ Mo</button>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="calc-field"
                  type="number"
                  min={0}
                  placeholder={volumeMode === "day" ? "e.g. 10" : "e.g. 300"}
                  value={volumeInput}
                  onChange={e => setVolumeInput(e.target.value)}
                />
                {unitsPerMonth > 0 && volumeMode === "day" && (
                  <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}>
                    ≈ {unitsPerMonth.toLocaleString()}/mo
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", fontSize: "0.83rem", color: "rgba(255,255,255,0.65)", marginBottom: "0.6rem", lineHeight: 1.4 }}>
                What&apos;s your cheapest 100mg gummy priced at? <span style={{ color: "rgba(255,255,255,0.35)" }}>(after tax)</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }}>$</span>
                <input
                  className="calc-field"
                  type="number"
                  min={0}
                  step={0.25}
                  placeholder="5.00"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  style={{ paddingLeft: "2rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.83rem", color: "rgba(255,255,255,0.65)", marginBottom: "0.6rem", lineHeight: 1.4 }}>
                What if Better Edibles captured this much of that volume? <span style={{ color: "rgba(255,255,255,0.35)" }}>(start with 10%)</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="calc-field"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="10"
                  value={captureInput}
                  onChange={e => setCaptureInput(e.target.value)}
                  style={{ paddingRight: "2.5rem" }}
                />
                <span style={{ position: "absolute", right: "1.1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }}>%</span>
              </div>
            </div>
          </div>

          {hasValidInputs && (
            <div className="fade-in" style={{ background: `linear-gradient(135deg, ${DARK_GREEN} 0%, #0d2e15 100%)`, border: `1px solid rgba(26,122,60,0.5)`, borderRadius: 18, padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: "0.5rem" }}>
                Your monthly profit from Better Edibles
              </p>
              <div className="money-glow" style={{ fontFamily: CORMORANT, fontSize: "clamp(3.5rem, 14vw, 5.5rem)", fontWeight: 700, color: "#4ade80", lineHeight: 1, marginBottom: "0.25rem" }}>
                {fmt(metrics.profit)}
              </div>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.75rem" }}>
                {metrics.capturedUnits.toLocaleString()} units/month · <strong style={{ color: "#4ade80" }}>{metrics.margin.toFixed(0)}% margin</strong> on cost
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "0.9rem 0.5rem" }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.3rem" }}>Annual</p>
                  <p style={{ fontFamily: CORMORANT, fontSize: "1.4rem", fontWeight: 700, color: "#4ade80" }}>{fmt(metrics.annualProfit)}</p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "0.9rem 0.5rem" }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.3rem" }}>Per Unit</p>
                  <p style={{ fontFamily: CORMORANT, fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>{fmtDec(metrics.profit / (metrics.capturedUnits || 1))}</p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "0.9rem 0.5rem" }}>
                  <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.3rem" }}>Recoup</p>
                  <p style={{ fontFamily: CORMORANT, fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>{metrics.daysToRecoup}d</p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", textDecoration: "underline" }}
              >
                {showDetails ? "Hide breakdown" : "Show breakdown"}
              </button>

              {showDetails && (
                <div className="fade-in" style={{ marginTop: "1rem", textAlign: "left", fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", lineHeight: 2.1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.2rem" }}>
                    <span>Revenue ({metrics.capturedUnits} units × {fmtDec(retailPrice / (1 + TAX_RATE))} shelf)</span>
                    <span style={{ color: "#fff" }}>{fmt(metrics.revenue)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.2rem" }}>
                    <span>Oregon Cannabis Tax (20% on top → {fmtDec(retailPrice - retailPrice / (1 + TAX_RATE))}/unit)</span>
                    <span style={{ color: "#f87171" }}>−{fmt(metrics.exciseTax)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.2rem" }}>
                    <span>Your Cost (${WHOLESALE_PER_UNIT}/unit from Better Edibles)</span>
                    <span style={{ color: "#f87171" }}>−{fmt(metrics.cogs)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.2rem", fontWeight: 700 }}>
                    <span style={{ color: "#fff" }}>Your Profit</span>
                    <span style={{ color: "#4ade80" }}>{fmt(metrics.profit)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: "center", padding: "1rem 0 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "1.05rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>
              The same gummy. The best gummy around.
              <br />
              <span style={{ fontSize: "0.82rem", letterSpacing: "0.05em" }}>Your name on it. Only at your store.</span>
              <br />
              <span style={{ fontSize: "1.15rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", fontStyle: "normal", letterSpacing: "0.08em" }}>People switch. They stay.</span>
            </p>
          </div>

          <div style={{ background: "rgba(200,151,90,0.07)", border: "1px solid rgba(200,151,90,0.22)", borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "2.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🤝</span>
            <div>
              <p style={{ fontWeight: 600, color: GOLD, fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                $1,000 minimum · Cash on delivery
              </p>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                We deliver, you pay. Simple as that. No invoices, no net-30, no collections.{" "}
                {minOrderUnits.toLocaleString()} units to start, your name on every one.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              className="pulse-cta"
              onClick={() => router.push("/store2/private-label")}
              style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 12, padding: "1.1rem 2.5rem", fontFamily: DM_SANS, fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.15s, transform 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.background = DARK_GREEN)}
              onMouseLeave={e => (e.currentTarget.style.background = GREEN)}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              Build Your Gummy Line →
            </button>
            <p style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
              Custom flavors · Your label · $1,000 to start
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
