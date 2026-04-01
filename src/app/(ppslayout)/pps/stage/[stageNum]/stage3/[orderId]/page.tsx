"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Thermometer,
  CheckCircle2,
  Loader2,
  LogOut,
  Camera,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
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
  useRemoveTrayMutation,
  useCompleteStage3Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { COOK_ITEM_STATUS_COLORS, COOK_ITEM_STATUS_LABELS } from "@/constants/privateLabel";
import type { IStage3CookItem, ICookItem } from "@/types/privateLabel/pps";

// ─── Live countdown timer ─────────────────────────────────────────────────────

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
    <Badge
      variant="outline"
      className={`text-base px-3 py-1 font-mono tabular-nums ${
        isReady
          ? "bg-green-500/10 text-green-700 border-green-500/20 font-bold"
          : "bg-orange-500/10 text-orange-700 border-orange-500/20"
      }`}
    >
      {timeLeft || "…"}
    </Badge>
  );
}

// ─── Tray Removal Slot ────────────────────────────────────────────────────────

interface TraySlotProps {
  slotId: string;
  index: number;
  total: number;
  trayId: string;
  unitId: string;
  shelfPosition: number;
  isActive: boolean;
  isRemoved: boolean;
  isProcessing: boolean;
  onSubmit: (trayId: string) => Promise<boolean>;
  /** Changes when active slot advances — forces remount so autoFocus fires */
  focusKey?: number;
}

function TraySlot({
  slotId,
  index,
  total,
  trayId,
  unitId,
  shelfPosition,
  isActive,
  isRemoved,
  isProcessing,
  onSubmit,
}: TraySlotProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = `tray-remove-scanner-${slotId}`;

  // Focus on mount (triggered by key remount when active slot changes)
  useEffect(() => {
    if (!isActive || isRemoved || cameraOpen) return;
    inputRef.current?.focus();
    const t1 = setTimeout(() => inputRef.current?.focus(), 100);
    const t2 = setTimeout(() => inputRef.current?.focus(), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* already stopped */ }
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
        {
          fps: 10,
          qrbox: (w: number, h: number) => ({ width: Math.floor(w * 0.9), height: Math.floor(h * 0.25) }),
        },
        async (decodedText) => {
          await stopScanner();
          const ok = await onSubmit(decodedText.trim());
          if (ok) {
            setFlash(true);
            setTimeout(() => setFlash(false), 700);
          }
        },
        () => {},
      )
      .catch((err: unknown) => {
        setCameraError(err instanceof Error ? err.message : "Camera access denied");
        setCameraOpen(false);
        scannerRef.current = null;
      });
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      const trimmed = value.trim();
      setValue("");
      onSubmit(trimmed).then((ok) => {
        if (ok) {
          setFlash(true);
          setTimeout(() => setFlash(false), 700);
        }
      });
    }
  };

  if (isRemoved) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-xs bg-green-50 border border-green-200">
        <CheckCircle2 className="w-9 h-9 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-base text-muted-foreground font-medium">Tray {index + 1} of {total}</p>
          <p className="text-2xl font-mono font-bold text-green-700 truncate">{trayId}</p>
          <p className="text-sm text-muted-foreground">{unitId} · Shelf {shelfPosition}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 rounded-xs border p-4 transition-colors ${
      flash
        ? "bg-green-100 border-green-400"
        : isActive
        ? "border-primary bg-primary/5"
        : "border-muted bg-muted/30 opacity-60"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground">Tray {index + 1} of {total}</p>
        <span className="text-base font-mono text-muted-foreground">{unitId} · Shelf {shelfPosition}</span>
      </div>
      <p className="text-2xl font-mono font-bold">{trayId}</p>

      {cameraOpen && (
        <div className="relative w-full rounded-xs overflow-hidden border bg-black">
          <div id={scannerDivId} className="w-full" />
          <Button size="sm" variant="secondary" className="absolute top-2 right-2 gap-1 z-10 rounded-xs" onClick={stopScanner}>
            <X className="w-4 h-4" /> Close
          </Button>
          <p className="text-center text-sm text-white/70 pb-2">Point camera at tray QR code</p>
        </div>
      )}

      {cameraError && <p className="text-base text-destructive">{cameraError}</p>}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isActive ? "Scan tray QR code…" : "Waiting…"}
          disabled={!isActive || isProcessing || cameraOpen}
          className="text-2xl font-mono h-16 flex-1 px-3 rounded-xs border bg-background disabled:opacity-50"
          autoComplete="off"
          autoFocus={isActive}
        />
        <Button
          type="button"
          variant="outline"
          className="h-16 w-16 shrink-0 rounded-xs"
          onClick={cameraOpen ? stopScanner : () => { setCameraError(null); setCameraOpen(true); }}
          disabled={!isActive || isProcessing}
          title={cameraOpen ? "Close camera" : "Use camera to scan"}
        >
          {cameraOpen ? <X className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
        </Button>
      </div>

      {isActive && !cameraOpen && (
        <>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="flex-1 gap-1.5 rounded-xs"
              onClick={() => {
                const trimmed = value.trim();
                if (!trimmed) return;
                setValue("");
                onSubmit(trimmed).then((ok) => {
                  if (ok) { setFlash(true); setTimeout(() => setFlash(false), 700); }
                });
              }}
              disabled={!value.trim() || isProcessing}
            >
              <CheckCircle2 className="w-4 h-4" />
              Submit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xs"
              onClick={() => { setValue(""); inputRef.current?.focus(); }}
              disabled={!value.trim()}
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Press Enter, scan QR, or tap camera</p>
        </>
      )}
    </div>
  );
}

