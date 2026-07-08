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
import { useUpdateFlavorMutation } from "@/redux/api/flavor/flavorsApi";
import type { IFlavor } from "@/types/privateLabel/pps";

interface Props {
  flavor: IFlavor;
  open: boolean;
  onClose: () => void;
}

export function EditFlavorDialog({ flavor, open, onClose }: Props) {
  const [name, setName] = useState(flavor.name);
  const [defaultAmount, setDefaultAmount] = useState(
    flavor.defaultAmount !== undefined ? String(flavor.defaultAmount) : ""
  );
  const [updateFlavor, { isLoading }] = useUpdateFlavorMutation();

  const handleSave = async () => {
    try {
      await updateFlavor({
        flavorId: flavor.flavorId,
        name: name.trim() || undefined,
        defaultAmount: defaultAmount !== "" ? Number(defaultAmount) : undefined,
      }).unwrap();
      toast.success("Flavor updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-xs">
        <DialogHeader>
          <DialogTitle>Edit Flavor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xs"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Default Amount (g per mold)</Label>
            <Input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="Optional"
              className="rounded-xs"
            />
          </div>
          <Button
            className="w-full rounded-xs"
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
