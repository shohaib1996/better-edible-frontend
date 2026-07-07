"use client";

import { useState } from "react";
import { FlaskConical, Plus, Search, Pencil, Trash2, Loader2, GitMerge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useGetFlavorsQuery,
  useCreateFlavorMutation,
  useToggleFlavorMutation,
  useUpdateFlavorMutation,
  useDeleteFlavorMutation,
} from "@/redux/api/flavor/flavorsApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { IFlavor } from "@/types/privateLabel/pps";

type StatusFilter = "all" | "active" | "inactive";
const LIMIT_OPTIONS = [10, 25, 50, 100];
const DEFAULT_LIMIT = 25;

// ─── Add Flavor Dialog ────────────────────────────────────────────────────────

function AddFlavorDialog() {
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

// ─── Edit Flavor Dialog ───────────────────────────────────────────────────────

function EditFlavorDialog({
  flavor,
  open,
  onClose,
}: {
  flavor: IFlavor;
  open: boolean;
  onClose: () => void;
}) {
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlavorCatalogPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [editTarget, setEditTarget] = useState<IFlavor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IFlavor | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  // Stats queries (tiny — just for the subtitle counts)
  const { data: allStats } = useGetFlavorsQuery({ page: 1, limit: 1 });
  const { data: activeStats } = useGetFlavorsQuery({ page: 1, limit: 1, isActive: true });

  // Main table query
  const { data, isLoading, isFetching } = useGetFlavorsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    isActive:
      statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
  });

  const [toggleFlavor] = useToggleFlavorMutation();
  const [deleteFlavor] = useDeleteFlavorMutation();

  const flavors = data?.flavors ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const totalCount = allStats?.total ?? 0;
  const activeCount = activeStats?.total ?? 0;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilter = (f: StatusFilter) => {
    setStatusFilter(f);
    setPage(1);
  };

  const handleToggle = async (flavor: IFlavor) => {
    setTogglingId(flavor.flavorId);
    try {
      const res = await toggleFlavor(flavor.flavorId).unwrap();
      toast.success(
        `"${res.flavor.name}" ${res.flavor.isActive ? "activated" : "deactivated"}`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    } finally {
      setTogglingId(null);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-primary shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Flavor Catalog</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeCount} active · {totalCount} total — master flavor list for private label &amp; AI generation
            </p>
          </div>
        </div>
        <AddFlavorDialog />
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search flavors..."
            className="pl-9 rounded-xs"
          />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-xs overflow-hidden">
          {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleStatusFilter(f)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`transition-opacity ${isFetching ? "opacity-60" : ""}`}>
        <DataTable
          data={flavors}
          isLoading={isLoading}
          emptyMessage={
            debouncedSearch ? `No flavors matching "${debouncedSearch}"` : "No flavors found"
          }
          columns={[
            {
              key: "name",
              header: "Flavor Name",
              render: (flavor) => (
                <div className="flex items-center gap-2">
                  {flavor.isBlend && (
                    <GitMerge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium">{flavor.name}</span>
                  {flavor.defaultAmount !== undefined && flavor.defaultAmount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · {flavor.defaultAmount}g
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "isActive",
              header: "Status",
              className: "w-[140px]",
              render: (flavor) => (
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
              ),
            },
            {
              key: "flavorId",
              header: "Actions",
              className: "w-[140px] text-right",
              render: (flavor) => (
                <div className="flex items-center justify-end gap-2">
                  {togglingId === flavor.flavorId ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={flavor.isActive}
                      onCheckedChange={() => handleToggle(flavor)}
                      disabled={togglingId === flavor.flavorId}
                    />
                  )}
                  <button
                    onClick={() => setEditTarget(flavor)}
                    title="Edit"
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(flavor)}
                    title="Delete"
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Pagination */}
      {!isLoading && totalItems > 0 && (
        <GlobalPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          limitOptions={LIMIT_OPTIONS}
        />
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <EditFlavorDialog
          key={editTarget.flavorId}
          flavor={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flavor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This
              cannot be undone.
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
