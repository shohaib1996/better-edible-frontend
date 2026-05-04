"use client";

import { useState } from "react";
import { Plus, Pencil, Archive, ArchiveRestore, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetUploadModal } from "@/components/DigitalAssets/AssetUploadModal";
import {
  useGetDigitalAssetsQuery,
  useUpdateDigitalAssetMutation,
} from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { toast } from "sonner";

export default function AdminDigitalAssetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IDigitalAsset | null>(null);

  const { data, isLoading } = useGetDigitalAssetsQuery();
  const [updateAsset] = useUpdateDigitalAssetMutation();

  const assets = data?.assets ?? [];

  function handleEdit(asset: IDigitalAsset) {
    setEditing(asset);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  async function handleToggleArchive(asset: IDigitalAsset) {
    const newStatus = asset.status === "active" ? "archived" : "active";
    try {
      await updateAsset({ id: asset._id, body: { status: newStatus } }).unwrap();
      toast.success(newStatus === "archived" ? "Asset archived" : "Asset restored");
    } catch {
      toast.error("Failed to update asset");
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Digital Assets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{assets.length} assets total</p>
        </div>
        <Button className="rounded-xs" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Upload Asset
        </Button>
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
          <p className="text-muted-foreground text-sm">No assets yet</p>
          <Button variant="outline" size="sm" className="rounded-xs mt-3" onClick={handleAdd}>
            Upload your first asset
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
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
                <tr key={asset._id} className="hover:bg-muted/20 transition-colors">
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
                        className="rounded-xs h-8 w-8 p-0"
                        onClick={() => handleEdit(asset)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleToggleArchive(asset)}
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
      )}

      <AssetUploadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
      />
    </div>
  );
}
