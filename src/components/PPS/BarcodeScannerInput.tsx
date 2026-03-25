"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BarcodeScannerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** "barcode" shows Code128-style scan box, "qr" shows square box */
  mode?: "barcode" | "qr";
  inputClassName?: string;
}

let _bsiCounter = 0;

export default function BarcodeScannerInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Scan or type…",
  disabled = false,
  className = "",
  mode = "qr",
  inputClassName = "font-mono text-sm h-9",
}: BarcodeScannerInputProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const divId = useRef(`bsi-scanner-${++_bsiCounter}`);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // already stopped
      }
      scannerRef.current = null;
    }
    setCameraOpen(false);
  };

  const startScanner = async () => {
    setCameraError(null);
    setCameraOpen(true);
  };

  // Autofocus text input when camera closes
  useEffect(() => {
    if (!cameraOpen) {
      inputRef.current?.focus();
    }
  }, [cameraOpen]);

  // Mount scanner after the div is rendered
  useEffect(() => {
    if (!cameraOpen) return;

    const scanner = new Html5Qrcode(divId.current);
    scannerRef.current = scanner;

    const isBarcode = mode === "barcode";

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: isBarcode
            ? (viewfinderWidth: number, viewfinderHeight: number) => ({
                width: Math.floor(viewfinderWidth * 0.9),
                height: Math.floor(viewfinderHeight * 0.25),
              })
            : { width: 250, height: 250 },
        },
        (decodedText) => {
          onChange(decodedText);
          stopScanner().then(() => {
            onSubmit(decodedText);
          });
        },
        () => { /* scan frame error — ignore */ },
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Camera access denied";
        setCameraError(msg);
        setCameraOpen(false);
        scannerRef.current = null;
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Inline camera viewport */}
      {cameraOpen && (
        <div className="relative w-full rounded-xs overflow-hidden border bg-black">
          <div id={divId.current} className="w-full" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 gap-1 z-10 rounded-xs"
            onClick={stopScanner}
          >
            <X className="w-4 h-4" />
            Close
          </Button>
          <p className="text-center text-xs text-white/70 pb-2">
            {mode === "barcode" ? "Point camera at barcode" : "Point camera at QR code"}
          </p>
        </div>
      )}

      {cameraError && <p className="text-xs text-destructive">{cameraError}</p>}

      {/* Input row */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || cameraOpen}
          className={`flex-1 rounded-xs ${inputClassName}`}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 px-3 shrink-0 rounded-xs"
          onClick={cameraOpen ? stopScanner : startScanner}
          disabled={disabled}
          title={cameraOpen ? "Close camera" : "Use camera to scan"}
        >
          {cameraOpen ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
