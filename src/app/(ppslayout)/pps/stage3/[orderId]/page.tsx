"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  PackageCheck,
  CheckCircle2,
  Loader2,
  ScanLine,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import PrintLabel from "@/components/PPS/PrintLabel";
import {
  useGetStage3CookItemsQuery,
  useStartBaggingMutation,
  useStartSealingMutation,
  useCompleteBagSealMutation,
  useCompleteStage3Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { COOK_ITEM_STATUS_COLORS, COOK_ITEM_STATUS_LABELS } from "@/constants/privateLabel";
import type { IStage3CookItem, ICookItem } from "@/types/privateLabel/pps";

// ─── Dehydration Timer ───────────────────────────────────────────────────────

function DehydrationTimer({ expectedEndTime }: { expectedEndTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expectedEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setTimeLeft("READY");
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expectedEndTime]);

  return (
    <Badge variant="outline" className={`text-base font-mono tabular-nums ${isReady ? "bg-green-500/10 text-green-700 border-green-500/20 font-bold" : "bg-orange-500/10 text-orange-700 border-orange-500/20"}`}>
      {timeLeft || "…"}
    </Badge>
  );
}

// ─── Cook Item Card ────────────────────────────────────────────────────────────

interface CookItemCardProps {
  item: IStage3CookItem;
  isAdmin: boolean;
}

