"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  Loader2,
  LogOut,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";
import {
  useGetStage1CookItemsQuery,
  useAssignMoldMutation,
  useUnassignMoldMutation,
  useCompleteStage1Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Constants ────────────────────────────────────────────────────────────────

const UNITS_PER_MOLD = 70;

function moldsNeeded(quantity: number) {
  return Math.ceil(quantity / UNITS_PER_MOLD);
}

// ─── Mold Slot Input ──────────────────────────────────────────────────────────

interface MoldSlotProps {
  index: number;
  total: number;
  isActive: boolean;
  isAssigned: boolean;
  assignedId?: string;
  units: number;
  onUnitsChange: (units: number) => void;
  isAssigning: boolean;
  isCancelling: boolean;
  onSubmit: (barcode: string) => Promise<boolean>;
  onCancel: () => void;
}

function MoldSlot({
  index,
  total,
  isActive,
  isAssigned,
  assignedId,
  units,
  onUnitsChange,
  isAssigning,
  isCancelling,
  onSubmit,
  onCancel,
}: MoldSlotProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);

  const handleSubmit = useCallback(
    async (barcode: string) => {
      const trimmed = barcode.trim();
      if (!trimmed || isAssigning) return;
      const ok = await onSubmit(trimmed);
      if (ok) {
        setValue("");
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
      }
    },
    [isAssigning, onSubmit],
  );

  if (isAssigned) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-xs bg-green-50 border border-green-200">
        <CheckCircle2 className="w-9 h-9 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-base text-muted-foreground font-medium">Mold {index + 1} of {total}</p>
          <p className="text-2xl font-mono font-bold text-green-700 truncate">{assignedId}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">Units:</span>
          <input
            type="number"
            min={1}
            value={units}
            onChange={(e) => onUnitsChange(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 text-lg font-mono font-bold text-center border rounded-xs px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isCancelling}
          className="shrink-0 p-2 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
          title="Remove mold"
        >
          {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
        </button>
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
        <p className="text-lg font-semibold text-foreground">Mold {index + 1} of {total}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Units:</span>
          <input
            type="number"
            min={1}
            value={units}
            onChange={(e) => onUnitsChange(Math.max(1, Number(e.target.value) || 1))}
            disabled={!isActive}
            className="w-20 text-lg font-mono font-bold text-center border rounded-xs px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
        </div>
      </div>
      <BarcodeScannerInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={isActive ? "Scan mold barcode…" : "Waiting…"}
        disabled={!isActive || isAssigning}
        mode="barcode"
        inputClassName="text-2xl font-mono h-16"
      />
      {isActive && (
        <p className="text-sm text-muted-foreground">Scan barcode, use camera, or press Enter</p>
      )}
    </div>
  );
}

// ─── Cook Item Card ───────────────────────────────────────────────────────────

type CardMode = "idle" | "molding" | "confirming" | "done";

interface CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  batchStarted: boolean;
  onItemDone: () => void;
}

