"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Thermometer,
  Check,
  Download,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";
import PrintLabel from "@/components/PPS/PrintLabel";
import { QRCodeCanvas } from "qrcode.react";
import {
  useGetStage3CookItemsQuery,
  useRemoveTrayMutation,
  useCompleteStage3Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { COOK_ITEM_STATUS_COLORS, COOK_ITEM_STATUS_LABELS } from "@/constants/privateLabel";
import type { IStage3CookItem, ICookItem } from "@/types/privateLabel/pps";

// ─── Live countdown timer ─────────────────────────────────────────────────────

function DehydrationTimer({ expectedEndTime }: { expectedEndTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expectedEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setTimeLeft("READY");
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
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
  isAdmin: boolean;
  onActivate: () => void;
  onComplete: (cookItem: ICookItem) => void;
}

function CookItemCard({ item, isActive, isAdmin, onActivate, onComplete }: CookItemCardProps) {
  const [trayScanValue, setTrayScanValue] = useState("");
  const [removeTray, { isLoading: isRemoving }] = useRemoveTrayMutation();
  const [completeStage3, { isLoading: isCompleting }] = useCompleteStage3Mutation();

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  const trayIds = item.dehydratorAssignments.map((a) => a.trayId);
  const removedTrayIds = new Set(item.trayRemovalTimestamps.map((t) => t.trayId));
  const allTraysRemoved = trayIds.length > 0 && trayIds.every((id) => removedTrayIds.has(id));

  const handleRemoveTray = async (trayId: string) => {
    try {
      await removeTray({ cookItemId: item.cookItemId, trayId, performedBy: getPPSUser() } as any).unwrap();
      toast.success(`Tray ${trayId} removed`);
      setTrayScanValue("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to log tray removal");
    }
  };

  const handleCompleteStage3 = async () => {
    try {
      const result = await completeStage3({ cookItemId: item.cookItemId, performedBy: getPPSUser() } as any).unwrap();
      toast.success("Stage 3 complete");
      onComplete(result.cookItem);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 3");
    }
  };

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

        {item.flavorComponents.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Flavors:{" "}
            {item.flavorComponents.map((c) => `${c.name} (${c.percentage}%)`).join(", ")}
          </p>
        )}
        {item.colorComponents.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Colors:{" "}
            {item.colorComponents.map((c) => `${c.name} (${c.percentage}%)`).join(", ")}
          </p>
        )}

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

        {item.allMoldsReady && !isActive && (
          <Button variant="outline" size="sm" className="w-full" onClick={onActivate}>
            Start Removal & Packing
          </Button>
        )}

        {isActive && (
          <div className="border-t pt-3 flex flex-col gap-3">
            <ol className="text-sm list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Remove trays from dehydrator units</li>
              <li>Scan each tray QR code to log removal</li>
              <li>Combine all gummies into a container</li>
              <li>Print label and attach to container</li>
            </ol>

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

            {!allTraysRemoved && (
              <BarcodeScannerInput
                value={trayScanValue}
                onChange={setTrayScanValue}
                onSubmit={handleRemoveTray}
                placeholder="Scan tray QR code…"
                disabled={isRemoving}
                mode="qr"
              />
            )}

            {allTraysRemoved && (
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleCompleteStage3}
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

        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </CardContent>
    </Card>
  );
}

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function WorkerStage3OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const [activeCookItemId, setActiveCookItemId] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

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
          onClick={() => router.push("/pps")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Thermometer className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">
              {storeName ?? "Stage 3 — Container & Label"}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Thermometer className="w-10 h-10 opacity-40" />
          <p className="text-sm">
            No Stage 3 items found for order {decodedOrderId}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {orderItems.length} item{orderItems.length !== 1 ? "s" : ""} in this order
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderItems.map((item) => (
              <CookItemCard
                key={item._id}
                item={item}
                isActive={activeCookItemId === item.cookItemId}
                isAdmin={isAdmin}
                onActivate={() => setActiveCookItemId(item.cookItemId)}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
