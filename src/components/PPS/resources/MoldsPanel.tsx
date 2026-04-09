"use client";

import { useState, useRef } from "react";
import Barcode from "react-barcode";
import { Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  useBulkDeleteMoldsMutation,
  useUpdateMoldStatusMutation,
  useGetStage1CookItemsQuery,
  useGetStage2CookItemsQuery,
  useGetStage3CookItemsQuery,
  useGetStage4CookItemsQuery,
} from "@/redux/api/PrivateLabel/ppsApi";

export default function MoldsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefix, setPrefix] = useState("M");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [unitsPerMold, setUnitsPerMold] = useState("70");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetMoldsQuery();
  const [bulkCreate, { isLoading: isCreating }] = useBulkCreateMoldsMutation();
  const [bulkDelete, { isLoading: isDeleting }] = useBulkDeleteMoldsMutation();
  const [updateStatus] = useUpdateMoldStatusMutation();

  const { data: s1Data } = useGetStage1CookItemsQuery({ status: "in-progress,cooking_molding_complete" });
  const { data: s2Data } = useGetStage2CookItemsQuery();
  const { data: s3Data } = useGetStage3CookItemsQuery();
  const { data: s4Data } = useGetStage4CookItemsQuery();

  const cookItemMap = new Map<string, { storeName: string; flavor: string }>(
    [
      ...(s1Data?.cookItems ?? []),
      ...(s2Data?.cookItems ?? []),
      ...(s3Data?.cookItems ?? []),
      ...(s4Data?.cookItems ?? []),
    ].map((i) => [i.cookItemId, { storeName: i.storeName, flavor: i.flavor }])
  );

  const molds = data?.molds ?? [];
  const availableMolds = molds.filter((m) => m.status === "available");
  const availableCount = availableMolds.length;
  const inUseCount = molds.filter((m) => m.status === "in-use").length;

  const allAvailableSelected =
    availableMolds.length > 0 &&
    availableMolds.every((m) => selected.has(m.moldId));

  const previewCount =
    startNumber && endNumber && Number(endNumber) >= Number(startNumber)
      ? Number(endNumber) - Number(startNumber) + 1
      : null;

  const toggleSelect = (moldId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(moldId)) next.delete(moldId);
      else next.add(moldId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allAvailableSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableMolds.map((m) => m.moldId)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await bulkDelete({ moldIds: [...selected] }).unwrap();
      toast.success(res.message);
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete molds");
    }
  };

  const handleStatusChange = async (moldId: string) => {
    try {
      await updateStatus({ moldId, status: "available" }).unwrap();
      toast.success("Mold released to available");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

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
        unitsPerMold: Number(unitsPerMold) || 70,
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {availableMolds.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allAvailableSelected}
                onCheckedChange={toggleSelectAll}
                id="select-all-molds"
              />
              <label htmlFor="select-all-molds" className="text-sm cursor-pointer select-none">
                Select All
              </label>
            </div>
          )}
          <div>
            <h3 className="font-medium">Molds ({molds.length})</h3>
            <p className="text-sm text-muted-foreground">
              {availableCount} available, {inUseCount} in use
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xs"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Delete ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xs bg-accent text-white" onClick={handlePrintAll} disabled={molds.length === 0}>
            <Printer className="w-4 h-4 mr-1" />
            Print All Labels
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xs">
                <Plus className="w-4 h-4 mr-1" />
                Add Molds
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xs">
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
                      className="rounded-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Units Per Mold</Label>
                    <Input
                      type="number"
                      value={unitsPerMold}
                      onChange={(e) => setUnitsPerMold(e.target.value)}
                      className="rounded-xs"
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
                      className="rounded-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Number</Label>
                    <Input
                      type="number"
                      value={endNumber}
                      onChange={(e) => setEndNumber(e.target.value)}
                      placeholder="150"
                      className="rounded-xs"
                    />
                  </div>
                </div>

                {previewCount !== null && (
                  <div className="bg-muted/50 rounded-xs p-3 text-sm">
                    <p>
                      Will create <strong>{previewCount}</strong> mold
                      {previewCount !== 1 ? "s" : ""}:
                    </p>
                    <p className="text-muted-foreground">
                      {prefix}{String(Number(startNumber)).padStart(3,"0")}, {prefix}{String(Number(startNumber)+1).padStart(3,"0")}, … {prefix}{String(Number(endNumber)).padStart(3,"0")}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full rounded-xs"
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
            <Card key={mold._id} className="rounded-xs">
              <CardContent className="px-3 py-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selected.has(mold.moldId)}
                      onCheckedChange={() => toggleSelect(mold.moldId)}
                      disabled={mold.status === "in-use"}
                      className={mold.status === "in-use" ? "opacity-40" : ""}
                    />
                    <span className="font-medium text-sm">{mold.moldId}</span>
                  </div>
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
                {mold.status === "in-use" && mold.currentCookItemId && (() => {
                  const ci = cookItemMap.get(mold.currentCookItemId);
                  return ci ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-center font-medium truncate cursor-default">
                            {ci.storeName} · {ci.flavor}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>{ci.storeName} · {ci.flavor}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center truncate">
                      {mold.currentCookItemId}
                    </p>
                  );
                })()}
                {mold.lastUsedAt && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last used: {new Date(mold.lastUsedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Force release — only shown for in-use molds */}
                {mold.status === "in-use" && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Force release</span>
                    <Switch
                      checked={false}
                      onCheckedChange={() => handleStatusChange(mold.moldId)}
                    />
                  </div>
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
