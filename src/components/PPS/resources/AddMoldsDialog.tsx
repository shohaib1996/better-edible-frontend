"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBulkCreateMoldsMutation } from "@/redux/api/PrivateLabel/ppsApi";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddMoldsDialog({ open, onClose }: Props) {
  const [prefix, setPrefix] = useState("M");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [unitsPerMold, setUnitsPerMold] = useState("70");
  const [bulkCreate, { isLoading: isCreating }] = useBulkCreateMoldsMutation();

  const previewCount =
    startNumber && endNumber && Number(endNumber) >= Number(startNumber)
      ? Number(endNumber) - Number(startNumber) + 1
      : null;

  const handleCreate = async () => {
    const start = Number(startNumber);
    const end = Number(endNumber);
    if (!start || !end || end < start) { toast.error("Invalid number range"); return; }
    if (end - start + 1 > 200) { toast.error("Maximum 200 molds at a time"); return; }
    try {
      const res = await bulkCreate({
        startNumber: start,
        endNumber: end,
        prefix,
        unitsPerMold: Number(unitsPerMold) || 70,
      }).unwrap();
      toast.success(
        `Created ${res.created} mold${res.created !== 1 ? "s" : ""}${res.skipped > 0 ? ` (${res.skipped} skipped)` : ""}`,
      );
      setStartNumber("");
      setEndNumber("");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create molds");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-xs">
        <DialogHeader>
          <DialogTitle>Add New Molds</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Prefix</Label>
              <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="MOLD" className="rounded-xs" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Units Per Mold</Label>
              <Input type="number" value={unitsPerMold} onChange={(e) => setUnitsPerMold(e.target.value)} className="rounded-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Start Number</Label>
              <Input type="number" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} placeholder="101" className="rounded-xs" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">End Number</Label>
              <Input type="number" value={endNumber} onChange={(e) => setEndNumber(e.target.value)} placeholder="150" className="rounded-xs" />
            </div>
          </div>

          {previewCount !== null && (
            <div className="bg-muted/50 rounded-xs p-3 text-sm">
              <p>
                Will create <strong>{previewCount}</strong> mold{previewCount !== 1 ? "s" : ""}:
              </p>
              <p className="text-muted-foreground">
                {prefix}{String(Number(startNumber)).padStart(3, "0")},{" "}
                {prefix}{String(Number(startNumber) + 1).padStart(3, "0")}, …{" "}
                {prefix}{String(Number(endNumber)).padStart(3, "0")}
              </p>
            </div>
          )}

          <Button className="w-full rounded-xs" onClick={handleCreate} disabled={isCreating || !previewCount}>
            {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Molds
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
