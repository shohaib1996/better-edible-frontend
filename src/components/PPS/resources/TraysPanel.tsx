"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  useGetDehydratorTraysQuery,
  useBulkCreateTraysMutation,
} from "@/redux/api/PrivateLabel/ppsApi";

export default function TraysPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefix, setPrefix] = useState("TRAY");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetDehydratorTraysQuery();
  const [bulkCreate, { isLoading: isCreating }] = useBulkCreateTraysMutation();

  const trays = data?.trays ?? [];
  const availableCount = trays.filter((t) => t.status === "available").length;
  const inUseCount = trays.filter((t) => t.status === "in-use").length;

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
      toast.error("Maximum 200 trays at a time");
      return;
    }
    try {
      const res = await bulkCreate({ startNumber: start, endNumber: end, prefix }).unwrap();
      toast.success(
        `Created ${res.created} tray${res.created !== 1 ? "s" : ""}${res.skipped > 0 ? ` (${res.skipped} skipped)` : ""}`
      );
      setShowAddModal(false);
      setStartNumber("");
      setEndNumber("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create trays");
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
          <title>Tray Labels</title>
          <style>
            body { margin: 0; padding: 0; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); }
            .label { border: 1px solid #ccc; padding: 8px; text-align: center;
                     width: 4in; height: 2in; page-break-inside: avoid;
                     display: flex; flex-direction: column; align-items: center;
                     justify-content: center; gap: 4px; font-family: monospace; }
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
          <h3 className="font-medium">Trays ({trays.length})</h3>
          <p className="text-sm text-muted-foreground">
            {availableCount} available, {inUseCount} in use
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintAll} disabled={trays.length === 0}>
            <Printer className="w-4 h-4 mr-1" />
            Print All Labels
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Trays
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Trays</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-1 block">Prefix</Label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="TRAY"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Start Number</Label>
                    <Input
                      type="number"
                      value={startNumber}
                      onChange={(e) => setStartNumber(e.target.value)}
                      placeholder="501"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Number</Label>
                    <Input
                      type="number"
                      value={endNumber}
                      onChange={(e) => setEndNumber(e.target.value)}
                      placeholder="550"
                    />
                  </div>
                </div>

                {previewCount !== null && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p>
                      Will create <strong>{previewCount}</strong> tray
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
                  Create Trays
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
          <span>Loading trays…</span>
        </div>
      )}

      {/* Tray grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {trays.map((tray) => (
            <Card key={tray._id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{tray.trayId}</span>
                  <Badge
                    variant="outline"
                    className={
                      tray.status === "available"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-red-500/10 text-red-600 border-red-500/20"
                    }
                  >
                    {tray.status}
                  </Badge>
                </div>

                <div className="flex justify-center my-2">
                  <QRCodeSVG value={tray.qrCodeValue} size={80} />
                </div>

                {tray.status === "in-use" && (
                  <>
                    {tray.currentCookItemId && (
                      <p className="text-xs text-muted-foreground text-center truncate">
                        Cook Item: {tray.currentCookItemId}
                      </p>
                    )}
                    {tray.currentDehydratorUnitId && (
                      <p className="text-xs text-muted-foreground text-center">
                        {tray.currentDehydratorUnitId}, Shelf{" "}
                        {tray.currentShelfPosition}
                      </p>
                    )}
                  </>
                )}
                {tray.lastUsedAt && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last used: {new Date(tray.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden print sheet */}
      <div ref={printRef} className="hidden">
        {trays.map((tray) => (
          <div key={tray._id} className="label">
            <QRCodeSVG value={tray.qrCodeValue} size={80} />
            <span style={{ fontSize: "10px", fontFamily: "monospace" }}>
              {tray.trayId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