// ─── Cook Item Card ────────────────────────────────────────────────────────────

type CardMode = "waiting" | "removing" | "done";

interface CookItemCardProps {
  item: IStage3CookItem;
  isAdmin: boolean;
  onComplete: (cookItem: ICookItem) => void;
}

function CookItemCard({ item, isAdmin, onComplete }: CookItemCardProps) {
  const isComplete = item.status === "demolding_complete";
  const removedTrayIds = new Set(item.trayRemovalTimestamps.map((t) => t.trayId));
  const traySlots = item.molds;
  const totalTrays = traySlots.length;
  const removedCount = traySlots.filter((m) => removedTrayIds.has(m.trayId)).length;
  const allRemoved = removedCount >= totalTrays && totalTrays > 0;

  const initialMode: CardMode = isComplete ? "done"
    : removedCount > 0 ? "removing"
    : "waiting";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [removeTray, { isLoading: isRemoving }] = useRemoveTrayMutation();
  const [completeStage3, { isLoading: isCompleting }] = useCompleteStage3Mutation();

  const activeSlotIndex = traySlots.findIndex((m) => !removedTrayIds.has(m.trayId));

  const handleRemoveTray = useCallback(async (scannedId: string): Promise<boolean> => {
    try {
      await removeTray({ cookItemId: item.cookItemId, trayId: scannedId, performedBy: getPPSUser() } as any).unwrap();
      return true;
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to log tray removal");
      return false;
    }
  }, [removeTray, item.cookItemId]);

  const handleCompleteStage3 = async () => {
    try {
      const result = await completeStage3({ cookItemId: item.cookItemId, performedBy: getPPSUser() } as any).unwrap();
      toast.success("Stage 3 complete");
      setMode("done");
      onComplete(result.cookItem);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 3");
    }
  };

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  return (
    <div className="flex flex-col gap-0 rounded-xs border bg-card">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-4xl font-bold leading-tight truncate">{item.flavor}</p>
          <p className="text-base text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-base px-3 py-1.5 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Qty</p>
          <p className="text-3xl font-bold">{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Trays</p>
          <p className="text-3xl font-bold">{totalTrays}</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Removed</p>
          <p className={`text-3xl font-bold ${allRemoved ? "text-green-600" : ""}`}>
            {removedCount}/{totalTrays}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {item.flavorComponents.length > 0 && (
          <div>
            <p className="text-base text-muted-foreground mb-2">Flavor Components</p>
            <div className="flex flex-wrap gap-2">
              {item.flavorComponents.map((fc) => (
                <Badge key={fc.name} variant="secondary" className="text-base px-3 py-1">
                  {fc.name} {fc.percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {mode === "done" || isComplete ? (
          <div className="flex items-center gap-4 py-4 text-green-600">
            <CheckCircle2 className="w-10 h-10 shrink-0" />
            <p className="text-2xl font-bold">All trays removed — {removedCount} tray{removedCount !== 1 ? "s" : ""}</p>
          </div>
        ) : mode === "waiting" ? (
          <>
            <div className="flex flex-col gap-0 rounded-xs border divide-y">
              {traySlots.map((mold) => (
                <div key={mold.moldId} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-mono font-semibold truncate">{mold.trayId}</p>
                    <p className="text-sm text-muted-foreground">{mold.dehydratorUnitId} · Shelf {mold.shelfPosition}</p>
                  </div>
                  <DehydrationTimer expectedEndTime={mold.dehydrationEndTime} />
                </div>
              ))}
            </div>
            {item.allMoldsReady && (
              <Button
                size="lg"
                className="w-full text-2xl h-16 rounded-xs font-bold"
                onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setMode("removing"); }}
              >
                Start Removal & Packing
              </Button>
            )}
          </>
        ) : mode === "removing" ? (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-base text-amber-800">
              <strong>Remove each tray</strong> from the dehydrator and scan its QR code to log removal.
            </div>
            {traySlots.map((mold, i) => (
              <TraySlot
                key={i === activeSlotIndex ? `active-${removedCount}` : mold.trayId}
                slotId={`${item.cookItemId}-${i}`}
                index={i}
                total={totalTrays}
                trayId={mold.trayId}
                unitId={mold.dehydratorUnitId}
                shelfPosition={mold.shelfPosition}
                isActive={i === activeSlotIndex}
                isRemoved={removedTrayIds.has(mold.trayId)}
                isProcessing={isRemoving}
                onSubmit={handleRemoveTray}
                focusKey={i === activeSlotIndex ? removedCount : -i}
              />
            ))}
            <Button
              size="lg"
              disabled={!allRemoved || isCompleting}
              className="w-full text-2xl h-16 gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 font-bold"
              onClick={handleCompleteStage3}
            >
              {isCompleting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
              Print Label & Complete
            </Button>
          </div>
        ) : null}
      </div>

      <div className="px-5 pb-5">
        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function LockedStage3OrderPage({
  params,
}: {
  params: Promise<{ stageNum: string; orderId: string }>;
}) {
  const { stageNum, orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const printLabelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("better-user");
    router.push(`/pps/stage/${stageNum}`);
  }, [router, stageNum]);

  const allComplete = orderItems.length > 0 && orderItems.every(
    (i) => i.status === "demolding_complete"
  );

  const handleComplete = (cookItem: ICookItem) => {
    setLabelData(cookItem);
    setShowLabelPreview(true);
  };

  const printLabel = useCallback(() => {
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
  }, []);

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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/pps/stage/${stageNum}`)} className="shrink-0 w-12 h-12">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Thermometer className="w-10 h-10 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 3 — Tray Removal"}
            </h1>
            <p className="text-lg text-muted-foreground font-mono">Order {decodedOrderId}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="shrink-0 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 px-3"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-lg font-semibold">Logout</span>
        </Button>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
          <Thermometer className="w-14 h-14 opacity-40" />
          <p className="text-xl">No Stage 3 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {allComplete && (
            <div className="flex items-center gap-4 px-5 py-5 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-9 h-9 shrink-0" />
              <p className="text-2xl font-bold">All items complete — ready for packaging</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <CookItemCard
                key={item._id}
                item={item}
                isAdmin={isAdmin}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {labelData && (
        <div ref={printLabelRef} style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
          <PrintLabel type="production" data={labelData} />
        </div>
      )}

      {labelData && (
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-lg rounded-xs">
            <DialogHeader>
              <DialogTitle className="text-2xl">Production Label</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <PrintLabel type="production" data={labelData} />
            </div>
            <Button className="w-full rounded-xs text-xl h-14" onClick={printLabel}>
              Print Label
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
