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
import { useRefillOilContainerMutation } from "@/redux/api/oil/oilApi";
import type { IOilContainer } from "@/types/privateLabel/pps";
import { getPPSUser } from "@/lib/ppsUser";

interface Props {
  container: IOilContainer | null;
  onClose: () => void;
}

export function RefillDialog({ container, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [refill, { isLoading }] = useRefillOilContainerMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!container) return;
    try {
      await refill({
        containerId: container.containerId,
        amount: Number(amount),
        performedBy: getPPSUser(),
      }).unwrap();
      toast.success(`Refilled ${container.name} with ${amount}g`);
      setAmount("");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Refill failed");
    }
  };

  return (
    <Dialog open={!!container} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-xs">
        <DialogHeader>
          <DialogTitle>Refill — {container?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Amount to add (g)</Label>
            <Input
              type="number"
              placeholder="e.g. 200"
              min={0.1}
              step={0.1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-xs"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="rounded-xs">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirm Refill
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
