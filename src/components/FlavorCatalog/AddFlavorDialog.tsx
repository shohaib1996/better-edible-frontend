"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateFlavorMutation } from "@/redux/api/flavor/flavorsApi";

export function AddFlavorDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [createFlavor, { isLoading }] = useCreateFlavorMutation();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await createFlavor({
        name: name.trim(),
        defaultAmount: defaultAmount !== "" ? Number(defaultAmount) : undefined,
      }).unwrap();
      toast.success(`Flavor "${res.flavor.name}" created`);
      setName("");
      setDefaultAmount("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create flavor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xs gap-2">
          <Plus className="w-4 h-4" />
          Add Flavor
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xs">
        <DialogHeader>
          <DialogTitle>Add New Flavor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Flavor Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Watermelon"
              className="rounded-xs"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Default Amount (g per mold) — optional</Label>
            <Input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="e.g. 12"
              className="rounded-xs"
            />
          </div>
          <Button
            className="w-full rounded-xs"
            onClick={handleCreate}
            disabled={isLoading || !name.trim()}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Flavor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
