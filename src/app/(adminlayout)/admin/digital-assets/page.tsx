"use client";

import { useState } from "react";
import { Plus, Pencil, Archive, ArchiveRestore, ImageIcon, Eye, Download, Copy, ExternalLink, FileText, Tag, Calendar, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssetUploadModal } from "@/components/DigitalAssets/AssetUploadModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useGetDigitalAssetsQuery,
  useUpdateDigitalAssetMutation,
} from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { toast } from "sonner";
import { cloudinaryViewUrl, cloudinaryDownloadUrl } from "@/lib/cloudinaryUrl";

export default function AdminDigitalAssetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IDigitalAsset | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IDigitalAsset | null>(null);
  const [viewing, setViewing] = useState<IDigitalAsset | null>(null);
  const [tab, setTab] = useState<"active" | "archived">("active");

  const [activePage, setActivePage] = useState(1);
  const [activeLimit, setActiveLimit] = useState(10);
  const [archivedPage, setArchivedPage] = useState(1);
  const [archivedLimit, setArchivedLimit] = useState(10);

  const page = tab === "active" ? activePage : archivedPage;
  const limit = tab === "active" ? activeLimit : archivedLimit;

  const { data, isLoading } = useGetDigitalAssetsQuery({ status: tab, page, limit });
  const { data: allData } = useGetDigitalAssetsQuery({ status: "all" });
  const [updateAsset, { isLoading: isArchiving }] = useUpdateDigitalAssetMutation();

  const assets = data?.assets ?? [];
  const allAssets = allData?.assets ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function handleEdit(asset: IDigitalAsset) {
    setEditing(asset);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditing(null);
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
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Digital Assets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allAssets.length} assets total</p>
        </div>
        <Button className="rounded-xs" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Upload Asset
        </Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["active", "archived"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t} ({allAssets.filter((a) => a.status === t).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xs" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xs">
          <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
          {tab === "archived" ? (
            <p className="text-muted-foreground text-sm">No archived assets</p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">No assets yet</p>
              <Button variant="outline" size="sm" className="rounded-xs mt-3" onClick={handleAdd}>
                Upload your first asset
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="border border-border rounded-xs overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Product Line</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => (
                  <tr key={asset._id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{asset.title}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-muted-foreground">{asset.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {asset.productLine ? (
                        <Badge variant="outline" className="rounded-xs text-xs">{asset.productLine}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="secondary" className="rounded-xs text-xs">{asset.assetType}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={asset.status === "active" ? "default" : "outline"}
                        className="rounded-xs text-xs"
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="View asset"
                          onClick={() => setViewing(asset)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xs h-8 w-8 p-0"
                          onClick={() => handleEdit(asset)}
                          title="Edit asset"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleArchiveClick(asset)}
                          title={asset.status === "active" ? "Archive" : "Restore"}
                        >
                          {asset.status === "active" ? (
                            <Archive className="w-3.5 h-3.5" />
                          ) : (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            limitOptions={[10, 25, 50, 100]}
          />
        </>
      )}

      <AssetUploadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />

      {/* View Asset Modal */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] rounded-xs scrollbar-hidden max-h-[90vh] overflow-y-auto overflow-x-hidden bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{viewing?.title}</DialogTitle>
          </DialogHeader>

          {viewing && (
            <div className="space-y-4">
              {/* Preview */}
              {viewing.previewUrl && (
                <div className="rounded-xs overflow-hidden border border-border bg-muted/30">
                  <img
                    src={cloudinaryViewUrl(viewing.previewUrl)}
                    alt={viewing.title}
                    className="w-full object-contain max-h-56"
                  />
                </div>
              )}

              {/* Info rows */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3 py-2 border-b border-border">
                  <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Category</span>
                  <span className="font-medium">{viewing.category}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-border">
                  <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Product Line</span>
                  <span className="font-medium">{viewing.productLine ?? "—"}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-border">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Type</span>
                  <Badge variant="secondary" className="rounded-xs text-xs">{viewing.assetType}</Badge>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-border">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Uploaded</span>
                  <span className="font-medium">{new Date(viewing.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-border">
                  <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24 shrink-0">Status</span>
                  <Badge variant={viewing.status === "active" ? "default" : "outline"} className="rounded-xs text-xs capitalize">{viewing.status}</Badge>
                </div>

                {viewing.description && (
                  <div className="flex items-start gap-3 py-2 border-b border-border">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground w-24 shrink-0">Description</span>
                    <span className="text-foreground">{viewing.description}</span>
                  </div>
                )}
              </div>

              {/* Text content */}
              {viewing.assetType === "text" && viewing.textContent && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Text Content</p>
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

              {/* File actions */}
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

              {/* Edit shortcut */}
              <Button
                className="rounded-xs w-full"
                onClick={() => { setViewing(null); handleEdit(viewing); }}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Asset
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
