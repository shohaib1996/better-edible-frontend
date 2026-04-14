"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ChevronUp, ChevronDown, ScanLine, Tag } from "lucide-react";
import BarcodeScannerInput from "../shared/BarcodeScannerInput";
import { toast } from "sonner";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "../shared/CookItemHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetStage4CookItemsQuery,
  useScanContainerMutation,
  useConfirmCountMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem, IConfirmCountResponse } from "@/types/privateLabel/pps";
import PrintLabel from "../shared/PrintLabel";
import Stage4CaseLookup from "./Stage4CaseLookup";
import Stage4QueueList from "./Stage4QueueList";
import { usePrintCaseLabels } from "./usePrintCaseLabels";
import { CookItemCard } from "./Stage4CookItemCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScannedItem = Partial<ICookItem> & { numberOfMolds: number };
type ViewMode = "idle" | "counting" | "done";

// ─── Stage 4 View — Scan-first workflow ───────────────────────────────────────

interface Stage4ViewProps {
  basePath?: string;
  compact?: boolean;
}

export default function Stage4View({
  basePath = "/admin/pps",
  compact,
}: Stage4ViewProps) {
  const isAdmin = isAdminUser();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>("idle");
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<IConfirmCountResponse | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const { printRef, printCaseLabels } = usePrintCaseLabels();

  const { data: queueData } = useGetStage4CookItemsQuery();
  const allQueueItems = queueData?.cookItems ?? [];
  const queueItems = allQueueItems.filter((i) => i.status === "bag_seal_complete");
  const packedItems = allQueueItems.filter((i) => i.status === "packaging_casing_complete");

  const [scanContainer] = useScanContainerMutation();
  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  // ── Scan handler ────────────────────────────────────────────────────────────

  const handleScanSubmit = useCallback(
    async (qrData: string) => {
      const trimmed = qrData.trim();
      if (!trimmed || isVerifying) return;
      setIsVerifying(true);
      setScanValue("");
      try {
        const res = await scanContainer({
          qrCodeData: trimmed,
          performedBy: getPPSUser(),
        } as any).unwrap();
        setScannedItem(res.cookItem);
        setCount(res.cookItem.expectedCount ?? 0);
        setResult(null);
        setViewMode("counting");
      } catch (err: any) {
        const msg = err?.data?.message ?? "Scan failed";
        toast.error(
          msg.includes("bag_seal_complete")
            ? "Wrong container — this item isn't ready for packaging"
            : msg.includes("not found")
              ? "Barcode not recognised — scan the production label on the container"
              : msg,
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [scanContainer, isVerifying],
  );

  // ── Confirm count ────────────────────────────────────────────────────────────

  const handleConfirmCount = useCallback(async () => {
    if (!scannedItem?.cookItemId) return;
    try {
      const res = await confirmCount({
        cookItemId: scannedItem.cookItemId,
        actualCount: count,
        performedBy: getPPSUser(),
      } as any).unwrap();
      setResult(res);
      setViewMode("done");
      toast.success("Count confirmed — cases created");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to confirm count");
    }
  }, [confirmCount, scannedItem, count]);

  // ── Reset for next container ─────────────────────────────────────────────────

  const handleScanNext = useCallback(() => {
    setScannedItem(null);
    setCount(0);
    setResult(null);
    setScanValue("");
    setViewMode("idle");
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────────

  const expectedCount = scannedItem?.expectedCount ?? 0;
  const moldsCount = Math.ceil(expectedCount / 70);
  const fullCases = Math.floor(count / 100);
  const partialCase = count % 100;
  const totalCases = fullCases + (partialCase > 0 ? 1 : 0);

  const statusColor = scannedItem?.status
    ? (COOK_ITEM_STATUS_COLORS[scannedItem.status] ?? "")
    : "";
  const statusLabel = scannedItem?.status
    ? (COOK_ITEM_STATUS_LABELS[scannedItem.status] ?? scannedItem.status)
    : "";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* ── Scanner Section (always visible in idle mode) ── */}
      {viewMode === "idle" && (
        <div className="flex flex-col gap-3 rounded-xs border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <ScanLine className="w-6 h-6 text-primary shrink-0" />
              <p className={`${compact ? "text-base" : "text-xl"} font-semibold`}>
                Scan a container to begin packaging
              </p>
            </div>
            {!isAdmin && (
              <button
                onClick={() => router.push("/pps/package-prep")}
                className="flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold shrink-0"
              >
                <Tag className="w-4 h-4" />
                Package Prep
              </button>
            )}
          </div>

          <div
            className={`bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 ${compact ? "text-sm" : "text-base"} text-amber-800`}
          >
            <strong>Scan the barcode</strong> on the production label on the
            container, or type the barcode and press Enter.
          </div>

          {isVerifying ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} animate-spin`} />
              <span className={compact ? "text-sm" : "text-base"}>Verifying…</span>
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
              inputClassName={`${compact ? "text-base h-10" : "text-2xl h-16"} font-mono`}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Scan barcode, use camera, or press Enter
          </p>
        </div>
      )}

      {/* ── Case Lookup ── */}
      {viewMode === "idle" && <Stage4CaseLookup />}

      {/* ── Queue tabs: Ready to Pack / Packed ── */}
      {viewMode === "idle" && (
        <Stage4QueueList
          queueItems={queueItems}
          packedItems={packedItems}
          basePath={basePath}
          compact={compact}
        />
      )}

      {/* ── Scanned Item Card ── */}
      {scannedItem && viewMode !== "idle" && (
        <div className="flex flex-col gap-0 rounded-xs border bg-card">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0 flex-1">
              <p className={`${compact ? "text-xl" : "text-3xl"} font-bold leading-tight truncate`}>
                {scannedItem.flavor}
              </p>
              <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-mono mt-1`}>
                {scannedItem.cookItemId}
              </p>
            </div>
            {scannedItem.status && (
              <Badge variant="outline" className={`shrink-0 text-sm px-3 py-1 ${statusColor}`}>
                {statusLabel}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
            <div className="px-3 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Qty</p>
              <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>
                {expectedCount.toLocaleString()}
              </p>
            </div>
            <div className="px-3 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Molds</p>
              <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{moldsCount}</p>
            </div>
            <div className="px-3 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cases</p>
              <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>
                {Math.floor(expectedCount / 100) + (expectedCount % 100 > 0 ? 1 : 0)}
              </p>
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">
            {/* Flavor components */}
            {scannedItem.flavorComponents && scannedItem.flavorComponents.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1.5">Flavor Components</p>
                <div className="flex flex-wrap gap-1.5">
                  {scannedItem.flavorComponents.map((fc) => (
                    <Badge key={fc.name} variant="secondary" className="text-sm">
                      {fc.name} {fc.percentage}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ── Counting ── */}
            {viewMode === "counting" && (
              <div className="flex flex-col gap-4">
                <div
                  className={`bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 ${compact ? "text-sm" : "text-base"} text-amber-800`}
                >
                  <strong>Bag, seal, and count</strong> all gummies from this batch. Adjust count if needed.
                </div>

                {/* Touch counter */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant="outline"
                    className={`${compact ? "w-16 h-16" : "w-28 h-28"} rounded-xs`}
                    onClick={() => setCount((c) => c + 1)}
                  >
                    <ChevronUp className={`${compact ? "w-8 h-8" : "w-14 h-14"}`} />
                  </Button>
                  <div className={`${compact ? "text-5xl" : "text-7xl"} font-bold tabular-nums select-none`}>
                    {count}
                  </div>
                  <Button
                    variant="outline"
                    className={`${compact ? "w-16 h-16" : "w-28 h-28"} rounded-xs`}
                    onClick={() => setCount((c) => Math.max(0, c - 1))}
                  >
                    <ChevronDown className={`${compact ? "w-8 h-8" : "w-14 h-14"}`} />
                  </Button>
                </div>

                {/* Case breakdown */}
                <div className={`bg-muted/50 rounded-xs p-4 ${compact ? "text-sm" : "text-base"} space-y-1`}>
                  <p className="text-muted-foreground font-medium">Case Breakdown:</p>
                  {fullCases > 0 && (
                    <p>— {fullCases} full case{fullCases !== 1 ? "s" : ""} of 100 units</p>
                  )}
                  {partialCase > 0 && <p>— 1 partial case of {partialCase} units</p>}
                  <p className={`${compact ? "text-base" : "text-lg"} font-bold mt-1`}>
                    Total: {totalCases} case{totalCases !== 1 ? "s" : ""}
                  </p>
                </div>

                <Button
                  size="lg"
                  disabled={isConfirming || count === 0}
                  className={`w-full ${compact ? "text-base h-10" : "text-2xl h-16"} gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 font-bold`}
                  onClick={handleConfirmCount}
                >
                  {isConfirming ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                  Confirm Count & Create Cases
                </Button>
              </div>
            )}

            {/* ── Done ── */}
            {viewMode === "done" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 py-3 text-green-600">
                  <CheckCircle2 className={`${compact ? "w-6 h-6" : "w-10 h-10"} shrink-0`} />
                  <div>
                    <p className={`${compact ? "text-base" : "text-2xl"} font-bold`}>
                      Packaging complete
                    </p>
                    {result && (
                      <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground`}>
                        {result.cases.length} case{result.cases.length !== 1 ? "s" : ""} created ·{" "}
                        {result.orderStatus.completedItems}/{result.orderStatus.totalItems} items in order done
                      </p>
                    )}
                  </div>
                </div>

                {result && (
                  <>
                    {/* Hidden labels for print */}
                    <div
                      ref={printRef}
                      style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}
                    >
                      {result.cases.map((c) => (
                        <PrintLabel key={c.caseId} type="case" data={c.labelData} />
                      ))}
                    </div>
                    <Button
                      size="lg"
                      className={`w-full ${compact ? "text-base h-10" : "text-2xl h-16"} rounded-xs font-bold`}
                      onClick={printCaseLabels}
                    >
                      Print Case Labels ({result.cases.length})
                    </Button>
                  </>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  className={`w-full ${compact ? "text-base h-10" : "text-2xl h-16"} rounded-xs gap-3 font-bold`}
                  onClick={handleScanNext}
                >
                  <ScanLine className="w-6 h-6" />
                  Scan Next Container
                </Button>
              </div>
            )}
          </div>

          {/* History (admin only) */}
          {scannedItem.cookItemId && (
            <div className="px-5 pb-5">
              <CookItemHistory cookItemId={scannedItem.cookItemId} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { CookItemCard };