function CookItemCard({ item, isAdmin, batchStarted, onItemDone }: CookItemCardProps) {
  const isComplete = item.status === "cooking_molding_complete";
  const initialMode: CardMode = isComplete
    ? "done"
    : item.status === "in-progress"
      ? "molding"
      : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [extraMolds, setExtraMolds] = useState(0);
  const [moldUnits, setMoldUnits] = useState<number[]>(() =>
    item.moldingTimestamps.map((t) => t.unitsPerMold ?? 70),
  );
  const [cancellingMoldId, setCancellingMoldId] = useState<string | null>(null);

  const [assignMold, { isLoading: isAssigning }] = useAssignMoldMutation();
  const [unassignMold] = useUnassignMoldMutation();
  const [completeStage1, { isLoading: isCompleting }] = useCompleteStage1Mutation();

  const totalMolds = moldsNeeded(item.quantity) + extraMolds;
  const assignedCount = item.assignedMoldIds.length;
  const allMoldsAssigned = assignedCount >= totalMolds;

  useEffect(() => {
    setMoldUnits((prev) => {
      const updated = [...prev];
      item.moldingTimestamps.forEach((t, i) => {
        if (updated[i] === undefined) updated[i] = t.unitsPerMold ?? 70;
      });
      while (updated.length < totalMolds) updated.push(UNITS_PER_MOLD);
      return updated;
    });
  }, [item.moldingTimestamps, totalMolds]);

  useEffect(() => {
    if (batchStarted && mode === "idle") setMode("molding");
  }, [batchStarted, mode]);

  useEffect(() => {
    if (mode === "molding" && allMoldsAssigned && assignedCount > 0) {
      setMode("confirming");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMoldsAssigned, assignedCount]);

  const handleAssignMold = useCallback(
    async (barcode: string): Promise<boolean> => {
      const slotIndex = assignedCount;
      const units = moldUnits[slotIndex] ?? UNITS_PER_MOLD;
      try {
        await assignMold({
          cookItemId: item.cookItemId,
          moldId: barcode,
          unitsPerMold: units,
          performedBy: getPPSUser(),
        } as any).unwrap();
        return true;
      } catch (err: any) {
        toast.error(err?.data?.message || "Mold already in use or not found");
        return false;
      }
    },
    [assignMold, item.cookItemId, assignedCount, moldUnits],
  );

  const handleUnassignMold = useCallback(
    async (moldId: string) => {
      setCancellingMoldId(moldId);
      try {
        await unassignMold({
          cookItemId: item.cookItemId,
          moldId,
          performedBy: getPPSUser(),
        } as any).unwrap();
        setMode("molding");
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to remove mold");
      } finally {
        setCancellingMoldId(null);
      }
    },
    [unassignMold, item.cookItemId],
  );

  const handleFinish = useCallback(async () => {
    try {
      await completeStage1({
        cookItemId: item.cookItemId,
        performedBy: getPPSUser(),
      } as any).unwrap();
      setMode("done");
      onItemDone();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 1");
    }
  }, [completeStage1, item.cookItemId, onItemDone]);

  const handleCancelConfirm = useCallback(() => {
    setMode("molding");
  }, []);

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const activeMoldIndex = assignedCount;
  const qtyProduced = moldUnits.slice(0, assignedCount).reduce((sum, u) => sum + (u || 0), 0);

  const handleUnitsChange = useCallback((index: number, units: number) => {
    setMoldUnits((prev) => {
      const updated = [...prev];
      updated[index] = units;
      return updated;
    });
  }, []);

  return (
    <div className="flex flex-col gap-0 rounded-xs border bg-card">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-4xl font-bold leading-tight truncate">{item.flavor}</p>
          <p className="text-base text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-base px-3 py-1.5 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* ── Stats row (4 columns) ── */}
      <div className="grid grid-cols-4 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Qty Ordered</p>
          <p className="text-3xl font-bold">{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Qty Produced</p>
          <p className={`text-3xl font-bold ${assignedCount > 0 ? "text-blue-600" : ""}`}>
            {qtyProduced.toLocaleString()}
          </p>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Molds Needed</p>
          <p className="text-3xl font-bold">{totalMolds}</p>
        </div>
        <div className="px-3 py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Scanned</p>
          <p className={`text-3xl font-bold ${allMoldsAssigned ? "text-green-600" : ""}`}>
            {assignedCount}/{totalMolds}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {/* ── Action area ── */}
        {mode === "done" || isComplete ? (
          <div className="flex items-center gap-4 py-4 text-green-600">
            <CheckCircle2 className="w-10 h-10 shrink-0" />
            <p className="text-2xl font-bold">
              Molding Complete — {assignedCount} mold{assignedCount !== 1 ? "s" : ""},{" "}
              {qtyProduced.toLocaleString()} units
            </p>
          </div>
        ) : mode === "confirming" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 px-5 py-5 rounded-xs bg-green-50 border border-green-200">
              <CheckCircle2 className="w-9 h-9 text-green-600 shrink-0" />
              <p className="text-xl font-bold text-green-800">
                Molding for <span className="font-bold">{item.flavor}</span> is finished.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleFinish}
                disabled={isCompleting}
                className="flex-1 text-2xl h-16 gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 font-bold"
              >
                {isCompleting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
                Finish
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleCancelConfirm}
                disabled={isCompleting}
                className="text-lg h-16 px-8 rounded-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : mode === "idle" && !batchStarted ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full text-2xl h-16 rounded-xs font-bold"
            onClick={() => setMode("molding")}
          >
            Start
          </Button>
        ) : mode === "molding" ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: totalMolds }).map((_, i) => (
              <MoldSlot
                key={i}
                index={i}
                total={totalMolds}
                isActive={i === activeMoldIndex}
                isAssigned={i < assignedCount}
                assignedId={item.assignedMoldIds[i]}
                units={moldUnits[i] ?? UNITS_PER_MOLD}
                onUnitsChange={(u) => handleUnitsChange(i, u)}
                isAssigning={isAssigning}
                isCancelling={cancellingMoldId === item.assignedMoldIds[i]}
                onSubmit={handleAssignMold}
                onCancel={() => handleUnassignMold(item.assignedMoldIds[i])}
              />
            ))}

            {/* Add Mold button */}
            <Button
              size="lg"
              variant="outline"
              className="self-start gap-2 rounded-xs text-lg h-12 px-5"
              onClick={() => {
                setExtraMolds((n) => n + 1);
                setMoldUnits((prev) => [...prev, UNITS_PER_MOLD]);
              }}
            >
              <Plus className="w-5 h-5" />
              Add Mold
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

