"use client";

import { useState } from "react";
import { FlaskConical, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useGetFlavorsQuery,
  useToggleFlavorMutation,
  useDeleteFlavorMutation,
} from "@/redux/api/flavor/flavorsApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { IFlavor } from "@/types/privateLabel/pps";
import { AddFlavorDialog } from "@/components/FlavorCatalog/AddFlavorDialog";
import { EditFlavorDialog } from "@/components/FlavorCatalog/EditFlavorDialog";
import { FlavorTable } from "@/components/FlavorCatalog/FlavorTable";
import { FlavorCards } from "@/components/FlavorCatalog/FlavorCards";

type StatusFilter = "all" | "active" | "inactive";
const LIMIT_OPTIONS = [10, 25, 50, 100];
const DEFAULT_LIMIT = 25;

export default function FlavorCatalogContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [editTarget, setEditTarget] = useState<IFlavor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IFlavor | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data: allStats } = useGetFlavorsQuery({ page: 1, limit: 1 });
  const { data: activeStats } = useGetFlavorsQuery({ page: 1, limit: 1, isActive: true });

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
      toast.success(`"${res.flavor.name}" ${res.flavor.isActive ? "activated" : "deactivated"}`);
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

  const sharedProps = {
    flavors,
    isLoading,
    isFetching,
    debouncedSearch,
    togglingId,
    onToggle: handleToggle,
    onEdit: setEditTarget,
    onDelete: setDeleteTarget,
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

      {/* Table (desktop) / Cards (mobile+tablet) */}
      <FlavorTable {...sharedProps} />
      <FlavorCards {...sharedProps} />

      {/* Pagination */}
      {!isLoading && totalItems > 0 && (
        <GlobalPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
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
