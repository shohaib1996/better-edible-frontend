"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronUp, ChevronDown, CheckCircle2, ScanLine } from "lucide-react";
import BarcodeScannerInput from "./BarcodeScannerInput";
import { toast } from "sonner";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "./CookItemHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetStage4CookItemsQuery,
  useScanContainerMutation,
  useConfirmCountMutation,
  useGetCaseByIdQuery,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type {
  ICookItem,
  ICase,
  IConfirmCountResponse,
} from "@/types/privateLabel/pps";
import PrintLabel from "./PrintLabel";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScannedItem = Partial<ICookItem> & { numberOfMolds: number };
type ViewMode = "idle" | "counting" | "done";

// ─── Case Lookup ──────────────────────────────────────────────────────────────

function CaseLookup() {
  const [open, setOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [lookedUpId, setLookedUpId] = useState<string | null>(null);

  const { data, isFetching, isError } = useGetCaseByIdQuery(lookedUpId!, {
    skip: !lookedUpId,
  });
  const caseData: ICase | null = data?.case ?? null;

  const handleLookup = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setScanValue("");
    // QR codes encode JSON { caseId, cookItemId } — try to parse, else use raw as caseId
    try {
      const parsed = JSON.parse(trimmed);
      setLookedUpId(parsed.caseId ?? trimmed);
    } catch {
      setLookedUpId(trimmed);
    }
  }, []);

  const handleReset = useCallback(() => {
    setLookedUpId(null);
    setScanValue("");
  }, []);

  return (
    <div className="rounded-xs border bg-card">
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-muted-foreground shrink-0" />
          <span className="text-lg font-semibold">Look up a case</span>
        </div>
        <span className="text-base text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t px-5 py-4 flex flex-col gap-3">
          {!caseData && (
            <>
              <BarcodeScannerInput
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleLookup}
                placeholder="Scan case QR or type Case ID…"
                disabled={isFetching}
                autoFocus
                mode="qr"
                inputClassName="text-base font-mono h-12"
              />
              {isError && lookedUpId && (
                <p className="text-sm text-destructive">Case not found — check the ID and try again.</p>
              )}
              <p className="text-xs text-muted-foreground">Scan the QR on a case label, or type the Case ID and press Enter</p>
            </>
          )}

          {isFetching && (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Looking up case…
            </div>
          )}

          {caseData && !isFetching && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold">{caseData.storeName}</p>
                <p className="text-xl font-medium text-muted-foreground">{caseData.flavor}</p>
              </div>
              <div className="grid grid-cols-2 gap-0 border rounded-xs divide-x">
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">Units</p>
                  <p className="text-3xl font-bold">{caseData.unitCount}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">Status</p>
                  <p className="text-3xl font-bold capitalize">{caseData.status.replace("-", " ")}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xs p-3 text-sm font-mono space-y-1 text-muted-foreground">
                <p>Case {caseData.caseNumber} of {caseData.totalCasesForItem}</p>
                <p>Case ID: {caseData.caseId}</p>
                <p>Cook Item: {caseData.cookItemId}</p>
                <p>Order: {caseData.orderId}</p>
                <p>Packed: {new Date(caseData.labelPrintTimestamp).toLocaleString()}</p>
              </div>
              <Button variant="outline" size="lg" className="rounded-xs text-lg h-14" onClick={handleReset}>
                <ScanLine className="w-5 h-5 mr-2" /> Scan another case
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stage 4 View — Scan-first workflow ───────────────────────────────────────

interface Stage4ViewProps {
  basePath?: string;
  compact?: boolean;
}

export default function Stage4View({ basePath = "/admin/pps", compact }: Stage4ViewProps) {
  const isAdmin = isAdminUser();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>("idle");
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<IConfirmCountResponse | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const [queueTab, setQueueTab] = useState<"ready" | "packed">("ready");

  const { data: queueData } = useGetStage4CookItemsQuery();
  const allQueueItems = queueData?.cookItems ?? [];
  const queueItems = allQueueItems.filter((i) => i.status === "bag_seal_complete");
  const packedItems = allQueueItems.filter((i) => i.status === "packaging_casing_complete");

  const [scanContainer] = useScanContainerMutation();
  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  // ── Scan handler ────────────────────────────────────────────────────────────

  const handleScanSubmit = useCallback(async (qrData: string) => {
    const trimmed = qrData.trim();
    if (!trimmed || isVerifying) return;
    setIsVerifying(true);
    setScanValue("");
    try {
      const res = await scanContainer({ qrCodeData: trimmed, performedBy: getPPSUser() } as any).unwrap();
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
          : msg
      );
    } finally {
      setIsVerifying(false);
    }
  }, [scanContainer, isVerifying]);

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

  // ── Print ────────────────────────────────────────────────────────────────────

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

  const statusColor = scannedItem?.status ? (COOK_ITEM_STATUS_COLORS[scannedItem.status] ?? "") : "";
  const statusLabel = scannedItem?.status ? (COOK_ITEM_STATUS_LABELS[scannedItem.status] ?? scannedItem.status) : "";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Scanner Section (always visible in idle mode) ── */}
      {viewMode === "idle" && (
        <div className="flex flex-col gap-3 rounded-xs border bg-card p-5">
          <div className="flex items-center gap-2 text-foreground">
            <ScanLine className="w-6 h-6 text-primary shrink-0" />
            <p className={`${compact ? "text-base" : "text-xl"} font-semibold`}>Scan a container to begin packaging</p>
          </div>

          <div className={`bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 ${compact ? "text-sm" : "text-base"} text-amber-800`}>
            <strong>Scan the barcode</strong> on the production label on the container, or type the barcode and press Enter.
          </div>

          {isVerifying
            ? <div className="flex items-center gap-2 text-muted-foreground py-2">
                <Loader2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} animate-spin`} />
                <span className={compact ? "text-sm" : "text-base"}>Verifying…</span>
              </div>
            : <BarcodeScannerInput
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScanSubmit}
                placeholder="Scan container barcode…"
                disabled={isVerifying}
                autoFocus
                mode="barcode"
                inputClassName={`${compact ? "text-base h-10" : "text-2xl h-16"} font-mono`}
              />
          }
          <p className="text-sm text-muted-foreground">Scan barcode, use camera, or press Enter</p>
        </div>
      )}

      {/* ── Case Lookup ── */}
      {viewMode === "idle" && <CaseLookup />}

      {/* ── Queue tabs: Ready to Pack / Packed ── */}
      {viewMode === "idle" && (
        <div className="flex flex-col gap-3">
          {/* Tab bar */}
          <div className="flex rounded-xs border overflow-hidden">
            <button
              className={`flex-1 px-4 py-2 ${compact ? "text-sm" : "text-base"} font-semibold transition-colors ${queueTab === "ready" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"}`}
              onClick={() => setQueueTab("ready")}
            >
              Ready to Pack{queueItems.length > 0 ? ` (${queueItems.length})` : ""}
            </button>
            <button
              className={`flex-1 px-4 py-2 ${compact ? "text-sm" : "text-base"} font-semibold transition-colors border-l ${queueTab === "packed" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"}`}
              onClick={() => setQueueTab("packed")}
            >
              Packed{packedItems.length > 0 ? ` (${packedItems.length})` : ""}
            </button>
          </div>

          {/* Ready to Pack list */}
          {queueTab === "ready" && (
            queueItems.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No items ready to pack.</p>
              : queueItems.map((item) => {
                  const sc = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
                  const sl = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
                  const ec = item.expectedCount ?? 0;
                  return (
                    <button
                      key={item._id}
                      className="rounded-xs border bg-card w-full text-left"
                      onClick={() => router.push(`${basePath}/stage4/item/${encodeURIComponent(item.cookItemId)}`)}
                    >
                      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                        <div className="min-w-0 flex-1">
                          <p className={`${compact ? "text-xl" : "text-3xl"} font-bold truncate`}>{item.flavor}</p>
                          <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-mono mt-0.5`}>{item.storeName}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 ${compact ? "text-sm" : "text-base"} px-3 py-1 ${sc}`}>{sl}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
                        <div className="px-3 py-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Qty</p>
                          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{ec.toLocaleString()}</p>
                        </div>
                        <div className="px-3 py-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Molds</p>
                          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{Math.ceil(ec / 70)}</p>
                        </div>
                        <div className="px-3 py-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Cases</p>
                          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{Math.floor(ec / 100) + (ec % 100 > 0 ? 1 : 0)}</p>
                        </div>
                      </div>
                      <div className="px-5 py-3">
                        <p className="text-sm font-mono text-muted-foreground">{item.cookItemId}</p>
                      </div>
                    </button>
                  );
                })
          )}

          {/* Packed list */}
          {queueTab === "packed" && (
            packedItems.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No packed items yet.</p>
              : packedItems.map((item) => {
                  const ec = item.expectedCount ?? 0;
                  return (
                    <button
                      key={item._id}
                      className="rounded-xs border bg-card w-full text-left"
                      onClick={() => router.push(`${basePath}/stage4/item/${encodeURIComponent(item.cookItemId)}`)}
                    >
                      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                        <div className="min-w-0 flex-1">
                          <p className={`${compact ? "text-xl" : "text-3xl"} font-bold truncate`}>{item.flavor}</p>
                          <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-mono mt-0.5`}>{item.storeName}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-sm px-3 py-1 text-green-700 border-green-300 bg-green-50">Packed</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
                        <div className="px-3 py-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Qty</p>
                          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{ec.toLocaleString()}</p>
                        </div>
                        <div className="px-3 py-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Cases</p>
                          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{item.totalCases ?? (Math.floor(ec / 100) + (ec % 100 > 0 ? 1 : 0))}</p>
                        </div>
                        <div className="px-3 py-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Actual</p>
                          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{item.actualCount ?? "—"}</p>
                        </div>
                      </div>
                      <div className="px-5 py-3">
                        <p className="text-sm font-mono text-muted-foreground">{item.cookItemId}</p>
                      </div>
                    </button>
                  );
                })
          )}
        </div>
      )}

      {/* ── Scanned Item Card ── */}
      {scannedItem && viewMode !== "idle" && (
        <div className="flex flex-col gap-0 rounded-xs border bg-card">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0 flex-1">
              <p className={`${compact ? "text-xl" : "text-3xl"} font-bold leading-tight truncate`}>{scannedItem.flavor}</p>
              <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-mono mt-1`}>{scannedItem.cookItemId}</p>
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
              <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{expectedCount.toLocaleString()}</p>
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
                <div className={`bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 ${compact ? "text-sm" : "text-base"} text-amber-800`}>
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
                  <div className={`${compact ? "text-5xl" : "text-7xl"} font-bold tabular-nums select-none`}>{count}</div>
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
                  {fullCases > 0 && <p>— {fullCases} full case{fullCases !== 1 ? "s" : ""} of 100 units</p>}
                  {partialCase > 0 && <p>— 1 partial case of {partialCase} units</p>}
                  <p className={`${compact ? "text-base" : "text-lg"} font-bold mt-1`}>Total: {totalCases} case{totalCases !== 1 ? "s" : ""}</p>
                </div>

                <Button
                  size="lg"
                  disabled={isConfirming || count === 0}
                  className={`w-full ${compact ? "text-base h-10" : "text-2xl h-16"} gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 font-bold`}
                  onClick={handleConfirmCount}
                >
                  {isConfirming ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
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
                    <p className={`${compact ? "text-base" : "text-2xl"} font-bold`}>Packaging complete</p>
                    {result && (
                      <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground`}>
                        {result.cases.length} case{result.cases.length !== 1 ? "s" : ""} created · {result.orderStatus.completedItems}/{result.orderStatus.totalItems} items in order done
                      </p>
                    )}
                  </div>
                </div>

                {result && (
                  <>
                    {/* Hidden labels for print */}
                    <div ref={printRef} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
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

// ─── CookItemCard — kept for order detail pages ────────────────────────────────

interface CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  basePath: string;
}

function CookItemCard({ item, isAdmin, basePath: _basePath }: CookItemCardProps) {
  const isAlreadyDone = item.status === "packaging_casing_complete";
  const [mode, setMode] = useState<"idle" | "scanning" | "counting" | "done">(isAlreadyDone ? "done" : "idle");
  const [count, setCount] = useState(item.expectedCount ?? 0);
  const [result, setResult] = useState<IConfirmCountResponse | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [scanContainer] = useScanContainerMutation();
  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const expectedCount = item.expectedCount ?? 0;
  const moldsCount = Math.ceil(expectedCount / 70);
  const fullCases = Math.floor(count / 100);
  const partialCase = count % 100;
  const totalCases = fullCases + (partialCase > 0 ? 1 : 0);

  const handleScanSubmit = useCallback(async (qrData: string) => {
    const trimmed = qrData.trim();
    if (!trimmed || isVerifying) return;
    setIsVerifying(true);
    setScanValue("");
    try {
      await scanContainer({ qrCodeData: trimmed, performedBy: getPPSUser() } as any).unwrap();
      setCount(expectedCount);
      setMode("counting");
    } catch (err: any) {
      const msg = err?.data?.message ?? "Scan failed";
      toast.error(msg.includes("demolding_complete")
        ? "Wrong container — this item isn't ready for packaging"
        : msg.includes("not found")
        ? "Barcode not recognised — scan the production label on the container"
        : msg);
    } finally {
      setIsVerifying(false);
    }
  }, [scanContainer, expectedCount, isVerifying]);

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

  return (
    <div className="flex flex-col gap-0 rounded-xs border bg-card">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-bold leading-tight truncate">{item.flavor}</p>
          <p className="text-base text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-sm px-3 py-1 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Qty</p>
          <p className="text-2xl font-bold">{expectedCount.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Molds</p>
          <p className="text-2xl font-bold">{moldsCount}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cases</p>
          <p className="text-2xl font-bold">
            {Math.floor(expectedCount / 100) + (expectedCount % 100 > 0 ? 1 : 0)}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {item.flavorComponents && item.flavorComponents.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">Flavor Components</p>
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
          <Button size="lg" className="w-full text-xl h-14 rounded-xs" onClick={() => setMode("scanning")}>
            Start Packaging
          </Button>
        )}

        {mode === "scanning" && (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Scan the production label</strong> on the container to verify you have the right batch.
            </div>
            {isVerifying
              ? <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Verifying…</span>
                </div>
              : <BarcodeScannerInput
                  value={scanValue}
                  onChange={setScanValue}
                  onSubmit={handleScanSubmit}
                  placeholder="Scan container barcode…"
                  disabled={isVerifying}
                  autoFocus
                  mode="barcode"
                  inputClassName="text-xl font-mono h-14"
                />
            }
            <p className="text-xs text-muted-foreground">Scan barcode, use camera, or press Enter</p>
          </div>
        )}

        {mode === "counting" && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Bag, seal, and count</strong> all gummies from this batch. Adjust count if needed.
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button variant="outline" className="w-24 h-24 rounded-xs" onClick={() => setCount((c) => c + 1)}>
                <ChevronUp className="w-12 h-12" />
              </Button>
              <div className="text-6xl font-bold tabular-nums select-none">{count}</div>
              <Button variant="outline" className="w-24 h-24 rounded-xs" onClick={() => setCount((c) => Math.max(0, c - 1))}>
                <ChevronDown className="w-12 h-12" />
              </Button>
            </div>
            <div className="bg-muted/50 rounded-xs p-3 text-sm space-y-0.5">
              <p className="text-muted-foreground">Case Breakdown:</p>
              {fullCases > 0 && <p>— {fullCases} full case{fullCases !== 1 ? "s" : ""} of 100 units</p>}
              {partialCase > 0 && <p>— 1 partial case of {partialCase} units</p>}
              <p className="font-medium mt-1">Total: {totalCases} case{totalCases !== 1 ? "s" : ""}</p>
            </div>
            <Button
              size="lg"
              disabled={isConfirming || count === 0}
              className="w-full text-xl h-14 gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
              onClick={handleConfirmCount}
            >
              {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
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
                <Button size="lg" className="w-full text-xl h-14 rounded-xs" onClick={printCaseLabels}>
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

export { CookItemCard };
