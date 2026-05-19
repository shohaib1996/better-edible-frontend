"use client";

import { Download, ExternalLink, Copy, FileText, Tag, Calendar, Layers, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { toast } from "sonner";
import { cloudinaryViewUrl, cloudinaryDownloadUrl } from "@/lib/cloudinaryUrl";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "./AssetCardDesigner";

interface AssetViewModalProps {
  asset: IDigitalAsset | null;
  onClose: () => void;
  onEdit: (asset: IDigitalAsset) => void;
}

export function AssetViewModal({ asset, onClose, onEdit }: AssetViewModalProps) {
  return (
    <Dialog open={!!asset} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] rounded-xs scrollbar-hidden max-h-[90vh] overflow-y-auto overflow-x-hidden bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{asset?.title}</DialogTitle>
        </DialogHeader>

        {asset && (
          <div className="space-y-4">
            {asset.previewUrl && (
              <div className="rounded-xs overflow-hidden border border-border bg-muted/30">
                <img
                  src={cloudinaryViewUrl(asset.previewUrl)}
                  alt={asset.title}
                  className="w-full object-contain max-h-56"
                />
              </div>
            )}

            <div className="space-y-0 text-sm divide-y divide-border border border-border rounded-xs overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Category</span>
                <Badge variant="outline" className={cn("rounded-xs text-xs", CATEGORY_COLORS[asset.category])}>
                  {asset.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Product Line</span>
                <span className="font-medium">{asset.productLine ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Type</span>
                <Badge variant="secondary" className="rounded-xs text-xs">{asset.assetType}</Badge>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">Uploaded</span>
                <span className="font-medium">{new Date(asset.createdAt).toLocaleDateString()}</span>
              </div>
              {asset.description && (
                <div className="flex items-start gap-3 px-3 py-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground w-24 shrink-0">Description</span>
                  <span className="text-foreground">{asset.description}</span>
                </div>
              )}
              {asset.tags.length > 0 && (
                <div className="flex items-start gap-3 px-3 py-2.5">
                  <Tag className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground w-24 shrink-0">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((t) => (
                      <Badge key={t} variant="outline" className="rounded-xs text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {asset.assetType === "text" && asset.textContent && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Text Content</p>
                <div className="bg-muted rounded-xs p-3 text-sm text-foreground whitespace-pre-wrap">
                  {asset.textContent}
                </div>
                <Button
                  size="sm" variant="outline" className="rounded-xs w-full"
                  onClick={() => { navigator.clipboard.writeText(asset.textContent!); toast.success("Copied to clipboard"); }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Text
                </Button>
              </div>
            )}

            {asset.assetType === "file" && asset.fileUrl && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-xs flex-1" asChild>
                  <a href={cloudinaryViewUrl(asset.fileUrl)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Open File
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="rounded-xs flex-1" asChild>
                  <a href={cloudinaryDownloadUrl(asset.fileUrl)} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </a>
                </Button>
              </div>
            )}

            <Button className="rounded-xs w-full" onClick={() => onEdit(asset)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Asset
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
