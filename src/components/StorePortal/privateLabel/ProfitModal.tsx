"use client";

import { useState, useMemo } from "react";
import { ProfitInputs } from "./ProfitInputs";
import { ProfitResults } from "./ProfitResults";

const TAX_RATE = 0.2;

function calcProfit(
  afterTaxPrice: number,
  unitsPerMonth: number,
  capturePercent: number,
  wholesalePerUnit: number,
) {
  const capturedUnits = Math.round(unitsPerMonth * (capturePercent / 100));
  const shelfPrice = afterTaxPrice / (1 + TAX_RATE);
  const revenue = shelfPrice * capturedUnits;
  const cogs = wholesalePerUnit * capturedUnits;
  const profit = revenue - cogs;
  const margin = cogs > 0 ? (profit / cogs) * 100 : 0;
  const annualProfit = profit * 12;
  return { capturedUnits, revenue, cogs, profit, margin, annualProfit };
}

interface ProfitModalProps {
  unitPrice: number;
  onClose: () => void;
}

export function ProfitModal({ unitPrice, onClose }: ProfitModalProps) {
  const [volumeMode, setVolumeMode] = useState<"day" | "month">("month");
  const [volumeInput, setVolumeInput] = useState("200");
  const [priceInput, setPriceInput] = useState("6.00");
  const [captureInput, setCaptureInput] = useState("20");

  const volumeRaw = parseFloat(volumeInput) || 0;
  const unitsPerMonth =
    volumeMode === "day" ? Math.round(volumeRaw * 30) : Math.round(volumeRaw);
  const retailPrice = parseFloat(priceInput) || 0;
  const capturePercent = Math.min(100, Math.max(0, parseFloat(captureInput) || 0));
  const hasValidInputs = retailPrice > 0 && unitsPerMonth > 0 && capturePercent > 0;

  const metrics = useMemo(
    () => calcProfit(retailPrice, unitsPerMonth, capturePercent, unitPrice),
    [retailPrice, unitsPerMonth, capturePercent, unitPrice],
  );

  const fmtDec = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(42,37,24,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="scrollbar-hidden"
        style={{
          background: "#0d1f0f",
          border: "1px solid rgba(200,151,90,0.25)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.75rem",
          color: "#fff",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: "1.25rem",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#c8975a",
              marginBottom: "0.4rem",
            }}
          >
            Profit Calculator
          </div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            How much will you make?
          </h2>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: "0.4rem" }}>
            Based on your current build:{" "}
            <strong style={{ color: "#c8975a" }}>{fmtDec(unitPrice)}/unit</strong> wholesale
          </p>
        </div>

        <ProfitInputs
          volumeMode={volumeMode}
          volumeInput={volumeInput}
          priceInput={priceInput}
          captureInput={captureInput}
          onVolumeMode={setVolumeMode}
          onVolumeInput={setVolumeInput}
          onPriceInput={setPriceInput}
          onCaptureInput={setCaptureInput}
        />

        {hasValidInputs && (
          <ProfitResults
            metrics={metrics}
            retailPrice={retailPrice}
            unitPrice={unitPrice}
            taxRate={TAX_RATE}
          />
        )}

        <p
          style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.3)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Oregon cannabis excise tax (20%) applied. Wholesale cost reflects your current gummy
          build.
        </p>
      </div>
    </div>
  );
}
