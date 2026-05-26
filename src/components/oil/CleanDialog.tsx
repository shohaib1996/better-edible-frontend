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
import { useCleanOilContainerMutation } from "@/redux/api/oil/oilApi";
import type { IOilContainer } from "@/types/privateLabel/pps";
import { getPPSUser } from "@/lib/ppsUser";

interface Props {
  container: IOilContainer | null;
  onClose: () => void;
}

export function CleanDialog({ container, onClose }: Props) {
  const [notes, setNotes] = useState("");
  const [clean, { isLoading }] = useCleanOilContainerMutation();

  const handleConfirm = async () => {
    if (!container) return;
    try {
      await clean({
        containerId: container.containerId,
        notes: notes || undefined,
        performedBy: getPPSUser(),
      }).unwrap();
      toast.success(`${container.name} cleaned — ${container.remainingAmount}g logged as waste`);
      setNotes("");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Clean failed");
    }
  };

  return (
    <Dialog open={!!container} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-xs">
        <DialogHeader>
          <DialogTitle>Clean Container — {container?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="rounded-xs border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            This will zero out the remaining balance ({container?.remainingAmount}g) and log it as
            waste. This cannot be undone.
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="e.g. End of batch clean"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 rounded-xs"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Zero Out & Log Waste
            </Button>
            <Button variant="outline" onClick={onClose} className="rounded-xs">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
