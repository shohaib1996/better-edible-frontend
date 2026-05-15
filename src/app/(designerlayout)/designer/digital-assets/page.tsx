"use client";

import { useState } from "react";
import {
  ImageIcon,
  Download,
  ExternalLink,
  Copy,
  FileText,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Eye,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetUploadModal } from "@/components/DigitalAssets/AssetUploadModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useGetDigitalAssetsQuery,
  useUpdateDigitalAssetMutation,
  useDeleteDigitalAssetMutation,
} from "@/redux/api/DigitalAssets/digitalAssetsApi";
import {
  IDigitalAsset,
  AssetCategory,
  ProductLine,
} from "@/types/digitalAssets/digitalAssets";
import { toast } from "sonner";
import { cloudinaryViewUrl, cloudinaryDownloadUrl } from "@/lib/cloudinaryUrl";
import { cn } from "@/lib/utils";

const CATEGORIES: AssetCategory[] = [
  "Banner", "ProductImage", "Video", "Email", "Flyer", "Social", "Text", "Other",
];

const PRODUCT_LINES: ProductLine[] = [
  "CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy",
];

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  Banner: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  ProductImage: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  Video: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  Email: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Flyer: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  Social: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  Text: "bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  Other: "bg-muted text-muted-foreground border-border",
};

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

  function handleTabChange(t: "active" | "archived") {
    setTab(t);
  }

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center justify-between gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Designer Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            Digital Assets
          </h1>
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
            onClick={() => handleTabChange(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t} ({allAssets.filter((a) => a.status === t).length})
          </button>
        ))}
      </div>

      {/* Filters row */}
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
              <AssetCard
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

      {/* Upload / Edit modal */}
      <AssetUploadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />

      {/* View modal */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] rounded-xs scrollbar-hidden max-h-[90vh] overflow-y-auto overflow-x-hidden bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{viewing?.title}</DialogTitle>
          </DialogHeader>

          {viewing && (
            <div className="space-y-4">
              {viewing.previewUrl && (
                <div className="rounded-xs overflow-hidden border border-border bg-muted/30">
                  <img
                    src={cloudinaryViewUrl(viewing.previewUrl)}
                    alt={viewing.title}
                    className="w-full object-contain max-h-56"
                  />
                </div>
              )}

              <div className="space-y-0 text-sm divide-y divide-border border border-border rounded-xs overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Category</span>
                  <Badge variant="outline" className={cn("rounded-xs text-xs", CATEGORY_COLORS[viewing.category])}>
                    {viewing.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Product Line</span>
                  <span className="font-medium">{viewing.productLine ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Type</span>
                  <Badge variant="secondary" className="rounded-xs text-xs">{viewing.assetType}</Badge>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Uploaded</span>
                  <span className="font-medium">{new Date(viewing.createdAt).toLocaleDateString()}</span>
                </div>
                {viewing.description && (
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground w-24 shrink-0">Description</span>
                    <span className="text-foreground">{viewing.description}</span>
                  </div>
                )}
                {viewing.tags.length > 0 && (
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground w-24 shrink-0">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {viewing.tags.map((t) => (
                        <Badge key={t} variant="outline" className="rounded-xs text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {viewing.assetType === "text" && viewing.textContent && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Text Content</p>
                  <div className="bg-muted rounded-xs p-3 text-sm text-foreground whitespace-pre-wrap">
                    {viewing.textContent}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xs w-full"
                    onClick={() => { navigator.clipboard.writeText(viewing.textContent!); toast.success("Copied to clipboard"); }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Text
                  </Button>
                </div>
              )}

              {viewing.assetType === "file" && viewing.fileUrl && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xs flex-1" asChild>
                    <a href={cloudinaryViewUrl(viewing.fileUrl)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open File
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xs flex-1" asChild>
                    <a href={cloudinaryDownloadUrl(viewing.fileUrl)} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </a>
                  </Button>
                </div>
              )}

              <Button
                className="rounded-xs w-full"
                onClick={() => handleEdit(viewing)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Asset
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => { if (!o) setArchiveTarget(null); }}>
        <AlertDialogContent className="rounded-xs bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">&ldquo;{archiveTarget?.title}&rdquo;</span> will no longer be visible to store users. You can restore it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => archiveTarget && confirmToggle(archiveTarget)}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-xs bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">&ldquo;{deleteTarget?.title}&rdquo;</span> will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AssetCard({
  asset,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: {
  asset: IDigitalAsset;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group bg-card border border-border rounded-xs overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Preview */}
      <div className="relative h-36 bg-muted/40 flex items-center justify-center overflow-hidden">
        {asset.previewUrl ? (
          <img
            src={cloudinaryViewUrl(asset.previewUrl)}
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/40">
            {asset.assetType === "text" ? (
              <FileText className="w-8 h-8" />
            ) : (
              <ImageIcon className="w-8 h-8" />
            )}
            <span className="text-[10px] uppercase tracking-widest font-medium">{asset.assetType}</span>
          </div>
        )}
        {/* Hover overlay */}
        <button
          onClick={onView}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <div className="bg-white/90 dark:bg-background/90 rounded-xs px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium shadow">
            <Eye className="w-3.5 h-3.5" />
            View
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
        <p className="text-sm font-semibold line-clamp-1">{asset.title}</p>
        <div className="flex flex-wrap items-center gap-1">
          <Badge
            variant="outline"
            className={cn("rounded-xs text-[10px] px-1.5 py-0", CATEGORY_COLORS[asset.category])}
          >
            {asset.category}
          </Badge>
          {asset.productLine && (
            <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
              {asset.productLine}
            </Badge>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-3 pb-2.5 flex items-center gap-1">
        <Button size="sm" variant="outline" className="rounded-xs h-7 text-xs flex-1 gap-1" onClick={onView}>
          <Eye className="w-3 h-3" />
          View
        </Button>
        <Button size="sm" variant="outline" className="rounded-xs h-7 text-xs flex-1 gap-1" onClick={onEdit}>
          <Pencil className="w-3 h-3" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xs h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onArchive}
          title={asset.status === "active" ? "Archive" : "Restore"}
        >
          {asset.status === "active" ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xs h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