function CookItemCard({ item, isAdmin }: CookItemCardProps) {
  const [completeBagSeal, { isLoading: isCompleting }] = useCompleteBagSealMutation();
  const [completeStage3, { isLoading: isCompletingTrayRemoval }] = useCompleteStage3Mutation();

  const handleFinish = async () => {
    try {
      await completeBagSeal({ cookItemId: item.cookItemId, performedBy: getPPSUser() }).unwrap();
      toast.success("Item sealed — ready for packaging");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete bag & seal");
    }
  };

  const handleTrayRemoval = async () => {
    try {
      await completeStage3({ cookItemId: item.cookItemId, performedBy: getPPSUser() } as any).unwrap();
      toast.success("Tray removal complete — scan the barcode to start bagging");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete tray removal");
    }
  };

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  const isDone = item.status === "bag_seal_complete";
  const isSealing = item.status === "sealing";
  const isBagging = item.status === "bagging";
  const isDemolded = item.status === "demolding_complete";
  const isDehydrating = item.status === "dehydrating_complete";
  const allMoldsReady = isDehydrating && item.molds?.every((m) => m.isReady);

  return (
    <div className={`flex flex-col gap-0 rounded-xs border bg-card ${isDone ? "opacity-75" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-4xl font-bold leading-tight truncate">{item.flavor}</p>
          <p className="text-base text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
          </div>
        <Badge variant="outline" className={`shrink-0 text-base px-3 py-1.5 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Qty</p>
          <p className="text-3xl font-bold">{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Molds</p>
          <p className="text-3xl font-bold">{item.assignedMoldIds.length}</p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {isDehydrating && item.molds?.length > 0 && (
          <div className="flex flex-col gap-2">
            {item.molds.map((mold, idx) => {
              const unitsThisMold = Math.min(70, item.quantity - idx * 70);
              return (
                <div key={mold.moldId} className={`flex items-center gap-3 px-3 py-3 rounded-xs border ${mold.isReady ? "bg-green-500/5 border-green-200" : "bg-muted/30"}`}>
                  <div className="shrink-0 w-10 h-10 rounded-xs border flex items-center justify-center font-bold text-lg bg-background">
                    {mold.shelfPosition}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold">Shelf {mold.shelfPosition} · {mold.dehydratorUnitId}</p>
                    <p className="text-sm text-muted-foreground font-mono">{mold.trayId} · {unitsThisMold} units</p>
                  </div>
                  <DehydrationTimer expectedEndTime={mold.dehydrationEndTime} />
                </div>
              );
            })}
            {allMoldsReady ? (
              <Button
                size="lg"
                disabled={isCompletingTrayRemoval}
                className="w-full text-2xl h-16 gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={handleTrayRemoval}
              >
                {isCompletingTrayRemoval ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                Complete Tray Removal
              </Button>
            ) : (
              <p className="text-base text-muted-foreground text-center py-1">Waiting for dehydration to finish…</p>
            )}
          </div>
        )}

        {isDone ? (
          <div className="flex items-center gap-4 py-4 px-3 rounded-xs bg-green-50 border border-green-200 text-green-700">
            <CheckCircle2 className="w-10 h-10 shrink-0" />
            <p className="text-2xl font-bold">Sealed — ready for packaging</p>
          </div>
        ) : isDemolded ? (
          <div className="flex items-center gap-4 py-4 px-3 rounded-xs bg-orange-50 border border-orange-200 text-orange-700">
            <ScanLine className="w-10 h-10 shrink-0" />
            <p className="text-xl font-semibold">Scan barcode to start bagging</p>
          </div>
        ) : isBagging ? (
          <div className="flex items-center gap-4 py-4 px-3 rounded-xs bg-amber-50 border border-amber-200 text-amber-700">
            <ScanLine className="w-10 h-10 shrink-0" />
            <p className="text-xl font-semibold">Scan again to seal (label will print)</p>
          </div>
        ) : isSealing ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 py-4 px-3 rounded-xs bg-indigo-50 border border-indigo-200 text-indigo-700">
              <CheckCircle2 className="w-10 h-10 shrink-0" />
              <p className="text-xl font-semibold">Label printed — sealing in progress</p>
            </div>
            <Button
              size="lg"
              disabled={isCompleting}
              className="w-full text-2xl h-16 gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={handleFinish}
            >
              {isCompleting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              Finish Item
            </Button>
          </div>
        ) : null}

        {isAdmin && (
          <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function WorkerStage3OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const printLabelRef = useRef<HTMLDivElement>(null);
  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, []);

  const startCamera = useCallback(() => {
    setCameraError(null);
    setCameraOpen(true);
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    const scanner = new Html5Qrcode("stage3-worker-scanner");
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: (w: number, h: number) => ({
          width: Math.min(Math.floor(w * 0.9), 600),
          height: Math.min(Math.floor(h * 0.25), 120),
        }),
      },
      (decoded) => {
        stopCamera().then(() => handleScan(decoded));
      },
      () => {},
    ).catch((err: unknown) => {
      setCameraError(err instanceof Error ? err.message : "Camera access denied");
      setCameraOpen(false);
      scannerRef.current = null;
    });
    return () => {
      if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const [startBagging] = useStartBaggingMutation();
  const [startSealing] = useStartSealingMutation();

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;
  const allComplete = orderItems.length > 0 && orderItems.every((i) => i.status === "bag_seal_complete");

  const printLabel = useCallback((cookItem: ICookItem) => {
    setLabelData(cookItem);
    setTimeout(() => {
      const labelEl = printLabelRef.current;
      if (!labelEl) return;
      const labelHtml = labelEl.innerHTML;
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
<body>${labelHtml}</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    }, 100);
  }, []);

  const handleScan = useCallback(async (scannedValue: string) => {
    const cookItemId = scannedValue.trim();
    if (!cookItemId) return;

    const item = orderItems.find((i) => i.cookItemId === cookItemId);
    if (!item) {
      toast.error(`Item "${cookItemId}" not found in this order`);
      return;
    }

    const performedBy = getPPSUser();

    if (item.status === "demolding_complete") {
      try {
        await startBagging({ cookItemId, performedBy }).unwrap();
        toast.success(`${item.flavor} — bagging started`);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to start bagging");
      }
    } else if (item.status === "bagging") {
      try {
        const result = await startSealing({ cookItemId, performedBy }).unwrap();
        toast.success(`${item.flavor} — sealing started, printing label`);
        printLabel(result.cookItem);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to start sealing");
      }
    } else if (item.status === "sealing") {
      toast.info(`${item.flavor} is sealing — use the Finish button on the card`);
    } else if (item.status === "bag_seal_complete") {
      toast.info(`${item.flavor} is already complete`);
    } else {
      toast.error(`${item.flavor} status is "${item.status}" — not ready for bag & seal`);
    }

    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, [orderItems, startBagging, startSealing, printLabel]);

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan(scanBuffer);
      setScanBuffer("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xl">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-lg">
        Failed to load cook items. Check your connection and try again.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background flex-1 overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pps")} className="shrink-0 w-12 h-12">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <PackageCheck className="w-10 h-10 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 3 — Bag & Seal"}
            </h1>
            <p className="text-lg text-muted-foreground font-mono">Order {decodedOrderId}</p>
          </div>
        </div>
      </div>

      {/* Scanner input */}
      <div className="mb-6 rounded-xs border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ScanLine className="w-5 h-5 text-primary" />
          Scan container barcode
        </div>
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-base text-amber-800">
          Scan once → start bagging · Scan again → start sealing & print label
        </div>
        {cameraOpen && (
          <div className="relative w-full rounded-xs overflow-hidden border bg-black">
            <div id="stage3-worker-scanner" className="w-full" />
            <Button type="button" size="sm" variant="secondary" className="absolute top-2 right-2 gap-1 z-10 rounded-xs" onClick={stopCamera}>
              <X className="w-4 h-4" /> Close
            </Button>
            <p className="text-center text-xs text-white/70 pb-2">Point camera at barcode</p>
          </div>
        )}
        {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
        <div className="flex gap-2">
          <input
            ref={scanInputRef}
            autoFocus
            type="text"
            value={scanBuffer}
            onChange={(e) => setScanBuffer(e.target.value)}
            onKeyDown={handleScanInput}
            placeholder="Scan or type cook item ID…"
            disabled={cameraOpen}
            className="flex-1 rounded-xs border bg-background px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button type="button" variant="outline" className="h-auto px-4 rounded-xs shrink-0" onClick={cameraOpen ? stopCamera : startCamera}>
            {cameraOpen ? <X className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
          <PackageCheck className="w-14 h-14 opacity-40" />
          <p className="text-xl">No bag & seal items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {allComplete && (
            <div className="flex items-center gap-4 px-5 py-5 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-9 h-9 shrink-0" />
              <p className="text-2xl font-bold">All items sealed — ready for packaging</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <CookItemCard key={item._id} item={item} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      {/* Hidden label for print */}
      {labelData && (
        <div ref={printLabelRef} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
          <PrintLabel type="production" data={labelData} />
        </div>
      )}

      {/* Label preview dialog */}
      {labelData && (
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-lg rounded-xs">
            <DialogHeader>
              <DialogTitle className="text-2xl">Production Label</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <PrintLabel type="production" data={labelData} />
            </div>
            <Button
              className="w-full rounded-xs text-xl h-14"
              onClick={() => printLabel(labelData)}
            >
              Print Label
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
