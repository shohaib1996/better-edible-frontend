"use client";

import { useState, useRef } from "react";
import Barcode from "react-barcode";
import { Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useGetMoldsQuery,
  useBulkDeleteMoldsMutation,
  useUpdateMoldStatusMutation,
  useGetStage1CookItemsQuery,
  useGetStage2CookItemsQuery,
  useGetStage3CookItemsQuery,
  useGetStage4CookItemsQuery,
} from "@/redux/api/PrivateLabel/ppsApi";
import { MoldCard } from "./MoldCard";
import { AddMoldsDialog } from "./AddMoldsDialog";

export default function MoldsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetMoldsQuery();
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
    ].map((i) => [i.cookItemId, { storeName: i.storeName, flavor: i.flavor }]),
  );

  const molds = data?.molds ?? [];
  const availableMolds = molds.filter((m) => m.status === "available");
  const availableCount = availableMolds.length;
  const inUseCount = molds.filter((m) => m.status === "in-use").length;
  const allAvailableSelected =
    availableMolds.length > 0 && availableMolds.every((m) => selected.has(m.moldId));

  const toggleSelect = (moldId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(moldId)) next.delete(moldId);
      else next.add(moldId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allAvailableSelected) setSelected(new Set());
    else setSelected(new Set(availableMolds.map((m) => m.moldId)));
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {availableMolds.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox checked={allAvailableSelected} onCheckedChange={toggleSelectAll} id="select-all-molds" />
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
            <Button variant="destructive" size="sm" className="rounded-xs" onClick={handleBulkDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xs bg-accent text-white" onClick={handlePrintAll} disabled={molds.length === 0}>
            <Printer className="w-4 h-4 mr-1" />
            Print All Labels
          </Button>
          <Button size="sm" className="rounded-xs" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Molds
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading molds…</span>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {molds.map((mold) => (
            <MoldCard
              key={mold._id}
              mold={mold}
              isSelected={selected.has(mold.moldId)}
              onToggle={() => toggleSelect(mold.moldId)}
              cookItemInfo={mold.currentCookItemId ? cookItemMap.get(mold.currentCookItemId) : undefined}
              onRelease={() => handleStatusChange(mold.moldId)}
            />
          ))}
        </div>
      )}

      <div ref={printRef} className="hidden">
        {molds.map((mold) => (
          <div key={mold._id} className="label">
            <Barcode value={mold.barcodeValue} width={1} height={30} fontSize={8} margin={0} displayValue />
          </div>
        ))}
      </div>

      <AddMoldsDialog open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
