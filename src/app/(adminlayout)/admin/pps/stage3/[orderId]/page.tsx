"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  PackageCheck,
  CheckCircle2,
  Loader2,
  Download,
  ScanLine,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPPSUser, isAdminUser } from "@/lib/ppsUser";
import PrintLabel from "@/components/PPS/PrintLabel";
import Barcode from "react-barcode";
import {
  useGetStage3CookItemsQuery,
  useStartBaggingMutation,
  useStartSealingMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { Stage3CookItemCard } from "@/components/PPS/Stage3CookItemCard";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function Stage3OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const printLabelRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, []);

  const startCamera = useCallback(() => {
    setCameraError(null);
    setCameraOpen(true);
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    const scanner = new Html5Qrcode("stage3-admin-scanner");
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: (w: number, h: number) => ({
          width: Math.min(Math.floor(w * 0.9), 600),
          height: Math.min(Math.floor(h * 0.25), 120),
        }),
      },
      (decoded) => {
        stopCamera().then(() => handleScan(decoded));
      },
      () => {},
    ).catch((err: unknown) => {
      setCameraError(err instanceof Error ? err.message : "Camera access denied");
      setCameraOpen(false);
      scannerRef.current = null;
    });
    return () => {
      if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const [startBagging] = useStartBaggingMutation();
  const [startSealing] = useStartSealingMutation();

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;
  const allComplete = orderItems.length > 0 && orderItems.every((i) => i.status === "bag_seal_complete");

  const printLabel = useCallback((cookItem: ICookItem) => {
    setLabelData(cookItem);
    setShowLabelPreview(true);
    // Give React a tick to render the hidden label before printing
    setTimeout(() => {
      const labelEl = printLabelRef.current;
      if (!labelEl) return;
      const labelHtml = labelEl.innerHTML;
      const win = window.open("", "_blank", "width=600,height=700");
      if (!win) return;
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 4in; font-family: sans-serif; }
  </style>
</head>
<body>${labelHtml}</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    }, 100);
  }, []);

  const handleScan = useCallback(async (scannedValue: string) => {
    const cookItemId = scannedValue.trim();
    if (!cookItemId) return;

    const item = orderItems.find((i) => i.cookItemId === cookItemId);
    if (!item) {
      toast.error(`Item "${cookItemId}" not found in this order`);
      return;
    }

    const performedBy = getPPSUser();

    if (item.status === "demolding_complete") {
      try {
        await startBagging({ cookItemId, performedBy }).unwrap();
        toast.success(`${item.flavor} — bagging started`);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to start bagging");
      }
    } else if (item.status === "bagging") {
      try {
        const result = await startSealing({ cookItemId, performedBy }).unwrap();
        toast.success(`${item.flavor} — sealing started, printing label`);
        printLabel(result.cookItem);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to start sealing");
      }
    } else if (item.status === "sealing") {
      toast.info(`${item.flavor} is sealing — use the Finish button on the card`);
    } else if (item.status === "bag_seal_complete") {
      toast.info(`${item.flavor} is already complete`);
    } else {
      toast.error(`${item.flavor} status is "${item.status}" — not ready for bag & seal`);
    }

    // Return focus to scanner
    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, [orderItems, startBagging, startSealing, printLabel]);

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan(scanBuffer);
      setScanBuffer("");
    }
  };

  const downloadBarcode = (cookItemId: string) => {
    const svgEl = barcodeRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `barcode-${cookItemId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
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
          onClick={() => router.push("/admin/pps")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <PackageCheck className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 3 — Bag & Seal"}
            </h1>
            <p className="text-base text-muted-foreground font-mono">
              Order {decodedOrderId}
            </p>
          </div>
        </div>
      </div>

      {/* Scanner input */}
      <div className="mb-6 rounded-xs border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ScanLine className="w-4 h-4 text-primary" />
          Scan container barcode
        </div>
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
          Scan once → start bagging · Scan again → start sealing & print label
        </div>
        {cameraOpen && (
          <div className="relative w-full rounded-xs overflow-hidden border bg-black">
            <div id="stage3-admin-scanner" className="w-full" />
            <Button type="button" size="sm" variant="secondary" className="absolute top-2 right-2 gap-1 z-10 rounded-xs" onClick={stopCamera}>
              <X className="w-4 h-4" /> Close
            </Button>
            <p className="text-center text-xs text-white/70 pb-2">Point camera at barcode</p>
          </div>
        )}
        {cameraError && <p className="text-xs text-destructive">{cameraError}</p>}
        <div className="flex gap-2">
          <input
            ref={scanInputRef}
            autoFocus
            type="text"
            value={scanBuffer}
            onChange={(e) => setScanBuffer(e.target.value)}
            onKeyDown={handleScanInput}
            placeholder="Scan or type cook item ID…"
            disabled={cameraOpen}
            className="flex-1 rounded-xs border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button type="button" variant="outline" className="h-auto px-3 rounded-xs shrink-0" onClick={cameraOpen ? stopCamera : startCamera}>
            {cameraOpen ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <PackageCheck className="w-10 h-10 opacity-40" />
          <p className="text-base">No bag & seal items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {allComplete && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <p className="text-xl font-semibold">All items sealed — ready for packaging</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <Stage3CookItemCard
                key={item._id}
                item={item}
                isAdmin={isAdmin}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hidden barcode for download */}
      {labelData && (
        <div
          ref={barcodeRef}
          style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}
        >
          <Barcode
            value={labelData.cookItemId}
            format="CODE128"
            width={3}
            height={100}
            displayValue={true}
            fontSize={14}
            margin={10}
            background="#ffffff"
            lineColor="#000000"
          />
        </div>
      )}

      {/* Hidden label for print */}
      {labelData && (
        <div
          ref={printLabelRef}
          style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}
        >
          <PrintLabel type="production" data={labelData} />
        </div>
      )}

      {/* Label preview dialog */}
      {labelData && (
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-lg rounded-xs">
            <DialogHeader>
              <DialogTitle>Production Label</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <PrintLabel type="production" data={labelData} />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 rounded-xs"
                onClick={() => {
                  const labelEl = printLabelRef.current;
                  if (!labelEl) return;
                  const labelHtml = labelEl.innerHTML;
                  const win = window.open("", "_blank", "width=600,height=700");
                  if (!win) return;
                  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 4in; font-family: sans-serif; }
  </style>
</head>
<body>${labelHtml}</body>
</html>`);
                  win.document.close();
                  win.focus();
                  setTimeout(() => { win.print(); win.close(); }, 300);
                }}
              >
                Print Label
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xs"
                onClick={() => downloadBarcode(labelData.cookItemId)}
              >
                <Download className="w-4 h-4" />
                Download Barcode
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
