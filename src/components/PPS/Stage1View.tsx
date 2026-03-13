"use client";

import { useState, useRef } from "react";
import { Loader2, ChefHat, ScanBarcode, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "./CookItemHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BarcodeScannerInput from "./BarcodeScannerInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

// ─── Cook Item Card ────────────────────────────────────────────────────────────

function CookItemCard({ item, isAdmin }: { item: ICookItem; isAdmin: boolean }) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [assignMold, { isLoading: isAssigning }] = useAssignMoldMutation();
  const [completeStage1, { isLoading: isCompleting }] =
    useCompleteStage1Mutation();

  const handleAssignMold = async () => {
    const barcode = barcodeInput.trim();
    if (!barcode) return;
    try {
      await assignMold({
        cookItemId: item.cookItemId,
        moldId: barcode,
        performedBy: getPPSUser(),
      } as any).unwrap();
      setBarcodeInput("");
      setScanning(false);
      inputRef.current?.blur();
    } catch (err: any) {
      toast.error(err?.data?.message || "Mold already in use or not found");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAssignMold();
  };

  const handleCompleteStage1 = async () => {
    try {
      await completeStage1({ cookItemId: item.cookItemId, performedBy: getPPSUser() } as any).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 1");
    }
  };

  const isComplete = item.status === "cooking_molding_complete";
  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">
              {item.storeName}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5 font-mono">
              {item.cookItemId}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${statusColor}`}
          >
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Flavor / Color info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Flavor</p>
            <p className="font-medium truncate">{item.flavor}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Qty</p>
            <p className="font-medium">
              {item.quantity.toLocaleString()} units
            </p>
          </div>
        </div>

        {/* Flavor components */}
        {item.flavorComponents.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Flavor Components
            </p>
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
            <p className="text-xs text-muted-foreground mb-1.5">
              Color Components
            </p>
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

        {/* Barcode scanner section */}
        {!isComplete && (
          <div className="border-t pt-3 flex flex-col gap-2">
            {scanning ? (
              <div className="flex flex-col gap-2">
                <BarcodeScannerInput
                  value={barcodeInput}
                  onChange={setBarcodeInput}
                  onSubmit={(val) => {
                    setBarcodeInput(val);
                    handleAssignMold();
                  }}
                  placeholder="Scan or type mold barcode..."
                  disabled={isAssigning}
                  mode="barcode"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAssignMold}
                    disabled={!barcodeInput.trim() || isAssigning}
                    className="h-9 flex-1"
                  >
                    {isAssigning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setScanning(false);
                      setBarcodeInput("");
                    }}
                    className="h-9"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScanning(true)}
                className="w-full gap-2"
              >
                <ScanBarcode className="w-4 h-4" />
                Scan Mold Barcode
              </Button>
            )}

            {/* Complete Stage 1 — only if at least 1 mold assigned */}
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
          </div>
        )}

        {/* Completed badge */}
        {isComplete && (
          <div className="border-t pt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Stage 1 complete — {item.assignedMoldIds.length} mold(s) assigned
            </span>
          </div>
        )}

        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </CardContent>
    </Card>
  );
}

// ─── Stage 1 View ──────────────────────────────────────────────────────────────

export default function Stage1View() {
  const isAdmin = isAdminUser();
  const { data, isLoading, isError } = useGetStage1CookItemsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading cook queue…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load Stage 1 cook items. Check your connection and try again.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  if (cookItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <ChefHat className="w-10 h-10 opacity-40" />
        <p className="text-sm">No items in the Stage 1 cook queue.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {cookItems.length} item{cookItems.length !== 1 ? "s" : ""} in queue
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cookItems.map((item) => (
          <CookItemCard key={item._id} item={item} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}
