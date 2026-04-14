"use client";

/**
 * CameraScanner — inline camera barcode scanner (no modal).
 *
 * Usage:
 *   <CameraScanner onScan={(value) => handleSubmit(value)} />
 *
 * Renders a camera icon button. Clicking it expands an inline camera
 * viewport directly above the input row inside the slot card.
 * On a successful scan the camera closes and onScan fires.
 *
 * Place this inside a parent `flex flex-col gap-2` along with the input,
 * so the viewport appears between elements:
 *
 *   <div className="flex flex-col gap-2">
 *     <CameraScanner onScan={...} />
 *     <div className="flex gap-2">
 *       <Input ... />
 *     </div>
 *   </div>
 *
 * When camera is closed the component renders as just the small camera
 * button in line with the input. When open, the full-width viewport
 * appears above the input row.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";

interface CameraScannerProps {
  /** Called with the scanned value when a barcode is detected. */
  onScan: (value: string) => void;
  /** Optional button size class override (default: w-10 h-10) */
  buttonClassName?: string;
  /** Disabled when the parent input is locked/complete */
  disabled?: boolean;
}

let _instanceCounter = 0;

export default function CameraScanner({ onScan, buttonClassName, disabled }: CameraScannerProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = useRef(`camera-scanner-${++_instanceCounter}`);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* already stopped */ }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    await stopScanner();
    try {
      const scanner = new Html5Qrcode(divId.current);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 180 } },
        (decodedText) => {
          onScan(decodedText.trim());
          stopScanner();
          setOpen(false);
        },
        undefined
      );
    } catch (err: any) {
      setError(err?.message ?? "Camera unavailable");
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    if (open) {
      setTimeout(() => startScanner(), 100);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      {/* Inline camera viewport — full width, above the button */}
      {open && (
        <div className="relative w-full rounded-xs overflow-hidden border bg-black">
          <div id={divId.current} className="w-full" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 gap-1 z-10 rounded-xs"
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
            Close
          </Button>
          <p className="text-center text-xs text-white/70 pb-2">
            Point camera at barcode — it will scan automatically
          </p>
          {error && (
            <p className="text-sm text-destructive px-4 py-2 bg-background">{error}</p>
          )}
        </div>
      )}

      {/* Toggle button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={buttonClassName ?? "w-10 h-10 rounded-xs shrink-0"}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        title={open ? "Close camera" : "Open camera scanner"}
      >
        {open ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
      </Button>
    </div>
  );
}
