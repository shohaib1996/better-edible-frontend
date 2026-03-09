"use client";

import { useState, useRef } from "react";
import Barcode from "react-barcode";
import { Loader2, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGetMoldsQuery,
  useBulkCreateMoldsMutation,
} from "@/redux/api/PrivateLabel/ppsApi";

export default function MoldsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefix, setPrefix] = useState("MOLD");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [unitsPerMold, setUnitsPerMold] = useState("50");
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetMoldsQuery();
  const [bulkCreate, { isLoading: isCreating }] = useBulkCreateMoldsMutation();

  const molds = data?.molds ?? [];
  const availableCount = molds.filter((m) => m.status === "available").length;
  const inUseCount = molds.filter((m) => m.status === "in-use").length;

  const previewCount =
    startNumber && endNumber && Number(endNumber) >= Number(startNumber)
      ? Number(endNumber) - Number(startNumber) + 1
      : null;

  const handleBulkCreate = async () => {
    const start = Number(startNumber);
    const end = Number(endNumber);
    if (!start || !end || end < start) {
      toast.error("Invalid number range");
      return;
    }
    if (end - start + 1 > 200) {
      toast.error("Maximum 200 molds at a time");
      return;
    }
    try {
      const res = await bulkCreate({
        startNumber: start,
        endNumber: end,
        prefix,
        unitsPerMold: Number(unitsPerMold) || 50,
      }).unwrap();
      toast.success(
        `Created ${res.created} mold${res.created !== 1 ? "s" : ""}${res.skipped > 0 ? ` (${res.skipped} skipped)` : ""}`
      );
      setShowAddModal(false);
      setStartNumber("");
      setEndNumber("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create molds");
    }
  };

  const handlePrintAll = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Mold Labels</title>
          <style>
            body { margin: 0; padding: 0; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); }
            .label { border: 1px solid #ccc; padding: 4px; text-align: center;
                     width: 2.625in; height: 1in; page-break-inside: avoid;
                     display: flex; align-items: center; justify-content: center; }
            @page { margin: 0.5in; size: letter; }
          </style>
        </head>
        <body>
          <div class="grid">${printContent.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Molds ({molds.length})</h3>
          <p className="text-sm text-muted-foreground">
            {availableCount} available, {inUseCount} in use
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintAll} disabled={molds.length === 0}>
            <Printer className="w-4 h-4 mr-1" />
            Print All Labels
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Molds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Molds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Prefix</Label>
                    <Input
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="MOLD"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Units Per Mold</Label>
                    <Input
                      type="number"
                      value={unitsPerMold}
                      onChange={(e) => setUnitsPerMold(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Start Number</Label>
                    <Input
                      type="number"
                      value={startNumber}
                      onChange={(e) => setStartNumber(e.target.value)}
                      placeholder="101"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Number</Label>
                    <Input
                      type="number"
                      value={endNumber}
                      onChange={(e) => setEndNumber(e.target.value)}
                      placeholder="150"
                    />
                  </div>
                </div>

                {previewCount !== null && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p>
                      Will create <strong>{previewCount}</strong> mold
                      {previewCount !== 1 ? "s" : ""}:
                    </p>
                    <p className="text-muted-foreground">
                      {prefix}-{startNumber}, {prefix}-{Number(startNumber) + 1}, … {prefix}-{endNumber}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleBulkCreate}
                  disabled={isCreating || !previewCount}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Create Molds
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading molds…</span>
        </div>
      )}

      {/* Mold grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {molds.map((mold) => (
            <Card key={mold._id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{mold.moldId}</span>
                  <Badge
                    variant="outline"
                    className={
                      mold.status === "available"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-red-500/10 text-red-600 border-red-500/20"
                    }
                  >
                    {mold.status}
                  </Badge>
                </div>

                <div className="flex justify-center my-2">
                  <Barcode
                    value={mold.barcodeValue}
                    width={1.5}
                    height={40}
                    fontSize={10}
                    margin={0}
                    displayValue
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {mold.unitsPerMold} units/mold
                </p>
                {mold.status === "in-use" && mold.currentCookItemId && (
                  <p className="text-xs text-muted-foreground text-center truncate">
                    Cook Item: {mold.currentCookItemId}
                  </p>
                )}
                {mold.lastUsedAt && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last used: {new Date(mold.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden print sheet */}
      <div ref={printRef} className="hidden">
        {molds.map((mold) => (
          <div key={mold._id} className="label">
            <Barcode
              value={mold.barcodeValue}
              width={1}
              height={30}
              fontSize={8}
              margin={0}
              displayValue
            />
          </div>
        ))}
      </div>
    </div>
  );
}
