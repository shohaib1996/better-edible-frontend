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
  | { type: "bagging"; data: ICookItem }
  | { type: "case"; data: ICaseLabelData };

// ─── Production Label (4×3, dehydrator unload — full tracking detail) ────────

function ProductionLabel({ d }: { d: ProductionLabelData }) {
  const createdAt = d.demoldingCompletionTimestamp || d.createdAt;
  const moldIds = d.assignedMoldIds ?? [];
  const trayIds = d.dehydratorTrayIds ?? [];

  return (
    <div
      className="print-label bg-white text-black font-sans"
      style={{
        width: "4in",
        padding: "0.12in",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "0.04in",
        border: "1px solid #ccc",
      }}
    >
      {/* Store name */}
      <div style={{ fontSize: "14pt", fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "-0.01em", wordBreak: "break-word" }}>
        {d.storeName}
      </div>

      <HR />

      {/* Primary info */}
      <div style={{ fontSize: "11pt", fontWeight: 700, lineHeight: 1.3 }}>
        <div>FLAVOR: {d.flavor}</div>
        <div>COUNT: ~{d.quantity} &nbsp;|&nbsp; CONTENT: {d.productType?.toUpperCase() || "BIOMAX"}</div>
      </div>

      <HR />

      {/* Secondary info */}
      <div style={{ fontSize: "8pt", fontWeight: 500, lineHeight: 1.5, fontFamily: "monospace" }}>
        <div>COOK ITEM: {d.cookItemId}</div>
        <div>ORDER: {d.orderId}</div>
        {moldIds.length > 0 && <div>MOLD{moldIds.length > 1 ? "S" : ""}: {moldIds.join(", ")}</div>}
        {trayIds.length > 0 && <div>TRAY{trayIds.length > 1 ? "S" : ""}: {trayIds.join(", ")}</div>}
      </div>

      {/* Formulation */}
      {(d.flavorComponents?.length > 0 || d.colorComponents?.length > 0) && (
        <>
          <HR />
          <div style={{ fontSize: "7pt", lineHeight: 1.4, fontFamily: "monospace" }}>
            {d.flavorComponents?.length > 0 && (
              <div>FLAVOR FORM: {d.flavorComponents.map((c) => `${c.name} ${c.percentage}%`).join(", ")}</div>
            )}
            {d.colorComponents?.length > 0 && (
              <div>COLOR FORM: {d.colorComponents.map((c) => `${c.name} ${c.percentage}%`).join(", ")}</div>
            )}
          </div>
        </>
      )}

      {/* Timestamps */}
      <div style={{ fontSize: "8pt", fontWeight: 500, lineHeight: 1.5, fontFamily: "monospace" }}>
        <div>UNLOADED: {formatLabelDate(createdAt)} {formatLabelTime(createdAt)}</div>
        <div>MOLDS: {moldIds.length} &nbsp; TRAYS: {trayIds.length}</div>
      </div>

      {/* Barcode */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Barcode
          value={d.cookItemId || "UNKNOWN"}
          format="CODE128"
          width={1.6}
          height={40}
          displayValue={true}
          fontSize={8}
          margin={2}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>
    </div>
  );
}

// ─── Bagging Label (4×2, Stage 3 — bag contents label) ───────────────────────

function BaggingLabel({ d }: { d: ICookItem }) {
  const baggedAt = d.baggingStartTimestamp || d.createdAt;

  return (
    <div
      className="print-label bg-white text-black font-sans"
      style={{
        width: "4in",
        height: "2in",
        padding: "0.1in",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "0.02in",
        border: "1px solid #ccc",
        overflow: "hidden",
      }}
    >
      {/* Store name */}
      <div style={{ fontSize: "12pt", fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "-0.01em", wordBreak: "break-word" }}>
        {d.storeName}
      </div>

      <HR />

      {/* Primary info */}
      <div style={{ fontSize: "9pt", fontWeight: 700, lineHeight: 1.25 }}>
        <div>FLAVOR: {d.flavor} &nbsp;|&nbsp; COUNT: ~{d.quantity} &nbsp;|&nbsp; {d.productType?.toUpperCase() || "BIOMAX"}</div>
      </div>

      {/* Bag info */}
      <div style={{ fontSize: "7pt", fontWeight: 500, lineHeight: 1.4, fontFamily: "monospace" }}>
        <div>COOK ITEM: {d.cookItemId} &nbsp; ORDER: {d.orderId}</div>
        <div>BAGGED: {formatLabelDate(baggedAt)} {formatLabelTime(baggedAt)}</div>
      </div>

      {/* Barcode — fixed height, no overflow */}
      <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <Barcode
          value={d.cookItemId || "UNKNOWN"}
          format="CODE128"
          width={1.4}
          height={30}
          displayValue={true}
          fontSize={7}
          margin={1}
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
  if (props.type === "bagging") {
    return <BaggingLabel d={props.data} />;
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
