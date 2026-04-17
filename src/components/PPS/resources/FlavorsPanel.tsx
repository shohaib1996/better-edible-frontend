"use client";

import { useState } from "react";
import { Plus, Loader2, FlaskConical, GitMerge, Pencil } from "lucide-react";
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
  useGetFlavorsQuery,
  useCreateFlavorMutation,
  useToggleFlavorMutation,
  useUpdateFlavorMutation,
} from "@/redux/api/flavor/flavorsApi";
import type { IFlavor } from "@/types/privateLabel/pps";

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

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
            <Label className="text-xs mb-1 block">
              Default Amount (g per mold)
            </Label>
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

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function FlavorsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDefaultAmount, setNewDefaultAmount] = useState("");

  const { data, isLoading } = useGetFlavorsQuery();
  const [createFlavor, { isLoading: isCreating }] = useCreateFlavorMutation();
  const [toggleFlavor] = useToggleFlavorMutation();

  const flavors = data?.flavors ?? [];
  const baseFlavors = flavors.filter((f) => !f.isBlend);
  const blendFlavors = flavors.filter((f) => f.isBlend);
  const activeCount = flavors.filter((f) => f.isActive).length;

  // Build a lookup map for blend parent names
  const flavorMap = new Map(flavors.map((f) => [f.flavorId, f.name]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await createFlavor({
        name: newName.trim(),
        defaultAmount:
          newDefaultAmount !== "" ? Number(newDefaultAmount) : undefined,
      }).unwrap();
      toast.success(`Flavor "${res.flavor.name}" created`);
      setNewName("");
      setNewDefaultAmount("");
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create flavor");
    }
  };

  const handleToggle = async (flavor: IFlavor) => {
    try {
      const res = await toggleFlavor(flavor.flavorId).unwrap();
      toast.success(
        `"${res.flavor.name}" ${res.flavor.isActive ? "activated" : "deactivated"}`,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-medium">Flavors ({flavors.length})</h3>
          <p className="text-sm text-muted-foreground">
            {activeCount} active · {baseFlavors.length} base ·{" "}
            {blendFlavors.length} blend{blendFlavors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xs">
              <Plus className="w-4 h-4 mr-1" />
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
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Watermelon"
                  className="rounded-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">
                  Default Amount (g per mold) — optional
                </Label>
                <Input
                  type="number"
                  value={newDefaultAmount}
                  onChange={(e) => setNewDefaultAmount(e.target.value)}
                  placeholder="e.g. 12"
                  className="rounded-xs"
                />
              </div>
              <Button
                className="w-full rounded-xs"
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
              >
                {isCreating && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Create Flavor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading flavors…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && flavors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FlaskConical className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            No flavors yet. Add your first flavor above.
          </p>
        </div>
      )}

      {/* Base Flavors */}
      {!isLoading && baseFlavors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Base Flavors
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {baseFlavors.map((flavor) => (
              <FlavorCard
                key={flavor._id}
                flavor={flavor}
                onToggle={() => handleToggle(flavor)}
                flavorMap={flavorMap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blends */}
      {!isLoading && blendFlavors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5" />
            Blends
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blendFlavors.map((flavor) => (
              <FlavorCard
                key={flavor._id}
                flavor={flavor}
                onToggle={() => handleToggle(flavor)}
                flavorMap={flavorMap}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Flavor Card ──────────────────────────────────────────────────────────────

function FlavorCard({
  flavor,
  onToggle,
  flavorMap,
}: {
  flavor: IFlavor;
  onToggle: () => void;
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
            <p className="text-xs text-muted-foreground font-mono">
              {flavor.flavorId}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <EditFlavorDialog flavor={flavor} />
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

        {/* Blend parents */}
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

        {/* Default amount */}
        {flavor.defaultAmount !== undefined && (
          <p className="text-xs text-muted-foreground">
            Default:{" "}
            <span className="font-semibold text-foreground">
              {flavor.defaultAmount}g
            </span>{" "}
            / mold
          </p>
        )}

        {/* Toggle button */}
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-xs text-xs h-7"
          onClick={onToggle}
        >
          {flavor.isActive ? "Deactivate" : "Activate"}
        </Button>
      </CardContent>
    </Card>
  );
}
