"use client";

import { useState, useCallback } from "react";
import { Loader2, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import BarcodeScannerInput from "../shared/BarcodeScannerInput";
import { toast } from "sonner";
import { getPPSUser } from "@/lib/ppsUser";
import CookItemHistory from "../shared/CookItemHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useScanContainerMutation,
  useConfirmCountMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem, IConfirmCountResponse } from "@/types/privateLabel/pps";
import PrintLabel from "../shared/PrintLabel";
import { usePrintCaseLabels } from "./usePrintCaseLabels";

interface CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  basePath: string;
}

export function CookItemCard({
  item,
  isAdmin,
  basePath: _basePath,
}: CookItemCardProps) {
  const isAlreadyDone = item.status === "packaging_casing_complete";
  const [mode, setMode] = useState<"idle" | "scanning" | "counting" | "done">(
    isAlreadyDone ? "done" : "idle",
  );
  const [count, setCount] = useState(item.expectedCount ?? 0);
  const [result, setResult] = useState<IConfirmCountResponse | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const { printRef, printCaseLabels } = usePrintCaseLabels();

  const [scanContainer] = useScanContainerMutation();
  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const expectedCount = item.expectedCount ?? 0;
  const moldsCount = Math.ceil(expectedCount / 70);
  const fullCases = Math.floor(count / 100);
  const partialCase = count % 100;
  const totalCases = fullCases + (partialCase > 0 ? 1 : 0);

  const handleScanSubmit = useCallback(
    async (qrData: string) => {
      const trimmed = qrData.trim();
      if (!trimmed || isVerifying) return;
      setIsVerifying(true);
      setScanValue("");
      try {
        await scanContainer({
          qrCodeData: trimmed,
          performedBy: getPPSUser(),
        } as any).unwrap();
        setCount(expectedCount);
        setMode("counting");
      } catch (err: any) {
        const msg = err?.data?.message ?? "Scan failed";
        toast.error(
          msg.includes("demolding_complete")
            ? "Wrong container — this item isn't ready for packaging"
            : msg.includes("not found")
              ? "Barcode not recognised — scan the production label on the container"
              : msg,
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [scanContainer, expectedCount, isVerifying],
  );

  const handleConfirmCount = useCallback(async () => {
    try {
      const res = await confirmCount({
        cookItemId: item.cookItemId,
        actualCount: count,
        performedBy: getPPSUser(),
      } as any).unwrap();
      setResult(res);
      setMode("done");
      toast.success("Count confirmed — cases created");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to confirm count");
    }
  }, [confirmCount, item.cookItemId, count]);

  return (
    <div className="flex flex-col gap-0 rounded-xs border bg-card">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-bold leading-tight truncate">
            {item.flavor}
          </p>
          <p className="text-base text-muted-foreground font-mono mt-1">
            {item.cookItemId}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-sm px-3 py-1 ${statusColor}`}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Qty
          </p>
          <p className="text-2xl font-bold">{expectedCount.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Molds
          </p>
          <p className="text-2xl font-bold">{moldsCount}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Cases
          </p>
          <p className="text-2xl font-bold">
            {Math.floor(expectedCount / 100) +
              (expectedCount % 100 > 0 ? 1 : 0)}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {item.flavorComponents && item.flavorComponents.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">
              Flavor Components
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.flavorComponents.map((fc) => (
                <Badge key={fc.name} variant="secondary" className="text-sm">
                  {fc.name} {fc.percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {mode === "idle" && (
          <Button
            size="lg"
            className="w-full text-xl h-14 rounded-xs"
            onClick={() => setMode("scanning")}
          >
            Start Packaging
          </Button>
        )}

        {mode === "scanning" && (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Scan the production label</strong> on the container to
              verify you have the right batch.
            </div>
            {isVerifying ? (
              <div className="flex items-center gap-2 text-muted-foreground py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Verifying…</span>
              </div>
            ) : (
              <BarcodeScannerInput
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScanSubmit}
                placeholder="Scan container barcode…"
                disabled={isVerifying}
                autoFocus
                mode="barcode"
                inputClassName="text-xl font-mono h-14"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Scan barcode, use camera, or press Enter
            </p>
          </div>
        )}

        {mode === "counting" && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Bag, seal, and count</strong> all gummies from this batch.
              Adjust count if needed.
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="outline"
                className="w-24 h-24 rounded-xs"
                onClick={() => setCount((c) => c + 1)}
              >
                <ChevronUp className="w-12 h-12" />
              </Button>
              <div className="text-6xl font-bold tabular-nums select-none">
                {count}
              </div>
              <Button
                variant="outline"
                className="w-24 h-24 rounded-xs"
                onClick={() => setCount((c) => Math.max(0, c - 1))}
              >
                <ChevronDown className="w-12 h-12" />
              </Button>
            </div>
            <div className="bg-muted/50 rounded-xs p-3 text-sm space-y-0.5">
              <p className="text-muted-foreground">Case Breakdown:</p>
              {fullCases > 0 && (
                <p>
                  — {fullCases} full case{fullCases !== 1 ? "s" : ""} of 100
                  units
                </p>
              )}
              {partialCase > 0 && (
                <p>— 1 partial case of {partialCase} units</p>
              )}
              <p className="font-medium mt-1">
                Total: {totalCases} case{totalCases !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              size="lg"
              disabled={isConfirming || count === 0}
              className="w-full text-xl h-14 gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
              onClick={handleConfirmCount}
            >
              {isConfirming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Confirm Count & Create Cases
            </Button>
          </div>
        )}

        {mode === "done" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 py-3 text-green-600">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <div>
                <p className="text-xl font-semibold">Packaging complete</p>
                {result && (
                  <p className="text-sm text-muted-foreground">
                    {result.cases.length} case
                    {result.cases.length !== 1 ? "s" : ""} created ·{" "}
                    {result.orderStatus.completedItems}/
                    {result.orderStatus.totalItems} items in order done
                  </p>
                )}
              </div>
            </div>
            {result && (
              <>
                <div
                  ref={printRef}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    top: 0,
                    visibility: "hidden",
                  }}
                >
                  {result.cases.map((c) => (
                    <PrintLabel key={c.caseId} type="case" data={c.labelData} />
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full text-xl h-14 rounded-xs"
                  onClick={printCaseLabels}
                >
                  Print Case Labels ({result.cases.length})
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
