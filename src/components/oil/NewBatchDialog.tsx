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
import { useCreateOilContainerMutation } from "@/redux/api/oil/oilApi";
import type { CannabisType } from "@/types/privateLabel/pps";
import { getPPSUser } from "@/lib/ppsUser";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewBatchDialog({ open, onClose }: Props) {
  const [form, setForm] = useState({
    containerId: "",
    name: "",
    cannabisType: "BioMax" as CannabisType,
    potency: "",
    totalAmount: "",
  });

  const [createContainer, { isLoading }] = useCreateOilContainerMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContainer({
        containerId: form.containerId.trim(),
        name: form.name.trim(),
        cannabisType: form.cannabisType,
        potency: Number(form.potency),
        totalAmount: Number(form.totalAmount),
        performedBy: getPPSUser(),
      }).unwrap();
      toast.success("Container created");
      setForm({ containerId: "", name: "", cannabisType: "BioMax", potency: "", totalAmount: "" });
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create container");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xs">
        <DialogHeader>
          <DialogTitle>New Batch — Create Container</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Container ID</Label>
            <Input
              placeholder="e.g. OIL-001"
              value={form.containerId}
              onChange={(e) => setForm((f) => ({ ...f, containerId: e.target.value }))}
              required
              className="rounded-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Display Name</Label>
            <Input
              placeholder="e.g. BioMax Batch #12"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="rounded-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cannabis Type</Label>
            <div className="flex gap-2">
              {(["BioMax", "Rosin"] as CannabisType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cannabisType: type }))}
                  className={`flex-1 py-2 rounded-xs border text-sm font-medium transition-colors ${
                    form.cannabisType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Potency (%)</Label>
              <Input
                type="number"
                placeholder="e.g. 85"
                min={0.1}
                max={100}
                step={0.1}
                value={form.potency}
                onChange={(e) => setForm((f) => ({ ...f, potency: e.target.value }))}
                required
                className="rounded-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Total Amount (g)</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                min={0.1}
                step={0.1}
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                required
                className="rounded-xs"
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="rounded-xs mt-1">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Container
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
