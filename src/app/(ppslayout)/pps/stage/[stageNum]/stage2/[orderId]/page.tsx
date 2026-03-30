"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wind,
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
import { Input } from "@/components/ui/input";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import {
  useGetStage2CookItemsQuery,
  useProcessMoldMutation,
  ppsApi,
} from "@/redux/api/PrivateLabel/ppsApi";
import { useAppDispatch } from "@/redux/hooks/hooks";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Tray Slot ────────────────────────────────────────────────────────────────

interface TraySlotProps {
  slotId: string;
  index: number;
  total: number;
  moldId: string;
  isActive: boolean;
  lockedTrayId?: string;
  lockedUnit?: string;
  lockedShelf?: number;
  isProcessing: boolean;
  onSubmit: (trayId: string) => Promise<boolean>;
}

function TraySlot({
  slotId,
  index,
  total,
  moldId,
  isActive,
  lockedTrayId,
  lockedUnit,
  lockedShelf,
  isProcessing,
  onSubmit,
}: TraySlotProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = `tray-scanner-${slotId}`;

  useEffect(() => {
    if (isActive && !lockedTrayId && !cameraOpen) {
      inputRef.current?.focus();
    }
  }, [isActive, lockedTrayId, cameraOpen]);

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

  const startScanner = useCallback(() => {
    setCameraError(null);
    setCameraOpen(true);
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

  const handleSubmit = useCallback(async (trayId: string) => {
    const trimmed = trayId.trim();
    if (!trimmed || isProcessing) return;
    const ok = await onSubmit(trimmed);
    if (ok) {
      setValue("");
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }
  }, [isProcessing, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) handleSubmit(value);
  };

  if (lockedTrayId) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-xs bg-green-50 border border-green-200">
        <CheckCircle2 className="w-9 h-9 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-base text-muted-foreground font-medium">
            Tray {index + 1} of {total} · Mold <span className="font-mono">{moldId}</span>
          </p>
          <p className="text-2xl font-mono font-bold text-green-700 truncate">{lockedTrayId}</p>
          {lockedUnit && (
            <p className="text-sm text-muted-foreground mt-0.5">{lockedUnit} · Shelf {lockedShelf}</p>
          )}
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
        <p className="text-lg font-semibold text-foreground">
          Tray {index + 1} of {total}
        </p>
        <span className="text-base font-mono text-muted-foreground">Mold: {moldId}</span>
      </div>

      {cameraOpen && (
        <div className="relative w-full rounded-xs overflow-hidden border bg-black">
          <div id={scannerDivId} className="w-full" />
          <Button size="sm" variant="secondary" className="absolute top-2 right-2 gap-1 z-10 rounded-xs" onClick={stopScanner}>
            <X className="w-4 h-4" /> Close
          </Button>
          <p className="text-center text-sm text-white/70 pb-2">Point camera at tray barcode</p>
        </div>
      )}

      {cameraError && <p className="text-base text-destructive">{cameraError}</p>}

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isActive ? "Scan tray barcode…" : "Waiting…"}
          disabled={!isActive || isProcessing || cameraOpen}
          className="text-2xl font-mono rounded-xs h-16 flex-1"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          className="h-16 w-16 shrink-0 rounded-xs"
          onClick={cameraOpen ? stopScanner : startScanner}
          disabled={!isActive || isProcessing}
          title={cameraOpen ? "Close camera" : "Use camera to scan"}
        >
          {cameraOpen ? <X className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
        </Button>
      </div>

      {isActive && !cameraOpen && (
        <p className="text-sm text-muted-foreground">Press Enter, scan barcode, or tap camera</p>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShelfSlot {
  moldId: string;
  trayId?: string;
  dehydratorUnitId?: string;
  shelfPosition?: number;
}

interface NextShelf {
  dehydratorUnitId: string;
  shelfPosition: number;
}

// ─── Cook Item Card ───────────────────────────────────────────────────────────

type CardMode = "idle" | "scanning" | "done";

interface CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  batchStarted: boolean;
  onGetNextShelf: () => Promise<NextShelf | null>;
}

function CookItemCard({ item, isAdmin, batchStarted, onGetNextShelf }: CookItemCardProps) {
  const isComplete = item.status === "dehydrating_complete";

  const initialMode: CardMode = isComplete ? "done"
    : item.dehydratorAssignments.length > 0 ? "scanning"
    : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [slots, setSlots] = useState<ShelfSlot[]>(() =>
    item.assignedMoldIds.map((moldId) => {
      const existing = item.dehydratorAssignments.find((a) => a.moldId === moldId);
      return existing
        ? { moldId, trayId: existing.trayId, dehydratorUnitId: existing.dehydratorUnitId, shelfPosition: existing.shelfPosition }
        : { moldId };
    })
  );

  const [processMold, { isLoading: isProcessing }] = useProcessMoldMutation();

  const totalTrays = item.assignedMoldIds.length;
  const lockedCount = slots.filter((s) => s.trayId).length;
  const allLocked = lockedCount >= totalTrays && totalTrays > 0;

  useEffect(() => {
    if (batchStarted && mode === "idle") setMode("scanning");
  }, [batchStarted, mode]);

  const handleTrayScan = useCallback(
    async (moldId: string, trayId: string): Promise<boolean> => {
      const shelf = await onGetNextShelf();
      if (!shelf) return false;
      try {
        await processMold({
          cookItemId: item.cookItemId,
          moldId,
          trayId,
          dehydratorUnitId: shelf.dehydratorUnitId,
          shelfPosition: shelf.shelfPosition,
          performedBy: getPPSUser(),
        } as any).unwrap();
        setSlots((prev) =>
          prev.map((s) =>
            s.moldId === moldId
              ? { ...s, trayId, dehydratorUnitId: shelf.dehydratorUnitId, shelfPosition: shelf.shelfPosition }
              : s
          )
        );
        return true;
      } catch (err: any) {
        toast.error(err?.data?.message || "Tray not found or already in use");
        return false;
      }
    },
    [processMold, item.cookItemId, onGetNextShelf]
  );

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const activeSlotIndex = slots.findIndex((s) => !s.trayId);

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
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Loaded</p>
          <p className={`text-3xl font-bold ${allLocked ? "text-green-600" : ""}`}>
            {lockedCount}/{totalTrays}
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
            <p className="text-2xl font-bold">All trays loaded — {lockedCount} tray{lockedCount !== 1 ? "s" : ""}</p>
          </div>
        ) : mode === "idle" && !batchStarted ? (
          <Button size="lg" variant="outline" className="w-full text-2xl h-16 rounded-xs font-bold" onClick={() => setMode("scanning")}>
            Load to Dehydrator
          </Button>
        ) : mode === "scanning" ? (
          <div className="flex flex-col gap-3">
            {slots.map((slot, i) => (
              <TraySlot
                key={slot.moldId}
                slotId={`${item.cookItemId}-${i}`}
                index={i}
                total={totalTrays}
                moldId={slot.moldId}
                isActive={i === activeSlotIndex}
                lockedTrayId={slot.trayId}
                lockedUnit={slot.dehydratorUnitId || undefined}
                lockedShelf={slot.shelfPosition || undefined}
                isProcessing={isProcessing}
                onSubmit={(trayId) => handleTrayScan(slot.moldId, trayId)}
              />
            ))}

            <Button
              size="lg"
              disabled={!allLocked || isProcessing}
              className="w-full text-2xl h-16 gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 font-bold"
              onClick={() => {}}
            >
              <CheckCircle2 className="w-6 h-6" />
              Dehydrating Complete
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

export default function LockedStage2OrderPage({
  params,
}: {
  params: Promise<{ stageNum: string; orderId: string }>;
}) {
  const { stageNum, orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();
  const dispatch = useAppDispatch();

  const { data, isLoading, isError } = useGetStage2CookItemsQuery();

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("better-user");
    router.push(`/pps/stage/${stageNum}`);
  }, [router, stageNum]);

  const [batchStarted, setBatchStarted] = useState(false);

  const allComplete = orderItems.length > 0 && orderItems.every(
    (i) => i.status === "dehydrating_complete"
  );

  const handleGetNextShelf = useCallback(async (): Promise<NextShelf | null> => {
    const result = await dispatch(
      ppsApi.endpoints.getNextAvailableShelf.initiate(undefined, { forceRefetch: true })
    );
    if ("error" in result || !result.data) {
      toast.error("No available shelves — dehydrator is full");
      return null;
    }
    return { dehydratorUnitId: result.data.dehydratorUnitId, shelfPosition: result.data.shelfPosition };
  }, [dispatch]);

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
          <Wind className="w-10 h-10 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 2 — Dehydrator Loading"}
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
          <Wind className="w-14 h-14 opacity-40" />
          <p className="text-xl">No Stage 2 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {!allComplete && (
            <Button
              size="lg"
              onClick={() => setBatchStarted(true)}
              disabled={batchStarted}
              className={`w-full text-2xl py-5 h-auto rounded-xs font-bold transition-colors ${
                batchStarted ? "bg-green-600 hover:bg-green-700 text-white" : ""
              }`}
            >
              {batchStarted ? (
                <><CheckCircle2 className="w-7 h-7 mr-2" />Loading in Progress</>
              ) : (
                "Load All to Dehydrator"
              )}
            </Button>
          )}

          {allComplete && (
            <div className="flex items-center gap-4 px-5 py-5 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-9 h-9 shrink-0" />
              <p className="text-2xl font-bold">All items loaded — ready for dehydrating</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <CookItemCard
                key={item._id}
                item={item}
                isAdmin={isAdmin}
                batchStarted={batchStarted}
                onGetNextShelf={handleGetNextShelf}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
