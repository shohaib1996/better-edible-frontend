"use client";

import { use, useState } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";
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

// ─── Button state machine ─────────────────────────────────────────────────────
// "idle"     → worker hasn't started yet → shows [Start] button
// "molding"  → started, collecting molds → shows [Mold] + optional [Complete]
// "scanning" → input open, autofocused   → shows input + [×] + optional [Complete]

type CardMode = "idle" | "molding" | "scanning";

// ─── Cook Item Card ───────────────────────────────────────────────────────────

function CookItemCard({ item, isAdmin }: { item: ICookItem; isAdmin: boolean }) {
  const isComplete = item.status === "cooking_molding_complete";

  // If already in-progress on load, jump straight to molding mode
  const initialMode: CardMode =
    isComplete ? "idle" : item.status === "in-progress" ? "molding" : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [assignMold, { isLoading: isAssigning }] = useAssignMoldMutation();
  const [completeStage1, { isLoading: isCompleting }] = useCompleteStage1Mutation();

  const handleAssignMold = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed || isAssigning) return;
    try {
      await assignMold({
        cookItemId: item.cookItemId,
        moldId: trimmed,
        performedBy: getPPSUser(),
      } as any).unwrap();
      setBarcodeInput("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Mold already in use or not found");
    }
  };

  const handleCompleteStage1 = async () => {
    try {
      await completeStage1({
        cookItemId: item.cookItemId,
        performedBy: getPPSUser(),
      } as any).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 1");
    }
  };

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  return (
    <Card className="flex flex-col gap-0">
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

      <CardContent className="flex flex-col gap-4">
        {/* Qty + product type */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Quantity</p>
            <p className="font-medium">{item.quantity.toLocaleString()} units</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Product</p>
            <p className="font-medium truncate">{item.productType}</p>
          </div>
        </div>

        {/* Flavor components */}
        {item.flavorComponents.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Flavor Components</p>
            <div className="flex flex-wrap gap-1.5">
              {item.flavorComponents.map((fc) => (
                <Badge key={fc.name} variant="secondary" className="text-xs">
                  {fc.name} {fc.percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Color components */}
        {item.colorComponents.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Color Components</p>
            <div className="flex flex-wrap gap-1.5">
              {item.colorComponents.map((cc) => (
                <Badge
                  key={cc.name}
                  variant="outline"
                  className="text-xs border-violet-500/40 text-violet-600"
                >
                  {cc.name} {cc.percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Assigned molds */}
        {item.assignedMoldIds.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Assigned Molds ({item.assignedMoldIds.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.assignedMoldIds.map((id) => (
                <Badge key={id} variant="outline" className="text-xs font-mono">
                  {id}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Action area ── */}
        {isComplete ? (
          <div className="border-t pt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Stage 1 complete — {item.assignedMoldIds.length} mold(s)</span>
          </div>
        ) : (
          <div className="border-t pt-3 flex flex-col gap-2">

            {/* IDLE — show Start button */}
            {mode === "idle" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMode("molding")}
              >
                Start
              </Button>
            )}

            {/* MOLDING — show Mold button (+ Complete if molds assigned) */}
            {mode === "molding" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => setMode("scanning")}
                >
                  Mold
                </Button>
                {item.assignedMoldIds.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleCompleteStage1}
                    disabled={isCompleting}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isCompleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Complete Stage 1
                  </Button>
                )}
              </>
            )}

            {/* SCANNING — barcode scanner with camera support */}
            {mode === "scanning" && (
              <>
                <BarcodeScannerInput
                  value={barcodeInput}
                  onChange={setBarcodeInput}
                  onSubmit={handleAssignMold}
                  placeholder="Scan mold barcode…"
                  disabled={isAssigning}
                  mode="barcode"
                />
                {item.assignedMoldIds.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleCompleteStage1}
                    disabled={isCompleting}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isCompleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Complete Stage 1
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </CardContent>
    </Card>
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
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">
              {storeName ?? "Stage 1 — Cooking & Molding"}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <ChefHat className="w-10 h-10 opacity-40" />
          <p className="text-sm">No Stage 1 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {orderItems.length} item{orderItems.length !== 1 ? "s" : ""} in this order
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderItems.map((item) => (
              <CookItemCard key={item._id} item={item} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
