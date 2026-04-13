"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, Loader2, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Stage2TraySlotProps {
  slotId: string;
  index: number;
  total: number;
  moldId: string;
  isActive: boolean;
  lockedTrayId?: string;
  lockedUnit?: string;
  lockedShelf?: number;
  isProcessing: boolean;
  onSubmit: (trayId: string) => Promise<boolean>;
  onUnprocess?: () => void;
  isUnprocessing?: boolean;
  focusKey?: number;
  compact?: boolean;
}

export default function Stage2TraySlot({
  slotId,
  index,
  total,
  moldId,
  isActive,
  lockedTrayId,
  lockedUnit,
  lockedShelf,
  isProcessing,
  onSubmit,
  onUnprocess,
  isUnprocessing,
  compact,
}: Stage2TraySlotProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = `tray-scanner-${slotId}`;

  useEffect(() => {
    if (!isActive || lockedTrayId || cameraOpen) return;
    inputRef.current?.focus();
    const t1 = setTimeout(() => inputRef.current?.focus(), 100);
    const t2 = setTimeout(() => inputRef.current?.focus(), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    const scanner = new Html5Qrcode(scannerDivId);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w: number, h: number) => ({ width: Math.floor(w * 0.9), height: Math.floor(h * 0.25) }) },
        async (decodedText) => {
          await stopScanner();
          const ok = await onSubmit(decodedText.trim());
          if (ok) { setFlash(true); setTimeout(() => setFlash(false), 700); }
        },
        () => {},
      )
      .catch((err: unknown) => {
        setCameraError(err instanceof Error ? err.message : "Camera access denied");
        setCameraOpen(false);
        scannerRef.current = null;
      });
    return () => {
      if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const handleSubmit = useCallback(async (trayId: string) => {
    const trimmed = trayId.trim();
    if (!trimmed || isProcessing) return;
    const ok = await onSubmit(trimmed);
    if (ok) { setValue(""); setFlash(true); setTimeout(() => setFlash(false), 700); }
  }, [isProcessing, onSubmit]);

  // ── Locked ──
  if (lockedTrayId) {
    return (
      <div className={`flex items-center ${compact ? "gap-3 px-4" : "gap-4 px-5"} py-4 rounded-xs bg-green-50 border border-green-200`}>
        <CheckCircle2 className={`${compact ? "w-7 h-7" : "w-9 h-9"} text-green-600 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-medium`}>
            Tray {index + 1} of {total} · Mold <span className="font-mono">{moldId}</span>
          </p>
          <p className={`${compact ? "text-xl" : "text-2xl"} font-mono font-bold text-green-700 truncate`}>
            {lockedTrayId}
          </p>
          {lockedUnit && (
            <p className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground mt-0.5`}>
              {lockedUnit} · Shelf {lockedShelf}
            </p>
          )}
        </div>
        {onUnprocess && (
          <Button
            type="button" size="sm" variant="ghost"
            className="shrink-0 h-9 w-9 rounded-xs text-muted-foreground hover:text-destructive"
            onClick={onUnprocess} disabled={isUnprocessing} title="Remove tray assignment"
          >
            {isUnprocessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </Button>
        )}
      </div>
    );
  }

  // ── Active / waiting ──
  return (
    <div className={`flex flex-col gap-3 rounded-xs border p-4 transition-colors ${
      flash ? "bg-green-100 border-green-400"
        : isActive ? "border-primary bg-primary/5"
        : "border-muted bg-muted/30 opacity-60"
    }`}>
      <div className="flex items-center justify-between">
        <p className={compact ? "text-sm font-medium text-muted-foreground" : "text-lg font-semibold text-foreground"}>
          Tray {index + 1} of {total}
        </p>
        <span className={`${compact ? "text-xs" : "text-base"} font-mono text-muted-foreground`}>
          Mold: {moldId}
        </span>
      </div>

      {cameraOpen && (
        <div className="relative w-full rounded-xs overflow-hidden border bg-black">
          <div id={scannerDivId} className="w-full" />
          <Button size="sm" variant="secondary" className="absolute top-2 right-2 gap-1 z-10 rounded-xs" onClick={stopScanner}>
            <X className="w-4 h-4" /> Close
          </Button>
          <p className={`text-center ${compact ? "text-xs" : "text-sm"} text-white/70 pb-2`}>
            Point camera at tray barcode
          </p>
        </div>
      )}
      {cameraError && <p className={`${compact ? "text-xs" : "text-base"} text-destructive`}>{cameraError}</p>}

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) handleSubmit(value); }}
          placeholder={isActive ? "Scan tray barcode…" : "Waiting…"}
          disabled={!isActive || isProcessing || cameraOpen}
          className={`${compact ? "text-xl h-14" : "text-2xl h-16"} font-mono rounded-xs flex-1`}
          autoComplete="off"
          autoFocus={isActive}
        />
        <Button
          type="button" variant="outline"
          className={`${compact ? "h-14 w-14" : "h-16 w-16"} shrink-0 rounded-xs`}
          onClick={cameraOpen ? stopScanner : () => { setCameraError(null); setCameraOpen(true); }}
          disabled={!isActive || isProcessing}
        >
          {cameraOpen ? <X className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
        </Button>
      </div>

      {isActive && !cameraOpen && (
        <>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="default" className="flex-1 gap-1.5 rounded-xs"
              onClick={() => { if (value.trim()) handleSubmit(value); }} disabled={!value.trim() || isProcessing}>
              <CheckCircle2 className="w-4 h-4" /> Submit
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5 rounded-xs"
              onClick={() => { setValue(""); inputRef.current?.focus(); }} disabled={!value.trim()}>
              <X className="w-4 h-4" /> Clear
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Press Enter, scan barcode, or tap camera</p>
        </>
      )}
    </div>
  );
}
