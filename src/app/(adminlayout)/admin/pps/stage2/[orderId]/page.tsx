"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wind,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import DehydratorGraphic, {
  type PendingAssignment,
} from "@/components/PPS/DehydratorGraphic";
import {
  useGetStage2CookItemsQuery,
  useGetDehydratorUnitsQuery,
  useProcessMoldMutation,
  ppsApi,
} from "@/redux/api/PrivateLabel/ppsApi";
import { useAppDispatch } from "@/redux/hooks/hooks";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Cook Item Card (items view) ──────────────────────────────────────────────

function CookItemCard({ item, isAdmin }: { item: ICookItem; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const processedMoldIds = item.dehydratorAssignments.map((a) => a.moldId);
  const unprocessedMolds = item.assignedMoldIds.filter(
    (id) => !processedMoldIds.includes(id)
  );
  const allProcessed =
    item.assignedMoldIds.length > 0 && unprocessedMolds.length === 0;

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{item.flavor}</CardTitle>
            <CardDescription className="text-xs mt-0.5 font-mono">
              {item.cookItemId}
            </CardDescription>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${statusColor}`}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-medium">{item.quantity.toLocaleString()} units</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Molds</p>
            <p className="font-medium">
              {processedMoldIds.length} / {item.assignedMoldIds.length} loaded
            </p>
          </div>
        </div>

        {/* Molds list — display only */}
        {item.assignedMoldIds.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Assigned Molds
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.assignedMoldIds.map((id) => {
                const isLoaded = processedMoldIds.includes(id);
                return (
                  <Badge
                    key={id}
                    variant={isLoaded ? "default" : "outline"}
                    className={`text-xs font-mono ${
                      isLoaded ? "bg-green-600 text-white" : ""
                    }`}
                  >
                    {isLoaded ? "✓ " : ""}
                    {id}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Existing dehydrator assignments */}
        {item.dehydratorAssignments.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {item.dehydratorAssignments.length} tray assignment
              {item.dehydratorAssignments.length !== 1 ? "s" : ""} loaded
            </button>
            {expanded && (
              <div className="mt-2 flex flex-col gap-1.5">
                {item.dehydratorAssignments.map((a) => (
                  <div
                    key={a.moldId}
                    className="flex items-center gap-2 text-xs bg-muted rounded px-2 py-1.5 font-mono"
                  >
                    <span className="text-muted-foreground">Mold</span>
                    <span>{a.moldId}</span>
                    <span className="text-muted-foreground">→ Tray</span>
                    <span>{a.trayId}</span>
                    <span className="text-muted-foreground ml-auto">
                      {a.dehydratorUnitId} · Shelf {a.shelfPosition}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {allProcessed && (
          <div className="flex items-center gap-2 text-green-600 text-sm border-t pt-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>All molds loaded into dehydrator</span>
          </div>
        )}

        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </CardContent>
    </Card>
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
  const { data: stage2Data, isLoading, isError } = useGetStage2CookItemsQuery();
  const { data: unitsData } = useGetDehydratorUnitsQuery();
  const [processMold] = useProcessMoldMutation();

  const [view, setView] = useState<"items" | "dehydrator">("items");
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const allItems = stage2Data?.cookItems ?? [];
  const units = unitsData?.units ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  // All unprocessed molds across all items in this order
  const unprocessedPairs: { cookItemId: string; moldId: string; flavor: string }[] =
    orderItems.flatMap((item) => {
      const processedMoldIds = item.dehydratorAssignments.map((a) => a.moldId);
      return item.assignedMoldIds
        .filter((id) => !processedMoldIds.includes(id))
        .map((moldId) => ({
          cookItemId: item.cookItemId,
          moldId,
          flavor: item.flavor,
        }));
    });

  const hasUnprocessed = unprocessedPairs.length > 0;

  // ── Auto-assign shelves and switch to dehydrator view ──────────────────────
  const handleLoadToDehydrator = async () => {
    if (!hasUnprocessed) return;
    setIsBuilding(true);
    try {
      const assignments: PendingAssignment[] = [];

      for (const pair of unprocessedPairs) {
        const result = await dispatch(
          ppsApi.endpoints.getNextAvailableShelf.initiate(undefined, {
            forceRefetch: true,
          })
        );
        if ("error" in result || !result.data) {
          toast.error("No available shelves — all dehydrator shelves are full");
          setIsBuilding(false);
          return;
        }
        assignments.push({
          cookItemId: pair.cookItemId,
          moldId: pair.moldId,
          flavor: pair.flavor,
          dehydratorUnitId: result.data.dehydratorUnitId,
          shelfPosition: result.data.shelfPosition,
        });
      }

      setPendingAssignments(assignments);
      setView("dehydrator");
    } catch {
      toast.error("Failed to assign shelves. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  };

  // ── Handle tray scan: call processMold and mark slot locked ───────────────
  const handleTrayScan = async (assignment: PendingAssignment, trayId: string) => {
    await processMold({
      cookItemId: assignment.cookItemId,
      moldId: assignment.moldId,
      trayId,
      dehydratorUnitId: assignment.dehydratorUnitId,
      shelfPosition: assignment.shelfPosition,
      performedBy: getPPSUser(),
    } as any).unwrap();

    // Mark this slot as locked in local state
    setPendingAssignments((prev) =>
      prev.map((a) =>
        a.moldId === assignment.moldId && a.cookItemId === assignment.cookItemId
          ? { ...a, trayId }
          : a
      )
    );
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
          onClick={() =>
            view === "dehydrator" ? setView("items") : router.push("/admin/pps")
          }
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Wind className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">
              {view === "dehydrator"
                ? "Load to Dehydrator"
                : storeName ?? "Stage 2 — Dehydrator Loading"}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Wind className="w-10 h-10 opacity-40" />
          <p className="text-sm">
            No Stage 2 items found for order {decodedOrderId}.
          </p>
        </div>
      ) : view === "items" ? (
        <>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {orderItems.length} item{orderItems.length !== 1 ? "s" : ""} in
              this order
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {orderItems.map((item) => (
                <CookItemCard key={item._id} item={item} isAdmin={isAdmin} />
              ))}
            </div>
          </div>

          {/* Load to Dehydrator button */}
          {hasUnprocessed && (
            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                onClick={handleLoadToDehydrator}
                disabled={isBuilding}
                className="gap-2"
              >
                {isBuilding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {isBuilding
                  ? `Assigning shelves… (${unprocessedPairs.length} molds)`
                  : `Load All to Dehydrator (${unprocessedPairs.length} mold${unprocessedPairs.length !== 1 ? "s" : ""})`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <DehydratorGraphic
          units={units}
          pendingAssignments={pendingAssignments}
          onTrayScan={handleTrayScan}
        />
      )}
    </div>
  );
}
