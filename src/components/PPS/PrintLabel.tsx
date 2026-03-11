"use client";

import { QRCodeSVG } from "qrcode.react";
import { Separator } from "@/components/ui/separator";
import type { ICookItem, ICaseLabelData } from "@/types/privateLabel/pps";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductionLabelData = ICookItem & { qrCodeData?: string };

type PrintLabelProps =
  | { type: "production"; data: ProductionLabelData }
  | { type: "case"; data: ICaseLabelData };

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrintLabel(props: PrintLabelProps) {
  if (props.type === "production") {
    const d = props.data;
    return (
      <div className="print-label w-[4in] border p-4 bg-white text-black text-sm font-mono">
        <h2 className="text-lg font-bold uppercase">{d.storeName}</h2>
        <h3 className="text-base font-bold">{d.flavor}</h3>
        <p className="text-base font-bold">~{d.quantity} units</p>

        <Separator className="my-2" />

        <p className="text-xs">Cook Item: {d.cookItemId}</p>
        <p className="text-xs">Order: {d.orderId}</p>
        <p className="text-xs">Label: {d.itemId || d.labelId}</p>

        {d.flavorComponents && d.flavorComponents.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-bold">Flavor Formulation:</p>
            {d.flavorComponents.map((c, i) => (
              <p key={i} className="text-xs ml-2">
                {c.name}: {c.percentage}%
              </p>
            ))}
          </div>
        )}

        {d.colorComponents && d.colorComponents.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-bold">Color Formulation:</p>
            {d.colorComponents.map((c, i) => (
              <p key={i} className="text-xs ml-2">
                {c.name}: {c.percentage}%
              </p>
            ))}
          </div>
        )}

        {d.assignedMoldIds?.map((moldId) => (
          <p key={moldId} className="text-xs">
            Mold: {moldId}
          </p>
        ))}

        {d.cookingMoldingCompletionTimestamp && (
          <p className="text-xs">
            Molded: {formatDate(d.cookingMoldingCompletionTimestamp)}
          </p>
        )}

        {d.dehydratorAssignments?.map((a, i) => (
          <p key={i} className="text-xs">
            Dehydrator: {a.trayId}, {a.dehydratorUnitId}, Shelf {a.shelfPosition}
          </p>
        ))}

        {d.demoldingCompletionTimestamp && (
          <p className="text-xs">Packed: {formatDate(d.demoldingCompletionTimestamp)}</p>
        )}

        <div className="mt-2 flex justify-center">
          <QRCodeSVG
            value={
              d.qrCodeData ||
              JSON.stringify({ cookItemId: d.cookItemId })
            }
            size={120}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      </div>
    );
  }

  // case label
  const d = props.data;
  return (
    <div className="print-label w-[4in] border p-4 bg-white text-black font-mono">
      <h2 className="text-lg font-bold uppercase">{d.storeName}</h2>
      <h3 className="text-base font-bold">{d.flavor}</h3>
      <p className="text-xl font-bold">{d.unitCount} units</p>

      <Separator className="my-2" />

      <p className="text-xs">Case ID: {d.caseId}</p>

      <div className="mt-2 flex justify-center">
        <QRCodeSVG value={JSON.stringify({ caseId: d.caseId })} size={100} bgColor="#ffffff" fgColor="#000000" />
      </div>
    </div>
  );
}
