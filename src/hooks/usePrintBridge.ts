"use client";

import { useCallback } from "react";
import { toast } from "sonner";

const BRIDGE_URL = process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL ?? "";
const BRIDGE_KEY = process.env.NEXT_PUBLIC_PRINT_BRIDGE_KEY ?? "";

export type PrintLabelType = "tray_label" | "bagging_label" | "case_label";

export interface PrintBridgePayload {
  printerKey: PrintLabelType;
  labelType: PrintLabelType;
  copies?: number;
  data: Record<string, any>;
}

export interface PrintBridgeResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function sendPrintRequest(payload: PrintBridgePayload): Promise<PrintBridgeResult> {
  const res = await fetch(`${BRIDGE_URL}/print`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pps-print-key": BRIDGE_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  const json = await res.json();
  return json as PrintBridgeResult;
}

// ── Check if bridge is configured ────────────────────────────────────────────

export function isPrintBridgeConfigured(): boolean {
  return Boolean(BRIDGE_URL && BRIDGE_KEY);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePrintBridge() {
  const printLabel = useCallback(
    async (payload: PrintBridgePayload): Promise<boolean> => {
      if (!isPrintBridgeConfigured()) {
        // Bridge not configured — caller should fall back to browser print
        return false;
      }

      try {
        const result = await sendPrintRequest(payload);

        if (result.success) {
          toast.success("Label sent to printer");
          return true;
        }

        // Bridge responded but print failed — show specific message
        const errMsg = result.error ?? "Print failed";
        if (errMsg.includes("not found") || errMsg.includes("not configured")) {
          toast.error("Printer not configured — check bridge config.json");
        } else if (errMsg.includes("offline") || errMsg.includes("unavailable")) {
          toast.error("Printer offline — check cable or Bluetooth");
        } else {
          toast.error(`Print failed: ${errMsg}`);
        }
        return false;
      } catch (err: any) {
        // Network error — bridge is unreachable
        const msg: string = err?.message ?? "";
        if (msg.includes("timeout") || msg.includes("fetch") || msg.includes("network")) {
          toast.error("Print bridge offline — check the desktop PC is on");
        } else {
          toast.error("Print bridge unavailable — check desktop PC");
        }
        return false;
      }
    },
    []
  );

  return { printLabel };
}
