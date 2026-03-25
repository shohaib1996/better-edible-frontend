"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wind,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";
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
// One slot per mold. Shows assigned tray + shelf location once scanned.

interface TraySlotProps {
  slotId: string;
  index: number;
  total: number;
  moldId: string;
  isActive: boolean;
  /** Set once tray has been scanned & processMold confirmed */
  lockedTrayId?: string;
  lockedUnit?: string;
  lockedShelf?: number;
  isProcessing: boolean;
  onSubmit: (trayId: string) => Promise<boolean>;
}

function TraySlot({
  slotId: _slotId,
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

  // ── Locked (done) ──
  if (lockedTrayId) {
    return (
      <div className="flex items-center gap-3 px-4 py-4 rounded-xs bg-green-50 border border-green-200">
        <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            Tray {index + 1} of {total} · Mold <span className="font-mono">{moldId}</span>
          </p>
          <p className="text-xl font-mono font-semibold text-green-700 truncate">{lockedTrayId}</p>
          {lockedUnit && (
            <p className="text-xs text-muted-foreground mt-0.5">{lockedUnit} · Shelf {lockedShelf}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Active / waiting ──
  return (
    <div className={`flex flex-col gap-3 rounded-xs border p-4 transition-colors ${
      flash
        ? "bg-green-100 border-green-400"
        : isActive
        ? "border-primary bg-primary/5"
        : "border-muted bg-muted/30 opacity-60"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Tray {index + 1} of {total}
        </p>
        <span className="text-xs font-mono text-muted-foreground">Mold: {moldId}</span>
      </div>
      <BarcodeScannerInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={isActive ? "Scan tray barcode…" : "Waiting…"}
        disabled={!isActive || isProcessing}
        mode="qr"
        inputClassName="text-xl font-mono h-14"
      />
      {isActive && (
        <p className="text-xs text-muted-foreground">Scan barcode, use camera, or press Enter</p>
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
  const processedMoldIds = item.dehydratorAssignments.map((a) => a.moldId);

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

  // Auto-enter scanning when batch starts
  useEffect(() => {
    if (batchStarted && mode === "idle") setMode("scanning");
  }, [batchStarted, mode]);

  const handleTrayScan = useCallback(
    async (moldId: string, trayId: string): Promise<boolean> => {
      // Fetch the next available shelf at scan time — after previous processMold has occupied its shelf
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

  // Active tray slot = first unscanned
  const activeSlotIndex = slots.findIndex((s) => !s.trayId);

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
          <p className="text-2xl font-bold">{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Trays</p>
          <p className="text-2xl font-bold">{totalTrays}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Loaded</p>
          <p className={`text-2xl font-bold ${allLocked ? "text-green-600" : ""}`}>
            {lockedCount}/{totalTrays}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {/* ── Flavor components ── */}
        {item.flavorComponents.length > 0 && (
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

        {/* ── Action area ── */}
        {mode === "done" || isComplete ? (
          <div className="flex items-center gap-3 py-4 text-green-600">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <p className="text-xl font-semibold">All trays loaded — {lockedCount} tray{lockedCount !== 1 ? "s" : ""}</p>
          </div>
        ) : mode === "idle" && !batchStarted ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full text-xl h-14 rounded-xs"
            onClick={() => setMode("scanning")}
          >
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
                lockedUnit={slot.dehydratorUnitId}
                lockedShelf={slot.shelfPosition}
                isProcessing={isProcessing}
                onSubmit={(trayId) => handleTrayScan(slot.moldId, trayId)}
              />
            ))}

            <Button
              size="lg"
              disabled={!allLocked || isProcessing}
              className="w-full text-xl h-14 gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
              onClick={() => {/* auto-completes via processMold backend logic */}}
            >
              <CheckCircle2 className="w-5 h-5" />
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

export default function Stage2OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();
  const dispatch = useAppDispatch();

  const { data, isLoading, isError } = useGetStage2CookItemsQuery();

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  const [batchStarted, setBatchStarted] = useState(false);

  const allComplete = orderItems.length > 0 && orderItems.every(
    (i) => i.status === "dehydrating_complete"
  );

  // Fetches the next available shelf at scan time (called once per tray scan)
  const handleGetNextShelf = useCallback(async (): Promise<NextShelf | null> => {
    try {
      const result = await dispatch(
        ppsApi.endpoints.getNextAvailableShelf.initiate(undefined, { forceRefetch: true })
      );
      if ("error" in result || !result.data) {
        toast.error("No available shelves — dehydrator is full");
        return null;
      }
      return { dehydratorUnitId: result.data.dehydratorUnitId, shelfPosition: result.data.shelfPosition };
    } catch {
      toast.error("Failed to get next shelf. Please try again.");
      return null;
    }
  }, [dispatch]);

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
          <Wind className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 2 — Dehydrator Loading"}
            </h1>
            <p className="text-base text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Wind className="w-10 h-10 opacity-40" />
          <p className="text-base">No Stage 2 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Load All button */}
          {!allComplete && (
            <Button
              size="lg"
              onClick={() => setBatchStarted(true)}
              disabled={batchStarted}
              className={`w-full text-2xl h-16 rounded-xs font-bold transition-colors ${
                batchStarted ? "bg-green-600 hover:bg-green-700 text-white" : ""
              }`}
            >
              {batchStarted ? (
                <><CheckCircle2 className="w-6 h-6 mr-2" />Loading in Progress</>
              ) : (
                "Load All to Dehydrator"
              )}
            </Button>
          )}

          {allComplete && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <p className="text-xl font-semibold">All items loaded — ready for dehydrating</p>
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
