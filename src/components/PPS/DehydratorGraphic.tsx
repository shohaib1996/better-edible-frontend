"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";
import type { IDehydratorUnit } from "@/types/privateLabel/pps";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingAssignment {
  cookItemId: string;
  moldId: string;
  flavor: string;
  dehydratorUnitId: string;
  shelfPosition: number;
  trayId?: string; // set once locked
}

interface Props {
  units: IDehydratorUnit[];
  pendingAssignments: PendingAssignment[];
  onTrayScan: (assignment: PendingAssignment, trayId: string) => Promise<void>;
}

// ─── Single Shelf Row ─────────────────────────────────────────────────────────

interface ShelfRowProps {
  pos: number;
  assignment: PendingAssignment | null;   // null = empty / other order
  isActive: boolean;                       // the ONE slot currently being scanned
  onTrayScan: (trayId: string) => Promise<void>;
  existingTrayId?: string | null;          // already occupied by a different order
}

function ShelfRow({ pos, assignment, isActive, onTrayScan, existingTrayId }: ShelfRowProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset value when this row becomes active
  useEffect(() => {
    if (isActive) setValue("");
  }, [isActive]);

  const handleSubmit = async (trayId: string) => {
    const trimmed = trayId.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      await onTrayScan(trimmed);
      setValue("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Tray not found or already in use");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = !!assignment?.trayId;
  const isPending = !!assignment && !isLocked;

  return (
    <div
      className={`rounded-xs border transition-all ${
        isLocked
          ? "bg-green-500/10 border-green-500/30"
          : isActive
          ? "bg-amber-400/15 border-amber-400 ring-1 ring-amber-400/40"
          : isPending
          ? "bg-amber-400/5 border-amber-400/30"
          : existingTrayId
          ? "bg-muted/30 border-border/40 opacity-60"
          : "bg-transparent border-border/30 opacity-40"
      }`}
    >
      {/* Top row: shelf number + summary */}
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-xs font-mono font-semibold w-6 text-center text-muted-foreground shrink-0">
          {pos}
        </span>

        <div className="flex-1 min-w-0">
          {isLocked ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className="text-xs font-mono text-green-700">{assignment!.trayId}</span>
              <span className="text-xs text-muted-foreground truncate">
                {assignment!.moldId} · {assignment!.flavor}
              </span>
            </div>
          ) : isActive ? (
            <span className="text-xs font-medium">
              {assignment!.moldId}
              <span className="text-muted-foreground font-normal"> · {assignment!.flavor}</span>
              {loading && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
            </span>
          ) : isPending ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono border-amber-400/50 text-amber-700">
                {assignment!.moldId}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">{assignment!.flavor}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">waiting…</span>
            </div>
          ) : existingTrayId ? (
            <span className="text-xs font-mono text-muted-foreground">{existingTrayId}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Empty</span>
          )}
        </div>
      </div>

      {/* Scanner row — only shown for active slot */}
      {isActive && (
        <div className="px-3 pb-3">
          <BarcodeScannerInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder="Scan tray barcode…"
            disabled={loading}
            mode="barcode"
          />
        </div>
      )}
    </div>
  );
}

// ─── Single Dehydrator Unit ───────────────────────────────────────────────────

interface UnitViewProps {
  unit: IDehydratorUnit;
  assignments: PendingAssignment[];       // all pending assignments for this unit
  activeIndex: number;                    // global index of active assignment
  globalOffset: number;                  // how many assignments come before this unit
  onTrayScan: (assignment: PendingAssignment, trayId: string) => Promise<void>;
}

function UnitView({ unit, assignments, activeIndex, globalOffset, onTrayScan }: UnitViewProps) {
  const lockedCount = assignments.filter((a) => a.trayId).length;

  return (
    <div className="border rounded-xs overflow-hidden">
      {/* Unit header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{unit.unitId}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {lockedCount}/{assignments.length} loaded
        </span>
      </div>

      {/* Shelf list */}
      <div className="p-3 flex flex-col gap-1.5">
        {Array.from({ length: unit.totalShelves }, (_, i) => {
          const pos = i + 1;
          const shelfKey = String(pos);
          const existingTray = unit.shelves[shelfKey]?.trayId ?? null;

          // Find if there's a pending assignment for this shelf position
          const assignmentIdx = assignments.findIndex((a) => a.shelfPosition === pos);
          const assignment = assignmentIdx !== -1 ? assignments[assignmentIdx] : null;
          const globalAssignmentIdx = assignmentIdx !== -1 ? globalOffset + assignmentIdx : -1;
          const isActive = globalAssignmentIdx === activeIndex;

          return (
            <ShelfRow
              key={pos}
              pos={pos}
              assignment={assignment}
              isActive={isActive}
              existingTrayId={!assignment ? existingTray : null}
              onTrayScan={async (trayId) => {
                await onTrayScan(assignment!, trayId);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Dehydrator Graphic ───────────────────────────────────────────────────────

export default function DehydratorGraphic({ units, pendingAssignments, onTrayScan }: Props) {
  // Active index = index of first unlocked assignment
  const activeIndex = pendingAssignments.findIndex((a) => !a.trayId);
  const allDone = activeIndex === -1 && pendingAssignments.length > 0;

  // Group assignments by unit
  const assignmentsByUnit = pendingAssignments.reduce<Record<string, { assignments: PendingAssignment[]; offset: number }>>(
    (acc, assignment, idx) => {
      const uid = assignment.dehydratorUnitId;
      if (!acc[uid]) {
        acc[uid] = { assignments: [], offset: idx };
      }
      acc[uid].assignments.push(assignment);
      return acc;
    },
    {}
  );

  // Only show units that have pending assignments
  const involvedUnitIds = Object.keys(assignmentsByUnit);
  const involvedUnits = units.filter((u) => involvedUnitIds.includes(u.unitId));

  if (allDone) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-xs bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold">All molds loaded!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingAssignments.length} tray{pendingAssignments.length !== 1 ? "s" : ""} locked into the dehydrator.
          </p>
        </div>
      </div>
    );
  }

  if (pendingAssignments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No assignments to display.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-xs overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${Math.round(
                (pendingAssignments.filter((a) => a.trayId).length /
                  pendingAssignments.length) *
                  100
              )}%`,
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {pendingAssignments.filter((a) => a.trayId).length} /{" "}
          {pendingAssignments.length} trays loaded
        </span>
      </div>

      {/* Instruction */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
        <strong>Scan the tray QR code</strong> for each highlighted shelf. The system will advance to the next shelf automatically.
      </div>

      {/* Units */}
      <div className="flex flex-col gap-6">
        {involvedUnits.map((unit) => {
          const { assignments, offset } = assignmentsByUnit[unit.unitId];
          return (
            <UnitView
              key={unit.unitId}
              unit={unit}
              assignments={assignments}
              activeIndex={activeIndex}
              globalOffset={offset}
              onTrayScan={onTrayScan}
            />
          );
        })}
      </div>
    </div>
  );
}
