"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronUp, ChevronDown, CheckCircle2, Package, Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "./CookItemHistory";
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
import type {
  ICookItem,
  IConfirmCountResponse,
} from "@/types/privateLabel/pps";
import PrintLabel from "./PrintLabel";

// ─── Types ────────────────────────────────────────────────────────────────────

// idle → scanning (scan container barcode) → counting → done
type ItemMode = "idle" | "scanning" | "counting" | "done";

// ─── Cook Item Card ────────────────────────────────────────────────────────────

interface CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  basePath: string;
}

function CookItemCard({ item, isAdmin, basePath }: CookItemCardProps) {
  const isAlreadyDone = item.status === "packaging_casing_complete";
  const [mode, setMode] = useState<ItemMode>(isAlreadyDone ? "done" : "idle");
  const [count, setCount] = useState(item.expectedCount ?? 0);
  const [result, setResult] = useState<IConfirmCountResponse | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const scannerDivId = `container-scanner-${item.cookItemId.replace(/[^a-z0-9]/gi, "-")}`;

  const [scanContainer] = useScanContainerMutation();
  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const expectedCount = item.expectedCount ?? 0;
  const moldsCount = Math.ceil(expectedCount / 70);
  const fullCases = Math.floor(count / 100);
  const partialCase = count % 100;
  const totalCases = fullCases + (partialCase > 0 ? 1 : 0);

  // Autofocus input when scan mode opens
  useEffect(() => {
    if (mode === "scanning" && !cameraOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode, cameraOpen]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* already stopped */ }
      scannerRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    const scanner = new Html5Qrcode(scannerDivId);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w: number, h: number) => ({ width: Math.floor(w * 0.9), height: Math.floor(h * 0.25) }) },
        async (decoded) => {
          await stopScanner();
          await handleScanSubmit(decoded.trim());
        },
        () => {},
      )
      .catch((err: unknown) => {
        setCameraError(err instanceof Error ? err.message : "Camera access denied");
        setCameraOpen(false);
        scannerRef.current = null;
      });
    return () => {
      if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

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
      // Wrong item scanned — cookItemId mismatch shows as "Cook item not found" or status error
      toast.error(msg.includes("demolding_complete")
        ? "Wrong container — this item isn't ready for packaging"
        : msg.includes("not found")
        ? "Barcode not recognised — scan the production label on the container"
        : msg);
      setMode("scanning");
      setTimeout(() => inputRef.current?.focus(), 50);
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
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-bold leading-tight truncate">{item.flavor}</p>
          <p className="text-base text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-sm px-3 py-1 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* ── Stats row ── */}
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
        {/* Flavor components */}
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

        {/* ── Idle ── */}
        {mode === "idle" && (
          <Button
            size="lg"
            className="w-full text-xl h-14 rounded-xs"
            onClick={() => setMode("scanning")}
          >
            Start Packaging
          </Button>
        )}

        {/* ── Scanning (container barcode verification) ── */}
        {mode === "scanning" && (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Scan the production label</strong> on the container to verify you have the right batch.
            </div>

            {cameraOpen && (
              <div className="relative w-full rounded-xs overflow-hidden border bg-black">
                <div id={scannerDivId} className="w-full" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-1 z-10 rounded-xs"
                  onClick={stopScanner}
                >
                  <X className="w-4 h-4" /> Close
                </Button>
                <p className="text-center text-xs text-white/70 pb-2">Point camera at container barcode</p>
              </div>
            )}

            {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}

            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scanValue.trim()) handleScanSubmit(scanValue);
                }}
                placeholder="Scan container barcode…"
                disabled={isVerifying || cameraOpen}
                className="text-xl font-mono h-14 flex-1 px-3 rounded-xs border bg-background disabled:opacity-50"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                className="h-14 px-4 shrink-0 rounded-xs"
                onClick={cameraOpen ? stopScanner : () => { setCameraError(null); setCameraOpen(true); }}
                disabled={isVerifying}
                title={cameraOpen ? "Close camera" : "Use camera to scan"}
              >
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : cameraOpen ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </Button>
            </div>
            {!cameraOpen && (
              <p className="text-xs text-muted-foreground">Press Enter, scan barcode, or tap camera</p>
            )}
          </div>
        )}

        {/* ── Counting ── */}
        {mode === "counting" && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Bag, seal, and count</strong> all gummies from this batch. Adjust count if needed.
            </div>

            {/* Touch counter */}
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="outline"
                className="w-24 h-24 rounded-xs"
                onClick={() => setCount((c) => c + 1)}
              >
                <ChevronUp className="w-12 h-12" />
              </Button>
              <div className="text-6xl font-bold tabular-nums select-none">{count}</div>
              <Button
                variant="outline"
                className="w-24 h-24 rounded-xs"
                onClick={() => setCount((c) => Math.max(0, c - 1))}
              >
                <ChevronDown className="w-12 h-12" />
              </Button>
            </div>

            {/* Case breakdown */}
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

        {/* ── Done ── */}
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
                {/* Hidden labels for print */}
                <div ref={printRef} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
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

// ─── Order Card (overview list) ───────────────────────────────────────────────

interface OrderCardProps {
  orderId: string;
  items: ICookItem[];
  basePath: string;
}

function OrderCard({ orderId, items, basePath }: OrderCardProps) {
  const router = useRouter();
  const storeName = items[0]?.storeName ?? orderId;
  const totalItems = items.length;

  return (
    <div
      className="rounded-xs border bg-card p-5 flex flex-col gap-3 cursor-pointer hover:bg-primary/40 transition-colors"
      onClick={() => router.push(`${basePath}/stage4/${encodeURIComponent(orderId)}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-bold truncate">{storeName}</p>
          <p className="text-sm font-mono text-muted-foreground mt-0.5">{orderId}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-sm">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
          return (
            <div key={item._id} className="flex items-center justify-between gap-2">
              <span className="text-base font-medium truncate">{item.flavor}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground">
                  {(item.expectedCount ?? 0).toLocaleString()} units
                </span>
                <Badge variant="outline" className={`text-xs ${statusColor}`}>
                  {COOK_ITEM_STATUS_LABELS[item.status] ?? item.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stage 4 View (order list) ────────────────────────────────────────────────

interface Stage4ViewProps {
  basePath?: string;
}

export default function Stage4View({ basePath = "/admin/pps" }: Stage4ViewProps) {
  const { data, isLoading, isError } = useGetStage4CookItemsQuery();
  const cookItems = data?.cookItems ?? [];

  // Group by orderId
  const orderMap = cookItems.reduce<Record<string, ICookItem[]>>((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push(item);
    return acc;
  }, {});
  const orderIds = Object.keys(orderMap);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load items. Check your connection and try again.
      </div>
    );
  }

  if (orderIds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Package className="w-10 h-10 opacity-40" />
        <p className="text-base">No items ready for packaging.</p>
        <p className="text-sm">Items appear here after Stage 3 (tray removal) is complete.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {orderIds.length} order{orderIds.length !== 1 ? "s" : ""} · {cookItems.length} item{cookItems.length !== 1 ? "s" : ""} ready to pack
      </p>
      {orderIds.map((orderId) => (
        <OrderCard
          key={orderId}
          orderId={orderId}
          items={orderMap[orderId]}
          basePath={basePath}
        />
      ))}
    </div>
  );
}

// ─── Re-export CookItemCard for order detail pages ────────────────────────────

export { CookItemCard };
