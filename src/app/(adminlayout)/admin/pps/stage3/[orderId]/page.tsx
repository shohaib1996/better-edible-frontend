"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Thermometer,
  CheckCircle2,
  Loader2,
  Download,
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
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";
import Barcode from "react-barcode";
import {
  useGetStage3CookItemsQuery,
  useRemoveTrayMutation,
  useCompleteStage3Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
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
        setTimeLeft(
          `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
        );
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expectedEndTime]);

  return (
    <Badge
      variant="outline"
      className={
        isReady
          ? "bg-green-500/10 text-green-600 border-green-500/20"
          : "bg-orange-500/10 text-orange-600 border-orange-500/20"
      }
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
  slotId: _slotId,
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

  const handleSubmit = useCallback(
    async (scanned: string) => {
      const trimmed = scanned.trim();
      if (!trimmed) return;
      setValue("");
      const ok = await onSubmit(trimmed);
      if (ok) {
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
      }
    },
    [onSubmit],
  );

  if (isRemoved) {
    return (
      <div className="flex items-center gap-3 px-4 py-4 rounded-xs bg-green-50 border border-green-200">
        <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            Tray {index + 1} of {total}
          </p>
          <p className="text-xl font-mono font-semibold text-green-700 truncate">
            {trayId}
          </p>
          <p className="text-xs text-muted-foreground">
            {unitId} · Shelf {shelfPosition}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xs border p-4 transition-colors ${
        flash
          ? "bg-green-100 border-green-400"
          : isActive
            ? "border-primary bg-primary/5"
            : "border-muted bg-muted/30 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Tray {index + 1} of {total}
        </p>
        <span className="text-xs font-mono text-muted-foreground">
          {unitId} · Shelf {shelfPosition}
        </span>
      </div>
      <p className="text-xl font-mono font-semibold">{trayId}</p>
      {/* key={focusKey} on call site forces remount → autoFocus fires on next slot */}
      <BarcodeScannerInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={isActive ? "Scan tray QR code…" : "Waiting…"}
        disabled={!isActive || isProcessing}
        mode="qr"
        inputClassName="text-xl font-mono h-14"
        showManualActions={isActive}
        autoFocus={isActive}
      />
      {isActive && (
        <p className="text-xs text-muted-foreground">
          Scan barcode, use camera, or press Enter
        </p>
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
  const removedTrayIds = new Set(
    item.trayRemovalTimestamps.map((t) => t.trayId),
  );
  const traySlots = item.molds; // IStage3MoldInfo[]
  const totalTrays = traySlots.length;
  const removedCount = traySlots.filter((m) =>
    removedTrayIds.has(m.trayId),
  ).length;
  const allRemoved = removedCount >= totalTrays && totalTrays > 0;

  const initialMode: CardMode = isComplete
    ? "done"
    : removedCount > 0
      ? "removing"
      : "waiting";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [removeTray, { isLoading: isRemoving }] = useRemoveTrayMutation();
  const [completeStage3, { isLoading: isCompleting }] =
    useCompleteStage3Mutation();

  const activeSlotIndex = traySlots.findIndex(
    (m) => !removedTrayIds.has(m.trayId),
  );

  const handleRemoveTray = useCallback(
    async (trayId: string): Promise<boolean> => {
      try {
        await removeTray({
          cookItemId: item.cookItemId,
          trayId,
          performedBy: getPPSUser(),
        } as any).unwrap();
        return true;
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to log tray removal");
        return false;
      }
    },
    [removeTray, item.cookItemId],
  );

  const handleCompleteStage3 = async () => {
    try {
      const result = await completeStage3({
        cookItemId: item.cookItemId,
        performedBy: getPPSUser(),
      } as any).unwrap();
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
      {/* ── Header ── */}
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

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Qty
          </p>
          <p className="text-2xl font-bold">{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Trays
          </p>
          <p className="text-2xl font-bold">{totalTrays}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Removed
          </p>
          <p
            className={`text-2xl font-bold ${allRemoved ? "text-green-600" : ""}`}
          >
            {removedCount}/{totalTrays}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Flavor / color components */}
        {item.flavorComponents.length > 0 && (
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

        {mode === "done" || isComplete ? (
          <div className="flex items-center gap-3 py-4 text-green-600">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <p className="text-xl font-semibold">
              All trays removed — {removedCount} tray
              {removedCount !== 1 ? "s" : ""}
            </p>
          </div>
        ) : mode === "waiting" ? (
          <>
            {/* Dehydration timers */}
            <div className="flex flex-col gap-1">
              {traySlots.map((mold) => (
                <div
                  key={mold.moldId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-base font-mono">
                    {mold.trayId} — {mold.dehydratorUnitId}, Shelf{" "}
                    {mold.shelfPosition}
                  </span>
                  <DehydrationTimer expectedEndTime={mold.dehydrationEndTime} />
                </div>
              ))}
            </div>
            {item.allMoldsReady && (
              <Button
                size="lg"
                className="w-full text-xl h-14 rounded-xs"
                onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setMode("removing"); }}
              >
                Start Removal & Packing
              </Button>
            )}
          </>
        ) : mode === "removing" ? (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
              <strong>Remove each tray</strong> from the dehydrator and scan its
              QR code to log removal.
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
              className="w-full text-xl h-14 gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
              onClick={handleCompleteStage3}
            >
              {isCompleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
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

export default function Stage3OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const printLabelRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  const allComplete =
    orderItems.length > 0 &&
    orderItems.every((i) => i.status === "demolding_complete");

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
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  }, []);

  const downloadBarcode = (cookItemId: string) => {
    const svgEl = barcodeRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `barcode-${cookItemId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  };

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
        Failed to load cook items. Check your connection and try again.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/pps")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Thermometer className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 3 — Tray Removal"}
            </h1>
            <p className="text-base text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Thermometer className="w-10 h-10 opacity-40" />
          <p className="text-base">
            No Stage 3 items found for order {decodedOrderId}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {allComplete && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <p className="text-xl font-semibold">
                All items complete — ready for packaging
              </p>
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

      {/* Hidden barcode for download */}
      {labelData && (
        <div
          ref={barcodeRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            visibility: "hidden",
          }}
        >
          <Barcode
            value={labelData.cookItemId}
            format="CODE128"
            width={3}
            height={100}
            displayValue={true}
            fontSize={14}
            margin={10}
            background="#ffffff"
            lineColor="#000000"
          />
        </div>
      )}

      {/* Hidden label for print */}
      {labelData && (
        <div
          ref={printLabelRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            visibility: "hidden",
          }}
        >
          <PrintLabel type="production" data={labelData} />
        </div>
      )}

      {/* Label preview dialog */}
      {labelData && (
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-lg rounded-xs">
            <DialogHeader>
              <DialogTitle>Production Label</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <PrintLabel type="production" data={labelData} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xs" onClick={printLabel}>
                Print Label
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xs"
                onClick={() => downloadBarcode(labelData.cookItemId)}
              >
                <Download className="w-4 h-4" />
                Download Barcode
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
