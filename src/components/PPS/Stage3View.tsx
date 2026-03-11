"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Thermometer, Check, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetStage3CookItemsQuery,
  useRemoveTrayMutation,
  useCompleteStage3Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { COOK_ITEM_STATUS_COLORS, COOK_ITEM_STATUS_LABELS } from "@/constants/privateLabel";
import type { IStage3CookItem, ICookItem } from "@/types/privateLabel/pps";
import PrintLabel from "./PrintLabel";

// ─── Live countdown timer ─────────────────────────────────────────────────────

function DehydrationTimer({ expectedEndTime }: { expectedEndTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const update = () => {
      const end = new Date(expectedEndTime).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setTimeLeft("READY");
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
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

// ─── Cook Item Card ────────────────────────────────────────────────────────────

interface CookItemCardProps {
  item: IStage3CookItem;
  isActive: boolean;
  onActivate: () => void;
  onComplete: (cookItem: ICookItem) => void;
}

function CookItemCard({ item, isActive, onActivate, onComplete }: CookItemCardProps) {
  const [trayScanValue, setTrayScanValue] = useState("");

  const [removeTray, { isLoading: isRemoving }] = useRemoveTrayMutation();
  const [completeStage3, { isLoading: isCompleting }] = useCompleteStage3Mutation();

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  const trayIds = item.dehydratorAssignments.map((a) => a.trayId);
  // Derive removed trays from server data so it survives re-renders
  const removedTrayIds = new Set(item.trayRemovalTimestamps.map((t) => t.trayId));
  const allTraysRemoved =
    trayIds.length > 0 && trayIds.every((id) => removedTrayIds.has(id));

  const handleRemoveTray = async (cookItemId: string, trayId: string) => {
    try {
      await removeTray({ cookItemId, trayId }).unwrap();
      toast.success(`Tray ${trayId} removed`);
      setTrayScanValue("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to log tray removal");
    }
  };

  const handleCompleteStage3 = async (cookItemId: string) => {
    try {
      const result = await completeStage3({ cookItemId }).unwrap();
      toast.success("Stage 3 complete");
      onComplete(result.cookItem);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 3");
    }
  };

  return (
    <>
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
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Flavor</p>
              <p className="font-medium truncate">{item.flavor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Qty</p>
              <p className="font-medium">{item.quantity.toLocaleString()}</p>
            </div>
          </div>

          {/* Formulation summary */}
          {item.flavorComponents.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Flavors:{" "}
              {item.flavorComponents
                .map((c) => `${c.name} (${c.percentage}%)`)
                .join(", ")}
            </p>
          )}
          {item.colorComponents.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Colors:{" "}
              {item.colorComponents
                .map((c) => `${c.name} (${c.percentage}%)`)
                .join(", ")}
            </p>
          )}

          {/* Per-mold timer rows */}
          <div className="flex flex-col gap-1">
            {item.molds.map((mold) => (
              <div
                key={mold.moldId}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm font-medium font-mono">
                  {mold.trayId} — {mold.dehydratorUnitId}, Shelf {mold.shelfPosition}
                </span>
                <DehydrationTimer expectedEndTime={mold.dehydrationEndTime} />
              </div>
            ))}
          </div>

          {/* Expand / activate card */}
          {item.allMoldsReady && !isActive && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onActivate}
            >
              Start Removal & Packing
            </Button>
          )}

          {/* Active removal flow */}
          {isActive && (
            <div className="border-t pt-3 flex flex-col gap-3">
              <ol className="text-sm list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>Remove trays from dehydrator units</li>
                <li>Scan each tray QR code to log removal</li>
                <li>Combine all gummies into a container</li>
                <li>Print label and attach to container</li>
              </ol>

              {/* Tray removal status list */}
              <div className="flex flex-col gap-1.5">
                {trayIds.map((trayId) => (
                  <div key={trayId} className="flex items-center gap-2">
                    {removedTrayIds.has(trayId) ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Tray {trayId} removed
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Tray {trayId} — waiting for scan
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Scan input */}
              {!allTraysRemoved && (
                <BarcodeScannerInput
                  value={trayScanValue}
                  onChange={setTrayScanValue}
                  onSubmit={(val) => handleRemoveTray(item.cookItemId, val)}
                  placeholder="Scan tray QR code…"
                  disabled={isRemoving}
                  mode="qr"
                />
              )}

              {/* Complete button */}
              {allTraysRemoved && (
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleCompleteStage3(item.cookItemId)}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Print Label & Complete
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </>
  );
}

// ─── Stage 3 View ─────────────────────────────────────────────────────────────

export default function Stage3View() {
  const [activeCookItemId, setActiveCookItemId] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const handleComplete = (cookItem: ICookItem) => {
    setLabelData(cookItem);
    setShowLabelPreview(true);
  };

  const downloadQR = (cookItemId: string) => {
    const qrCanvas = qrCanvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!qrCanvas) return;
    const padding = 24;
    const qrSize = qrCanvas.width;
    const totalSize = qrSize + padding * 2;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = totalSize;
    outputCanvas.height = totalSize;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalSize, totalSize);
    ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);
    const a = document.createElement("a");
    a.download = `qr-${cookItemId}.png`;
    a.href = outputCanvas.toDataURL("image/png");
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading Stage 3 queue…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load Stage 3 cook items.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  return (
    <>
      {cookItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Thermometer className="w-10 h-10 opacity-40" />
          <p className="text-sm">No items in the dehydrator removal queue.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {cookItems.length} item{cookItems.length !== 1 ? "s" : ""} in dehydrator
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cookItems.map((item) => (
              <CookItemCard
                key={item._id}
                item={item}
                isActive={activeCookItemId === item.cookItemId}
                onActivate={() => setActiveCookItemId(item.cookItemId)}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hidden QR canvas used for download */}
      {labelData && (
        <div ref={qrCanvasRef} className="hidden">
          <QRCodeCanvas
            value={JSON.stringify({ cookItemId: labelData.cookItemId })}
            size={300}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      )}

      {/* Label preview dialog — lives outside the card so it survives card unmount */}
      {labelData && (
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Production Label</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <PrintLabel type="production" data={labelData} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => window.print()}>
                Print Label
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => downloadQR(labelData.cookItemId)}
              >
                <Download className="w-4 h-4" />
                Download QR
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
