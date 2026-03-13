"use client";

import { useState } from "react";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "./CookItemHistory";
import {
  Loader2,
  Wind,
  ScanLine,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BarcodeScannerInput from "./BarcodeScannerInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  useGetStage2CookItemsQuery,
  useProcessMoldMutation,
  useGetNextAvailableShelfQuery,
} from "@/redux/api/PrivateLabel/ppsApi";
import { COOK_ITEM_STATUS_COLORS, COOK_ITEM_STATUS_LABELS } from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Process Mold Form ─────────────────────────────────────────────────────────

interface ProcessMoldFormProps {
  cookItemId: string;
  moldIds: string[];
  processedMoldIds: string[];
}

function ProcessMoldForm({ cookItemId, moldIds, processedMoldIds }: ProcessMoldFormProps) {
  const performedBy = getPPSUser();
  const [moldId, setMoldId] = useState("");
  const [trayId, setTrayId] = useState("");
  const [dehydratorUnitId, setDehydratorUnitId] = useState("");
  const [shelfPosition, setShelfPosition] = useState("");

  const { data: nextShelf } = useGetNextAvailableShelfQuery();
  const [processMold, { isLoading }] = useProcessMoldMutation();

  // Pre-fill dehydrator info from next available shelf suggestion
  const prefillNextShelf = () => {
    if (nextShelf) {
      setDehydratorUnitId(nextShelf.dehydratorUnitId);
      setShelfPosition(String(nextShelf.shelfPosition));
    }
  };

  const handleSubmit = async () => {
    const pos = parseInt(shelfPosition, 10);
    if (!moldId || !trayId || !dehydratorUnitId || isNaN(pos)) return;
    try {
      await processMold({
        cookItemId,
        moldId: moldId.trim(),
        trayId: trayId.trim(),
        dehydratorUnitId: dehydratorUnitId.trim(),
        shelfPosition: pos,
        performedBy,
      } as any).unwrap();
      // Reset form
      setMoldId("");
      setTrayId("");
      setDehydratorUnitId("");
      setShelfPosition("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Mold, tray, or shelf already in use");
    }
  };

  const unprocessed = moldIds.filter((id) => !processedMoldIds.includes(id));

  if (unprocessed.length === 0) return null;

  return (
    <div className="border rounded-lg p-3 bg-muted/30 flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Process a Mold → Tray → Shelf
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-xs mb-1 block">Mold ID (barcode)</Label>
          <BarcodeScannerInput
            value={moldId}
            onChange={setMoldId}
            onSubmit={setMoldId}
            placeholder="Scan or type mold ID…"
            mode="barcode"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs mb-1 block">Tray ID (QR code)</Label>
          <BarcodeScannerInput
            value={trayId}
            onChange={setTrayId}
            onSubmit={setTrayId}
            placeholder="Scan or type tray ID…"
            mode="qr"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Dehydrator Unit ID</Label>
          <Input
            value={dehydratorUnitId}
            onChange={(e) => setDehydratorUnitId(e.target.value)}
            placeholder="Unit ID…"
            className="h-8 text-sm font-mono"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Shelf Position</Label>
          <Input
            type="number"
            value={shelfPosition}
            onChange={(e) => setShelfPosition(e.target.value)}
            placeholder="1–20"
            min={1}
            max={20}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {nextShelf && (
          <Button
            variant="outline"
            size="sm"
            onClick={prefillNextShelf}
            className="h-8 text-xs gap-1"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Use Next Available Shelf
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={
            isLoading ||
            !moldId.trim() ||
            !trayId.trim() ||
            !dehydratorUnitId.trim() ||
            !shelfPosition
          }
          className="h-8 gap-1 ml-auto"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Load to Dehydrator"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Cook Item Card ────────────────────────────────────────────────────────────

function CookItemCard({ item, isAdmin }: { item: ICookItem; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const processedMoldIds = item.dehydratorAssignments.map((a) => a.moldId);
  const allProcessed =
    item.assignedMoldIds.length > 0 &&
    item.assignedMoldIds.every((id) => processedMoldIds.includes(id));

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{item.storeName}</CardTitle>
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
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Flavor</p>
            <p className="font-medium truncate">{item.flavor}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Molds</p>
            <p className="font-medium">
              {processedMoldIds.length} / {item.assignedMoldIds.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Qty</p>
            <p className="font-medium">{item.quantity.toLocaleString()}</p>
          </div>
        </div>

        {/* Already loaded assignments */}
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
                      Unit {a.dehydratorUnitId} Shelf {a.shelfPosition}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All processed */}
        {allProcessed ? (
          <div className="flex items-center gap-2 text-green-600 text-sm border-t pt-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>All molds loaded into dehydrator</span>
          </div>
        ) : (
          <div className="border-t pt-3">
            <ProcessMoldForm
              cookItemId={item.cookItemId}
              moldIds={item.assignedMoldIds}
              processedMoldIds={processedMoldIds}
            />
          </div>
        )}

        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </CardContent>
    </Card>
  );
}

// ─── Stage 2 View ──────────────────────────────────────────────────────────────

export default function Stage2View() {
  const isAdmin = isAdminUser();
  const { data, isLoading, isError } = useGetStage2CookItemsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading Stage 2 queue…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load Stage 2 cook items.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  if (cookItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Wind className="w-10 h-10 opacity-40" />
        <p className="text-sm">No items ready for dehydrator loading.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {cookItems.length} item{cookItems.length !== 1 ? "s" : ""} awaiting dehydrator loading
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cookItems.map((item) => (
          <CookItemCard key={item._id} item={item} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}
