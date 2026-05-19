"use client";

import { ImageIcon, FileText, Eye, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IDigitalAsset, AssetCategory } from "@/types/digitalAssets/digitalAssets";
import { cloudinaryViewUrl } from "@/lib/cloudinaryUrl";
import { cn } from "@/lib/utils";

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  Banner: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  ProductImage: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  Video: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  Email: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Flyer: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  Social: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  Text: "bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  Other: "bg-muted text-muted-foreground border-border",
};

interface AssetCardDesignerProps {
  asset: IDigitalAsset;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function AssetCardDesigner({ asset, onView, onEdit, onArchive, onDelete }: AssetCardDesignerProps) {
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
            {asset.assetType === "text" ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
            <span className="text-[10px] uppercase tracking-widest font-medium">{asset.assetType}</span>
          </div>
        )}
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
          <Badge variant="outline" className={cn("rounded-xs text-[10px] px-1.5 py-0", CATEGORY_COLORS[asset.category])}>
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
          <Eye className="w-3 h-3" /> View
        </Button>
        <Button size="sm" variant="outline" className="rounded-xs h-7 text-xs flex-1 gap-1" onClick={onEdit}>
          <Pencil className="w-3 h-3" /> Edit
        </Button>
        <Button
          size="sm" variant="ghost"
          className="rounded-xs h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onArchive}
          title={asset.status === "active" ? "Archive" : "Restore"}
        >
          {asset.status === "active" ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="sm" variant="ghost"
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
