"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { ImageIcon, Search, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetUploadModal } from "@/components/DigitalAssets/AssetUploadModal";
import { AssetCardDesigner } from "@/components/DigitalAssets/AssetCardDesigner";
import { AssetViewModal } from "@/components/DigitalAssets/AssetViewModal";
import { AssetArchiveDialog, AssetDeleteDialog } from "@/components/DigitalAssets/AssetConfirmDialogs";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useGetDigitalAssetsQuery,
  useUpdateDigitalAssetMutation,
  useDeleteDigitalAssetMutation,
} from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { IDigitalAsset, AssetCategory, ProductLine } from "@/types/digitalAssets/digitalAssets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES: AssetCategory[] = [
  "Banner", "ProductImage", "Video", "Email", "Flyer", "Social", "Text", "Other",
];

const PRODUCT_LINES: ProductLine[] = [
  "CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy",
];

export default function DesignerDigitalAssetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IDigitalAsset | null>(null);
  const [viewing, setViewing] = useState<IDigitalAsset | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IDigitalAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IDigitalAsset | null>(null);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "all">("all");
  const [productLineFilter, setProductLineFilter] = useState<ProductLine | "all">("all");
  const [activePage, setActivePage] = useState(1);
  const [activeLimit, setActiveLimit] = useState(12);
  const [archivedPage, setArchivedPage] = useState(1);
  const [archivedLimit, setArchivedLimit] = useState(12);

  const page = tab === "active" ? activePage : archivedPage;
  const limit = tab === "active" ? activeLimit : archivedLimit;

  const { data, isLoading } = useGetDigitalAssetsQuery({
    status: tab,
    page,
    limit,
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
    ...(productLineFilter !== "all" ? { productLine: productLineFilter } : {}),
  });
  const { data: allData } = useGetDigitalAssetsQuery({ status: "all" });

  const [updateAsset, { isLoading: isArchiving }] = useUpdateDigitalAssetMutation();
  const [deleteAsset, { isLoading: isDeleting }] = useDeleteDigitalAssetMutation();

  const assets = data?.assets ?? [];
  const allAssets = allData?.assets ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filtered = search.trim()
    ? assets.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.description?.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : assets;

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(asset: IDigitalAsset) {
    setViewing(null);
    setEditing(asset);
    setModalOpen(true);
  }

  function handleArchiveClick(asset: IDigitalAsset) {
    if (asset.status === "active") {
      setArchiveTarget(asset);
    } else {
      confirmToggle(asset);
    }
  }

  async function confirmToggle(asset: IDigitalAsset) {
    const newStatus = asset.status === "active" ? "archived" : "active";
    try {
      await updateAsset({ id: asset._id, body: { status: newStatus } }).unwrap();
      toast.success(newStatus === "archived" ? "Asset archived" : "Asset restored");
    } catch {
      toast.error("Failed to update asset");
    }
    setArchiveTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAsset(deleteTarget._id).unwrap();
      toast.success("Asset deleted");
    } catch {
      toast.error("Failed to delete asset");
    }
    setDeleteTarget(null);
  }

  function handlePageChange(p: number) {
    if (tab === "active") setActivePage(p);
    else setArchivedPage(p);
  }

  function handleLimitChange(l: number) {
    if (tab === "active") { setActiveLimit(l); setActivePage(1); }
    else { setArchivedLimit(l); setArchivedPage(1); }
  }

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center justify-between gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Designer Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">Digital Assets</h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${allAssets.length} asset${allAssets.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="relative shrink-0">
          <Button
            onClick={handleAdd}
            className="rounded-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 dark:bg-primary dark:hover:bg-primary/90 dark:text-white dark:border-0 backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Upload Asset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border">
        {(["active", "archived"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t} ({allAssets.filter((a) => a.status === t).length})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xs pl-8 h-8 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as AssetCategory | "all"); setActivePage(1); }}>
          <SelectTrigger className="rounded-xs w-40 h-8 text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={productLineFilter} onValueChange={(v) => { setProductLineFilter(v as ProductLine | "all"); setActivePage(1); }}>
          <SelectTrigger className="rounded-xs w-40 h-8 text-xs">
            <SelectValue placeholder="All product lines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Product Lines</SelectItem>
            {PRODUCT_LINES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xs" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xs bg-card">
          <div className="w-16 h-16 rounded-xs bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-base">No assets found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {search || categoryFilter !== "all" || productLineFilter !== "all"
              ? "Try adjusting your filters"
              : tab === "archived"
                ? "No archived assets"
                : "Upload your first asset to get started"}
          </p>
          {!search && categoryFilter === "all" && productLineFilter === "all" && tab === "active" && (
            <Button className="rounded-xs mt-4" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              Upload Asset
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((asset) => (
              <AssetCardDesigner
                key={asset._id}
                asset={asset}
                onView={() => setViewing(asset)}
                onEdit={() => handleEdit(asset)}
                onArchive={() => handleArchiveClick(asset)}
                onDelete={() => setDeleteTarget(asset)}
              />
            ))}
          </div>
          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            limitOptions={[12, 24, 48]}
          />
        </>
      )}

      <AssetUploadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />

      <AssetViewModal
        asset={viewing}
        onClose={() => setViewing(null)}
        onEdit={handleEdit}
      />

      <AssetArchiveDialog
        target={archiveTarget}
        isLoading={isArchiving}
        onConfirm={confirmToggle}
        onClose={() => setArchiveTarget(null)}
      />

      <AssetDeleteDialog
        target={deleteTarget}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
