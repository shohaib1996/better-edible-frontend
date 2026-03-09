"use client";

import { useState } from "react";
import { Loader2, ChevronUp, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import BarcodeScannerInput from "./BarcodeScannerInput";
import { Card, CardContent } from "@/components/ui/card";
import {
  useScanContainerMutation,

  useConfirmCountMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import type { ICookItem, IConfirmCountResponse } from "@/types/privateLabel/pps";
import PrintLabel from "./PrintLabel";

type Step = "scan" | "info" | "count" | "result";

export default function Stage4View() {
  const [step, setStep] = useState<Step>("scan");
  const [qrScanValue, setQrScanValue] = useState("");
  const [scannedCookItem, setScannedCookItem] = useState<
    (Partial<ICookItem> & { numberOfMolds: number }) | null
  >(null);
  const [count, setCount] = useState(0);
  const [confirmResult, setConfirmResult] = useState<IConfirmCountResponse | null>(null);

  const [scanContainer, { isLoading: isScanning }] = useScanContainerMutation();
  const [confirmCount, { isLoading: isConfirming }] = useConfirmCountMutation();

  const handleScanContainer = async (qrData: string) => {
    try {
      const result = await scanContainer({ qrCodeData: qrData }).unwrap();
      setScannedCookItem(result.cookItem);
      setStep("info");
      setQrScanValue("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to scan container");
      setQrScanValue("");
    }
  };

  const handleConfirmCount = async (cookItemId: string, actualCount: number) => {
    try {
      const result = await confirmCount({ cookItemId, actualCount }).unwrap();
      setConfirmResult(result);
      setStep("result");
      toast.success("Count confirmed — cases created");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to confirm count");
    }
  };

  const resetToScan = () => {
    setStep("scan");
    setQrScanValue("");
    setScannedCookItem(null);
    setCount(0);
    setConfirmResult(null);
  };

  // ── Step 1: Scan ─────────────────────────────────────────────────────────────
  if (step === "scan") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl font-semibold">
            Scan container QR code to begin packaging
          </h2>
          <p className="text-sm text-muted-foreground">
            Point scanner at the QR code on the container
          </p>
        </div>
        <BarcodeScannerInput
          value={qrScanValue}
          onChange={setQrScanValue}
          onSubmit={(val) => handleScanContainer(val)}
          placeholder="Scan QR code…"
          disabled={isScanning}
          mode="qr"
          className="max-w-md w-full"
        />
        {isScanning && (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  // ── Step 2: Info ─────────────────────────────────────────────────────────────
  if (step === "info" && scannedCookItem) {
    const expectedCount = scannedCookItem.expectedCount ?? 0;
    const fullCases = Math.floor(expectedCount / 100);
    const partialUnits = expectedCount % 100;

    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-bold">{scannedCookItem.storeName}</h3>
            <h4 className="text-xl">{scannedCookItem.flavor}</h4>
            <p className="text-muted-foreground">{scannedCookItem.productType}</p>

            <div className="bg-muted/50 rounded-lg p-3">
              <p>
                Expected:{" "}
                <strong>{expectedCount.toLocaleString()} units</strong>{" "}
                <span className="text-muted-foreground text-sm">
                  ({scannedCookItem.numberOfMolds} mold
                  {scannedCookItem.numberOfMolds !== 1 ? "s" : ""})
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Steps:</p>
              <ol className="list-decimal pl-4 text-sm space-y-1 text-muted-foreground">
                <li>Bag each gummy individually (retail bags)</li>
                <li>Seal each bag</li>
                <li>Count and confirm total</li>
              </ol>
            </div>

            <p className="text-sm text-muted-foreground">
              Expected:{" "}
              {fullCases > 0
                ? `${fullCases} full case${fullCases !== 1 ? "s" : ""}`
                : ""}
              {fullCases > 0 && partialUnits > 0 ? " + " : ""}
              {partialUnits > 0 ? `1 partial (${partialUnits} units)` : ""}
            </p>

            <Button
              className="w-full"
              onClick={() => {
                setCount(expectedCount);
                setStep("count");
              }}
            >
              Ready to Count
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 3: Count ─────────────────────────────────────────────────────────────
  if (step === "count" && scannedCookItem) {
    const fullCases = Math.floor(count / 100);
    const partialCase = count % 100;
    const totalCases = fullCases + (partialCase > 0 ? 1 : 0);

    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-center text-lg font-semibold mb-2">
              Confirm Actual Count
            </h3>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Expected: {scannedCookItem.expectedCount?.toLocaleString()} units
            </p>

            {/* Touch-friendly counter */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <Button
                variant="outline"
                className="w-20 h-20 rounded-lg"
                onClick={() => setCount((c) => c + 1)}
              >
                <ChevronUp className="w-10 h-10" />
              </Button>

              <div className="text-5xl font-bold tabular-nums select-none">
                {count}
              </div>

              <Button
                variant="outline"
                className="w-20 h-20 rounded-lg"
                onClick={() => setCount((c) => Math.max(0, c - 1))}
              >
                <ChevronDown className="w-10 h-10" />
              </Button>
            </div>

            {/* Case breakdown */}
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm space-y-0.5">
              <p className="text-muted-foreground">Case Breakdown:</p>
              {fullCases > 0 && (
                <p>
                  — {fullCases} full case{fullCases !== 1 ? "s" : ""} of 100
                  units
                </p>
              )}
              {partialCase > 0 && (
                <p>— 1 partial case of {partialCase} units</p>
              )}
              <p className="font-medium mt-1">
                Total: {totalCases} case{totalCases !== 1 ? "s" : ""}
              </p>
            </div>

            <Button
              className="w-full"
              disabled={isConfirming || count === 0}
              onClick={() =>
                handleConfirmCount(scannedCookItem.cookItemId!, count)
              }
            >
              {isConfirming && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Submit Count
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 4: Result ────────────────────────────────────────────────────────────
  if (step === "result" && confirmResult) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Order completion status */}
            {confirmResult.orderStatus.isComplete ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-green-600">
                  ORDER COMPLETE
                </h3>
                <p className="text-sm text-green-600">
                  Order {confirmResult.orderStatus.orderId} — All items
                  packaged!
                </p>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <p className="font-medium">
                  Order {confirmResult.orderStatus.orderId}:{" "}
                  {confirmResult.orderStatus.completedItems} /{" "}
                  {confirmResult.orderStatus.totalItems} items complete
                </p>
              </div>
            )}

            {/* Case labels */}
            <h3 className="font-semibold">
              Case Labels ({confirmResult.cases.length})
            </h3>
            <div className="flex flex-col gap-3">
              {confirmResult.cases.map((c) => (
                <div key={c.caseId} className="border rounded-lg p-3">
                  <PrintLabel type="case" data={c.labelData} />
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={() => window.print()}>
              Print Case Labels
            </Button>

            <Button variant="outline" className="w-full" onClick={resetToScan}>
              Scan Next Container
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
