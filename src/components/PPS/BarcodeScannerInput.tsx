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
  /** "barcode" shows Code128-style hint, "qr" shows*/
  mode?: "barcode" | "qr";
}

const SCANNER_DIV_ID = "html5-qrcode-scanner";

export default function BarcodeScannerInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Scan or type…",
  disabled = false,
  className = "",
  mode = "qr",
}: BarcodeScannerInputProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startScanner = async () => {
    setCameraError(null);
    setCameraOpen(true);
  };

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

  // Autofocus the text input when it first appears
  useEffect(() => {
    if (!cameraOpen) {
      inputRef.current?.focus();
    }
  }, [cameraOpen]);

  // Mount scanner after the div is rendered
  useEffect(() => {
    if (!cameraOpen) return;

    const scanner = new Html5Qrcode(SCANNER_DIV_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Success — fill input and submit
          onChange(decodedText);
          stopScanner().then(() => {
            onSubmit(decodedText);
          });
        },
        () => {
          // scan frame error — ignore
        },
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Camera access denied";
        setCameraError(msg);
        setCameraOpen(false);
        scannerRef.current = null;
      });

    return () => {
      // cleanup on unmount
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
      {/* Camera overlay */}
      {cameraOpen && (
        <div className="relative w-full rounded-lg overflow-hidden border bg-black">
          <div id={SCANNER_DIV_ID} className="w-full" />
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 gap-1 z-10"
            onClick={stopScanner}
          >
            <X className="w-4 h-4" />
            Close
          </Button>
          <p className="text-center text-xs text-white/70 pb-2">
            {mode === "barcode"
              ? "Point camera at barcode"
              : "Point camera at QR code"}
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
          className="font-mono text-sm h-9 flex-1"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 px-3 shrink-0"
          onClick={cameraOpen ? stopScanner : startScanner}
          disabled={disabled}
          title={cameraOpen ? "Close camera" : "Use camera to scan"}
        >
          {cameraOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
