"use client";

import { GitMerge, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
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
import { useUpdateFlavorMutation } from "@/redux/api/flavor/flavorsApi";
import type { IFlavor } from "@/types/privateLabel/pps";

function EditFlavorDialog({ flavor }: { flavor: IFlavor }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(flavor.name);
  const [defaultAmount, setDefaultAmount] = useState(
    flavor.defaultAmount !== undefined ? String(flavor.defaultAmount) : "",
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
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Edit flavor"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
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

export function FlavorCard({
  flavor,
  onToggle,
  onDelete,
  flavorMap,
}: {
  flavor: IFlavor;
  onToggle: () => void;
  onDelete: () => void;
  flavorMap: Map<string, string>;
}) {
  return (
    <Card className="rounded-xs py-0">
      <CardContent className="px-3 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {flavor.isBlend && (
                <GitMerge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <p className="font-medium text-sm truncate">{flavor.name}</p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{flavor.flavorId}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <EditFlavorDialog flavor={flavor} />
            <button
              type="button"
              className="p-1 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete flavor"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <Badge
              variant="outline"
              className={
                flavor.isActive
                  ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                  : "bg-muted text-muted-foreground border-border text-xs"
              }
            >
              {flavor.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {flavor.isBlend && flavor.blendOf.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flavor.blendOf.map((id) => (
              <span
                key={id}
                className="text-xs bg-muted px-2 py-0.5 rounded-xs text-muted-foreground"
              >
                {flavorMap.get(id) ?? id}
              </span>
            ))}
          </div>
        )}

        {flavor.defaultAmount !== undefined && (
          <p className="text-xs text-muted-foreground">
            Default:{" "}
            <span className="font-semibold text-foreground">{flavor.defaultAmount}g</span>{" "}
            / mold
          </p>
        )}

        <Button
          size="sm"
          variant="outline"
          className={
            flavor.isActive
              ? "w-full rounded-xs text-xs h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "w-full rounded-xs text-xs h-7 border-green-500/40 text-green-600 hover:bg-green-500/10 hover:text-green-600"
          }
          onClick={onToggle}
        >
          {flavor.isActive ? "Deactivate" : "Activate"}
        </Button>
      </CardContent>
    </Card>
  );
}
