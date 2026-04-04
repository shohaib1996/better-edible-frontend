"use client";

import { use, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getPPSUser } from "@/lib/ppsUser";
import DigitCounter from "@/components/PPS/DigitCounter";
import PrintLabel from "@/components/PPS/PrintLabel";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import {
  useGetStage4CookItemsQuery,
  useConfirmCountMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { IConfirmCountResponse } from "@/types/privateLabel/pps";

export default function AdminStage4ItemPage({
  params,
}: {
  params: Promise<{ cookItemId: string }>;
}) {
  const { cookItemId } = use(params);
  const decodedCookItemId = decodeURIComponent(cookItemId);
  const router = useRouter();

  const { data, isLoading, isError } = useGetStage4CookItemsQuery();
  const allItems = data?.cookItems ?? [];
  const item = allItems.find((i) => i.cookItemId === decodedCookItemId);

  const expectedCount = item?.expectedCount ?? 0;
  const [count, setCount] = useState<number | null>(null);
  const actualCount = count ?? expectedCount;

  const fullCases = Math.floor(actualCount / 100);
  const partialCase = actualCount % 100;
  const totalCases = fullCases + (partialCase > 0 ? 1 : 0);

  const [result, setResult] = useState<IConfirmCountResponse | null>(null);
  const [isDone, setIsDone] = useState(item?.status === "packaging_casing_complete");
  const printRef = useRef<HTMLDivElement>(null);

  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  const handleConfirmCount = useCallback(async () => {
    if (!item?.cookItemId) return;
    try {
      const res = await confirmCount({
        cookItemId: item.cookItemId,
        actualCount,
        performedBy: getPPSUser(),
      } as any).unwrap();
      setResult(res);
      setIsDone(true);
      toast.success("Count confirmed — cases created");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to confirm count");
    }
  }, [confirmCount, item, actualCount]);

  const printCaseLabels = useCallback(() => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=600,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 4in; font-family: sans-serif; }
    .print-label { page-break-after: always; break-after: page; }
    .print-label:last-child { page-break-after: avoid; break-after: avoid; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="p-4 md:p-8 bg-background min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pps")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Item not found</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Cook item <span className="font-mono">{decodedCookItemId}</span> was not found in the Stage 4 queue.
        </p>
      </div>
    );
  }

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Package className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">{item.flavor}</h1>
            <p className="text-base text-muted-foreground">{item.storeName}</p>
          </div>
        </div>
        <Badge variant="outline" className={`shrink-0 text-sm px-3 py-1 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0 border rounded-xs divide-x mb-6">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Qty</p>
          <p className="text-xl font-bold">{expectedCount.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Molds</p>
          <p className="text-xl font-bold">{Math.ceil(expectedCount / 70)}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Est. Cases</p>
          <p className="text-xl font-bold">{Math.floor(expectedCount / 100) + (expectedCount % 100 > 0 ? 1 : 0)}</p>
        </div>
      </div>

      {/* Packaging form */}
      {!isDone ? (
        <div className="flex flex-col gap-5 rounded-xs border bg-card p-5">
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
            <strong>Bag, seal, and count</strong> all gummies from this batch. Adjust the count below if needed.
          </div>

          <DigitCounter value={actualCount} onChange={setCount} compact />

          {/* Case breakdown */}
          <div className="bg-muted/50 rounded-xs p-4 text-sm space-y-1">
            <p className="text-muted-foreground font-medium">Case Breakdown:</p>
            {fullCases > 0 && <p>— {fullCases} full case{fullCases !== 1 ? "s" : ""} of 100 units</p>}
            {partialCase > 0 && <p>— 1 partial case of {partialCase} units</p>}
            <p className="text-base font-bold mt-1">Total: {totalCases} case{totalCases !== 1 ? "s" : ""}</p>
          </div>

          <Button
            size="lg"
            disabled={isConfirming || actualCount === 0}
            className="w-full text-base h-12 gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 font-bold"
            onClick={handleConfirmCount}
          >
            {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirm Count & Create Cases
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xs border bg-card p-5">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-lg font-bold">Packaging complete</p>
              {result && (
                <p className="text-sm text-muted-foreground">
                  {result.cases.length} case{result.cases.length !== 1 ? "s" : ""} created · {result.orderStatus.completedItems}/{result.orderStatus.totalItems} items in order done
                </p>
              )}
            </div>
          </div>

          {result && (
            <>
              <div ref={printRef} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
                {result.cases.map((c) => (
                  <PrintLabel key={c.caseId} type="case" data={c.labelData} />
                ))}
              </div>
              <Button size="lg" className="w-full text-base h-12 rounded-xs font-bold" onClick={printCaseLabels}>
                Print Case Labels ({result.cases.length})
              </Button>
            </>
          )}
        </div>
      )}

      {/* History */}
      <div className="mt-6">
        <CookItemHistory cookItemId={item.cookItemId} isAdmin={true} />
      </div>
    </div>
  );
}