export default function LockedStage1OrderPage({
  params,
}: {
  params: Promise<{ stageNum: string; orderId: string }>;
}) {
  const { stageNum, orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const { data, isLoading, isError } = useGetStage1CookItemsQuery();
  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("better-user");
    router.push(`/pps/stage/${stageNum}`);
  }, [router, stageNum]);

  const [batchStarted, setBatchStarted] = useState(false);
  const allComplete =
    orderItems.length > 0 &&
    orderItems.every((i) => i.status === "cooking_molding_complete");

  const completedCountRef = useRef(0);

  const handleItemDone = useCallback(() => {
    completedCountRef.current += 1;
    const total = orderItems.length;
    if (completedCountRef.current >= total) {
      const otherOrders = Array.from(
        new Set(
          allItems
            .filter((i) => i.orderId !== decodedOrderId && ["pending", "in-progress"].includes(i.status))
            .map((i) => i.orderId),
        ),
      );
      if (otherOrders.length > 0) {
        router.push(`/pps/stage/${stageNum}/stage1/${encodeURIComponent(otherOrders[0])}`);
      } else {
        router.push(`/pps/stage/${stageNum}`);
      }
    }
  }, [allItems, decodedOrderId, orderItems.length, router, stageNum]);

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/pps/stage/${stageNum}`)}
          className="shrink-0 w-12 h-12"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ChefHat className="w-10 h-10 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 1 — Cooking & Molding"}
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
          <ChefHat className="w-14 h-14 opacity-40" />
          <p className="text-xl">No Stage 1 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Start All button */}
          {!allComplete && (
            <Button
              size="lg"
              onClick={() => setBatchStarted(true)}
              disabled={batchStarted}
              className={`w-full text-2xl h-18 rounded-xs font-bold transition-colors py-5 ${
                batchStarted ? "bg-green-600 hover:bg-green-700 text-white" : ""
              }`}
            >
              {batchStarted ? (
                <>
                  <CheckCircle2 className="w-7 h-7 mr-2" />
                  Molding in Progress
                </>
              ) : (
                "Start All"
              )}
            </Button>
          )}

          {allComplete && (
            <div className="flex items-center gap-4 px-5 py-5 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-9 h-9 shrink-0" />
              <p className="text-2xl font-bold">All items complete — ready for Stage 2</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <CookItemCard
                key={item._id}
                item={item}
                isAdmin={isAdmin}
                batchStarted={batchStarted}
                onItemDone={handleItemDone}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
