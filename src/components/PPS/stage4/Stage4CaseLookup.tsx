"use client";

import { useState, useCallback } from "react";
import { Loader2, ScanLine } from "lucide-react";
import BarcodeScannerInput from "../shared/BarcodeScannerInput";
import { Button } from "@/components/ui/button";
import { useGetCaseByIdQuery } from "@/redux/api/PrivateLabel/ppsApi";
import type { ICase } from "@/types/privateLabel/pps";

export default function Stage4CaseLookup() {
  const [open, setOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [lookedUpId, setLookedUpId] = useState<string | null>(null);

  const { data, isFetching, isError } = useGetCaseByIdQuery(lookedUpId!, {
    skip: !lookedUpId,
  });
  const caseData: ICase | null = data?.case ?? null;

  const handleLookup = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setScanValue("");
    // QR codes encode JSON { caseId, cookItemId } — try to parse, else use raw as caseId
    try {
      const parsed = JSON.parse(trimmed);
      setLookedUpId(parsed.caseId ?? trimmed);
    } catch {
      setLookedUpId(trimmed);
    }
  }, []);

  const handleReset = useCallback(() => {
    setLookedUpId(null);
    setScanValue("");
  }, []);

  return (
    <div className="rounded-xs border bg-card">
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-muted-foreground shrink-0" />
          <span className="text-lg font-semibold">Look up a case</span>
        </div>
        <span className="text-base text-muted-foreground">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="border-t px-5 py-4 flex flex-col gap-3">
          {!caseData && (
            <>
              <BarcodeScannerInput
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleLookup}
                placeholder="Scan case QR or type Case ID…"
                disabled={isFetching}
                autoFocus
                mode="qr"
                inputClassName="text-base font-mono h-12"
              />
              {isError && lookedUpId && (
                <p className="text-sm text-destructive">
                  Case not found — check the ID and try again.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Scan the QR on a case label, or type the Case ID and press Enter
              </p>
            </>
          )}

          {isFetching && (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Looking up case…
            </div>
          )}

          {caseData && !isFetching && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold">{caseData.storeName}</p>
                <p className="text-xl font-medium text-muted-foreground">
                  {caseData.flavor}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-0 border rounded-xs divide-x">
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">
                    Units
                  </p>
                  <p className="text-3xl font-bold">{caseData.unitCount}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">
                    Status
                  </p>
                  <p className="text-3xl font-bold capitalize">
                    {caseData.status.replace("-", " ")}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xs p-3 text-sm font-mono space-y-1 text-muted-foreground">
                <p>
                  Case {caseData.caseNumber} of {caseData.totalCasesForItem}
                </p>
                <p>Case ID: {caseData.caseId}</p>
                <p>Cook Item: {caseData.cookItemId}</p>
                <p>Order: {caseData.orderId}</p>
                <p>
                  Packed:{" "}
                  {new Date(caseData.labelPrintTimestamp).toLocaleString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xs text-lg h-14"
                onClick={handleReset}
              >
                <ScanLine className="w-5 h-5 mr-2" /> Scan another case
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
