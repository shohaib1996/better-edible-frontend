"use client";

import { useState } from "react";
import { Plus, Loader2, FlaskConical, GitMerge } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetFlavorsQuery,
  useCreateFlavorMutation,
  useToggleFlavorMutation,
  useDeleteFlavorMutation,
} from "@/redux/api/flavor/flavorsApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { FlavorCard } from "./flavors/FlavorCard";
import { CsvImportDialog } from "./flavors/CsvImportDialog";
import type { IFlavor } from "@/types/privateLabel/pps";

const PAGE_LIMIT_OPTIONS = [9, 18, 27, 54];
const DEFAULT_LIMIT = 9;

export default function FlavorsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDefaultAmount, setNewDefaultAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<IFlavor | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading } = useGetFlavorsQuery({ page, limit });
  const [createFlavor, { isLoading: isCreating }] = useCreateFlavorMutation();
  const [toggleFlavor] = useToggleFlavorMutation();
  const [deleteFlavor] = useDeleteFlavorMutation();

  const flavors = data?.flavors ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const baseFlavors = flavors.filter((f) => !f.isBlend);
  const blendFlavors = flavors.filter((f) => f.isBlend);
  const flavorMap = new Map(flavors.map((f) => [f.flavorId, f.name]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await createFlavor({
        name: newName.trim(),
        defaultAmount: newDefaultAmount !== "" ? Number(newDefaultAmount) : undefined,
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
      toast.success(`"${res.flavor.name}" ${res.flavor.isActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFlavor(deleteTarget.flavorId).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      if (flavors.length === 1 && page > 1) setPage(page - 1);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete flavor");
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-medium">Flavors ({totalItems})</h3>
          <p className="text-sm text-muted-foreground">
            {baseFlavors.length} base · {blendFlavors.length} blend{blendFlavors.length !== 1 ? "s" : ""} on this page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
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
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Flavor
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
          <span>Loading flavors…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && flavors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FlaskConical className="w-10 h-10 opacity-30" />
          <p className="text-sm">No flavors yet. Add your first flavor above.</p>
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
                onDelete={() => setDeleteTarget(flavor)}
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
                onDelete={() => setDeleteTarget(flavor)}
                flavorMap={flavorMap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalItems > 0 && (
        <GlobalPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          limitOptions={PAGE_LIMIT_OPTIONS}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flavor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
