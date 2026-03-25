"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import {
  useGetStage1CookItemsQuery,
  useAssignMoldMutation,
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
// Single mold barcode input. Autofocuses when it becomes active.
// Flashes green on successful scan.

interface MoldSlotProps {
  slotId: string;
  index: number;
  total: number;
  isActive: boolean;
  isAssigned: boolean;
  assignedId?: string;
  isAssigning: boolean;
  onSubmit: (barcode: string) => Promise<boolean>;
}

function MoldSlot({ slotId, index, total, isActive, isAssigned, assignedId, isAssigning, onSubmit }: MoldSlotProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && !isAssigned) {
      inputRef.current?.focus();
    }
  }, [isActive, isAssigned]);

  const handleSubmit = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed || isAssigning) return;
    const ok = await onSubmit(trimmed);
    if (ok) {
      setValue("");
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }
  }, [isAssigning, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      handleSubmit(value);
    }
  };

  if (isAssigned) {
    return (
      <div className="flex items-center gap-3 px-4 py-4 rounded-xs bg-green-50 border border-green-200">
        <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">Mold {index + 1} of {total}</p>
          <p className="text-xl font-mono font-semibold text-green-700 truncate">{assignedId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 rounded-xs border p-4 transition-colors ${flash ? "bg-green-100 border-green-400" : isActive ? "border-primary bg-primary/5" : "border-muted bg-muted/30 opacity-60"}`}>
      <p className="text-sm font-medium text-muted-foreground">Mold {index + 1} of {total}</p>

      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isActive ? "Scan mold barcode…" : "Waiting…"}
        disabled={!isActive || isAssigning}
        className="text-xl font-mono rounded-xs h-14"
        autoComplete="off"
      />

      {isActive && (
        <p className="text-xs text-muted-foreground">Scan barcode or press Enter</p>
      )}
    </div>
  );
}

// ─── Cook Item Card ───────────────────────────────────────────────────────────

type CardMode = "idle" | "molding" | "done";

interface CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  /** When true, this card is part of a "start all" batch (hides individual Start button) */
  batchStarted: boolean;
}

function CookItemCard({ item, isAdmin, batchStarted }: CookItemCardProps) {
  const isComplete = item.status === "cooking_molding_complete";
  const initialMode: CardMode = isComplete ? "done" : item.status === "in-progress" ? "molding" : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);

  const [assignMold, { isLoading: isAssigning }] = useAssignMoldMutation();
  const [completeStage1, { isLoading: isCompleting }] = useCompleteStage1Mutation();

  const totalMolds = moldsNeeded(item.quantity);
  const assignedCount = item.assignedMoldIds.length;
  const allMoldsAssigned = assignedCount >= totalMolds;

  // Auto-enter molding when batch starts
  useEffect(() => {
    if (batchStarted && mode === "idle") {
      setMode("molding");
    }
  }, [batchStarted, mode]);

  // Auto-complete when all molds are scanned
  useEffect(() => {
    if (mode === "molding" && allMoldsAssigned && assignedCount > 0) {
      handleCompleteStage1();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMoldsAssigned, assignedCount]);

  const handleAssignMold = useCallback(async (barcode: string): Promise<boolean> => {
    try {
      await assignMold({
        cookItemId: item.cookItemId,
        moldId: barcode,
        performedBy: getPPSUser(),
      } as any).unwrap();
      return true;
    } catch (err: any) {
      toast.error(err?.data?.message || "Mold already in use or not found");
      return false;
    }
  }, [assignMold, item.cookItemId]);

  const handleCompleteStage1 = useCallback(async () => {
    try {
      await completeStage1({
        cookItemId: item.cookItemId,
        performedBy: getPPSUser(),
      } as any).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 1");
    }
  }, [completeStage1, item.cookItemId]);

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  // Active mold slot = first unassigned
  const activeMoldIndex = assignedCount; // 0-based

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
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Molds Needed</p>
          <p className="text-2xl font-bold">{totalMolds}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Scanned</p>
          <p className={`text-2xl font-bold ${allMoldsAssigned ? "text-green-600" : ""}`}>
            {assignedCount}/{totalMolds}
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

        {/* ── Color components ── */}
        {item.colorComponents.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">Color Components</p>
            <div className="flex flex-wrap gap-1.5">
              {item.colorComponents.map((cc) => (
                <Badge key={cc.name} variant="outline" className="text-sm border-violet-500/40 text-violet-600">
                  {cc.name} {cc.percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Action area ── */}
        {mode === "done" || isComplete ? (
          <div className="flex items-center gap-3 py-4 text-green-600">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <p className="text-xl font-semibold">Molding Complete — {assignedCount} mold{assignedCount !== 1 ? "s" : ""}</p>
          </div>
        ) : mode === "idle" && !batchStarted ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full text-xl h-14 rounded-xs"
            onClick={() => setMode("molding")}
          >
            Start
          </Button>
        ) : mode === "molding" ? (
          <div className="flex flex-col gap-3">
            {/* Mold slots */}
            {Array.from({ length: totalMolds }).map((_, i) => (
              <MoldSlot
                key={i}
                slotId={`${item.cookItemId}-${i}`}
                index={i}
                total={totalMolds}
                isActive={i === activeMoldIndex}
                isAssigned={i < assignedCount}
                assignedId={item.assignedMoldIds[i]}
                isAssigning={isAssigning}
                onSubmit={handleAssignMold}
              />
            ))}

            <Button
              size="lg"
              onClick={handleCompleteStage1}
              disabled={!allMoldsAssigned || isCompleting}
              className="w-full text-xl h-14 gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
            >
              {isCompleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Molding Complete
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

export default function Stage1OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const { data, isLoading, isError } = useGetStage1CookItemsQuery();

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  const [batchStarted, setBatchStarted] = useState(false);
  const allComplete = orderItems.length > 0 && orderItems.every((i) => i.status === "cooking_molding_complete");

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
          <ChefHat className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 1 — Cooking & Molding"}
            </h1>
            <p className="text-base text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <ChefHat className="w-10 h-10 opacity-40" />
          <p className="text-base">No Stage 1 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Start All / Molding Complete button */}
          {!allComplete && (
            <Button
              size="lg"
              onClick={() => setBatchStarted(true)}
              disabled={batchStarted}
              className={`w-full text-2xl h-16 rounded-xs font-bold transition-colors ${
                batchStarted
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }`}
            >
              {batchStarted ? (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Molding Complete
                </>
              ) : (
                "Start All"
              )}
            </Button>
          )}

          {allComplete && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <p className="text-xl font-semibold">All items complete — ready for Stage 2</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <CookItemCard
                key={item._id}
                item={item}
                isAdmin={isAdmin}
                batchStarted={batchStarted}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
