"use client";

import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import type { ICookItem, ICaseLabelData } from "@/types/privateLabel/pps";

const HR = () => (
  <hr style={{ border: "none", borderTop: "1px solid #000", margin: "0.05in 0" }} />
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLabelTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatLabelDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductionLabelData = ICookItem & { qrCodeData?: string };

type PrintLabelProps =
  | { type: "production"; data: ProductionLabelData }
  | { type: "case"; data: ICaseLabelData };

// ─── Production Label (4×6, one per flavor / cook item) ──────────────────────

function ProductionLabel({ d }: { d: ProductionLabelData }) {
  const createdAt = d.demoldingCompletionTimestamp || d.createdAt;
  const moldIds = d.assignedMoldIds ?? [];
  const trayIds = d.dehydratorTrayIds ?? [];

  return (
    <div
      className="print-label bg-white text-black font-sans"
      style={{
        width: "4in",
        padding: "0.15in",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "0.05in",
        border: "1px solid #ccc",
      }}
    >
      {/* Store name — largest element */}
      <div
        style={{
          fontSize: "22pt",
          fontWeight: 900,
          lineHeight: 1.1,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          wordBreak: "break-word",
        }}
      >
        {d.storeName}
      </div>

      <HR />

      {/* Primary info block */}
      <div style={{ fontSize: "16pt", fontWeight: 700, lineHeight: 1.35 }}>
        <div>FLAVOR: {d.flavor}</div>
        <div>COUNT: ~{d.quantity}</div>
        <div>CONTENT: {d.productType?.toUpperCase() || "BIOMAX"}</div>
      </div>

      <HR />

      {/* Secondary info */}
      <div
        style={{
          fontSize: "10pt",
          fontWeight: 500,
          lineHeight: 1.55,
          fontFamily: "monospace",
        }}
      >
        <div>COOK ITEM: {d.cookItemId}</div>
        <div>ORDER: {d.orderId}</div>
        {moldIds.length > 0 && (
          <div>MOLD{moldIds.length > 1 ? "S" : ""}: {moldIds.join(", ")}</div>
        )}
        {trayIds.length > 0 && (
          <div>TRAY{trayIds.length > 1 ? "S" : ""}: {trayIds.join(", ")}</div>
        )}
      </div>

      {/* Formulation */}
      {(d.flavorComponents?.length > 0 || d.colorComponents?.length > 0) && (
        <>
          <HR />
          <div style={{ fontSize: "8.5pt", lineHeight: 1.4, fontFamily: "monospace" }}>
            {d.flavorComponents?.length > 0 && (
              <div>
                FLAVOR FORM:{" "}
                {d.flavorComponents.map((c) => `${c.name} ${c.percentage}%`).join(", ")}
              </div>
            )}
            {d.colorComponents?.length > 0 && (
              <div>
                COLOR FORM:{" "}
                {d.colorComponents.map((c) => `${c.name} ${c.percentage}%`).join(", ")}
              </div>
            )}
          </div>
        </>
      )}

      {/* Timestamps + mold count */}
      <div
        style={{
          fontSize: "10pt",
          fontWeight: 500,
          lineHeight: 1.55,
          fontFamily: "monospace",
        }}
      >
        <div>CREATE TIME: {formatLabelTime(createdAt)}</div>
        <div>CREATE DATE: {formatLabelDate(createdAt)}</div>
        <div>MOLDS: {moldIds.length} &nbsp; TRAYS: {trayIds.length}</div>
      </div>

      {/* Barcode — cookItemId */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Barcode
          value={d.cookItemId || "UNKNOWN"}
          format="CODE128"
          width={2}
          height={55}
          displayValue={true}
          fontSize={10}
          margin={2}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrintLabel(props: PrintLabelProps) {
  if (props.type === "production") {
    return <ProductionLabel d={props.data} />;
  }

  // case label
  const d = props.data;
  return (
    <div
      className="print-label bg-white text-black font-sans"
      style={{
        width: "4in",
        minHeight: "6in",
        padding: "0.2in",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "0.1in",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      <div style={{ fontSize: "22pt", fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "-0.01em", wordBreak: "break-word" }}>
        {d.storeName}
      </div>
      <div style={{ fontSize: "16pt", fontWeight: 700, lineHeight: 1.35 }}>
        {d.flavor}
      </div>
      <div style={{ fontSize: "20pt", fontWeight: 800 }}>
        {d.unitCount} units
      </div>

      <HR />

      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.1in" }}>
        <QRCodeSVG value={JSON.stringify({ caseId: d.caseId, cookItemId: d.cookItemId })} size={160} bgColor="#ffffff" fgColor="#000000" />
      </div>
    </div>
  );
}
