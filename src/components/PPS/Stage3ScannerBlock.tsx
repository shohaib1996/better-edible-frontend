"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, Camera, X, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PrintLabel from "@/components/PPS/PrintLabel";
import Barcode from "react-barcode";
import { getPPSUser } from "@/lib/ppsUser";
import { useStartBaggingMutation } from "@/redux/api/PrivateLabel/ppsApi";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Stage3ScannerBlockProps {
  /** cook items for this order, used to look up scanned IDs */
  orderItems: ICookItem[];
  /** Unique DOM id for the Html5Qrcode scanner div — must differ per page */
  scannerId: string;
  /** Label page size passed to @page CSS (e.g. "4in 2in" or "4in 6in") */
  labelPageSize?: string;
  /** Label type passed to PrintLabel */
  labelType?: "bagging" | "production";
  /** Compact = admin layout: smaller scanner text, show Download Barcode button */
  compact?: boolean;
}

export default function Stage3ScannerBlock({
  orderItems,
  scannerId,
  labelPageSize = "4in 2in",
  labelType = "bagging",
  compact,
}: Stage3ScannerBlockProps) {
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const printLabelRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [labelData, setLabelData] = useState<ICookItem | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

  const [startBagging] = useStartBaggingMutation();

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

  const printLabel = useCallback((cookItem: ICookItem) => {
    setLabelData(cookItem);
    setShowLabelPreview(true);
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
    @page { size: ${labelPageSize}; margin: 0; }
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
  }, [labelPageSize]);

  const handleScan = useCallback(async (scannedValue: string) => {
    const cookItemId = scannedValue.trim();
    if (!cookItemId) return;

    const item = orderItems.find((i) => i.cookItemId === cookItemId);
    if (!item) {
      toast.error(`Item "${cookItemId}" not found in this order`);
      setTimeout(() => scanInputRef.current?.focus(), 50);
      return;
    }

    const performedBy = getPPSUser() as any;

    if (item.status === "demolding_complete") {
      try {
        const result = await startBagging({ cookItemId, performedBy }).unwrap();
        toast.success(`${item.flavor} — bagging started, printing label`);
        printLabel(result.cookItem);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to start bagging");
      }
    } else if (item.status === "bagging") {
      toast.info(`${item.flavor} is bagging — use the Finish Bagging button on the card`);
    } else if (item.status === "sealing") {
      toast.info(`${item.flavor} is sealing — use the Finish Sealing button on the card`);
    } else if (item.status === "bag_seal_complete") {
      toast.info(`${item.flavor} is already complete`);
    } else {
      toast.error(`${item.flavor} status is "${item.status}" — not ready for bag & seal`);
    }

    setTimeout(() => scanInputRef.current?.focus(), 50);
  }, [orderItems, startBagging, printLabel]);

  useEffect(() => {
    if (!cameraOpen) return;
    const scanner = new Html5Qrcode(scannerId);
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

  return (
    <>
      {/* ── Scanner card ── */}
      <div className="mb-6 rounded-xs border bg-card p-4 flex flex-col gap-3">
        <div className={`flex items-center gap-2 ${compact ? "text-sm" : "text-base"} font-semibold text-foreground`}>
          <ScanLine className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
          Scan container barcode
        </div>
        <div className={`bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 ${compact ? "text-sm" : "text-base"} text-amber-800`}>
          Scan barcode on bag → start bagging &amp; print label · Use buttons on card to finish bagging &amp; sealing
        </div>
        {cameraOpen && (
          <div className="relative w-full rounded-xs overflow-hidden border bg-black">
            <div id={scannerId} className="w-full" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2 gap-1 z-10 rounded-xs"
              onClick={stopCamera}
            >
              <X className="w-4 h-4" /> Close
            </Button>
            <p className="text-center text-xs text-white/70 pb-2">Point camera at barcode</p>
          </div>
        )}
        {cameraError && (
          <p className={`${compact ? "text-xs" : "text-sm"} text-destructive`}>{cameraError}</p>
        )}
        <div className="flex gap-2">
          <input
            ref={scanInputRef}
            autoFocus
            type="text"
            value={scanBuffer}
            onChange={(e) => setScanBuffer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleScan(scanBuffer);
                setScanBuffer("");
              }
            }}
            placeholder="Scan or type cook item ID…"
            disabled={cameraOpen}
            className={`flex-1 rounded-xs border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
              compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-lg"
            }`}
          />
          <Button
            type="button"
            variant="outline"
            className={`h-auto ${compact ? "px-3" : "px-4"} rounded-xs shrink-0`}
            onClick={cameraOpen ? stopCamera : startCamera}
          >
            {cameraOpen
              ? <X className={compact ? "w-4 h-4" : "w-6 h-6"} />
              : <Camera className={compact ? "w-4 h-4" : "w-6 h-6"} />}
          </Button>
        </div>
      </div>

      {/* Hidden barcode for download (admin only) */}
      {compact && labelData && (
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
          <PrintLabel type={labelType} data={labelData} />
        </div>
      )}

      {/* Label preview dialog */}
      {labelData && (
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-lg rounded-xs">
            <DialogHeader>
              <DialogTitle className={compact ? undefined : "text-2xl"}>
                {compact ? "Production Label" : "Bagging Label"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <PrintLabel type={labelType} data={labelData} />
            </div>
            <div className={compact ? "flex gap-2" : undefined}>
              <Button
                className={`${compact ? "flex-1" : "w-full"} rounded-xs ${compact ? "" : "text-xl h-14"}`}
                onClick={() => printLabel(labelData)}
              >
                Print Label
              </Button>
              {compact && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 rounded-xs"
                  onClick={() => downloadBarcode(labelData.cookItemId)}
                >
                  <Download className="w-4 h-4" />
                  Download Barcode
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
