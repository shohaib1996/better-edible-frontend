"use client";

import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy, ImageIcon, Video, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cloudinaryViewUrl, cloudinaryDownloadUrl } from "@/lib/cloudinaryUrl";

interface AssetListRowProps {
  asset: IDigitalAsset;
  last?: boolean;
}

function getFileType(asset: IDigitalAsset): "image" | "video" | "pdf" | "other" {
  const url = asset.fileUrl ?? "";
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (url.includes("/video/upload/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (ext === "pdf" || url.includes("/raw/upload/")) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || url.includes("/image/upload/")) return "image";
  return "other";
}

export function AssetListRow({ asset, last }: AssetListRowProps) {
  function handleCopy() {
    if (!asset.textContent) return;
    navigator.clipboard.writeText(asset.textContent);
    toast.success("Copied to clipboard");
  }

  const type = getFileType(asset);
  const FallbackIcon = type === "video" ? Video : type === "image" ? ImageIcon : FileText;

  return (
    <div className={`flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors ${!last ? "border-b border-border" : ""}`}>
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xs overflow-hidden bg-muted shrink-0">
        {asset.previewUrl ? (
          <img src={cloudinaryViewUrl(asset.previewUrl)} alt={asset.title} className="w-full h-full object-cover" />
        ) : asset.assetType === "text" ? (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FallbackIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{asset.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{asset.category}</span>
          {asset.productLine && (
            <Badge variant="outline" className="text-[10px] rounded-xs px-1.5 py-0 h-4">{asset.productLine}</Badge>
          )}
          {asset.description && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">{asset.description}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {asset.assetType === "file" ? (
          <>
            {asset.fileUrl && (
              <Button size="sm" variant="ghost" className="rounded-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground" asChild>
                <a href={cloudinaryViewUrl(asset.fileUrl)} target="_blank" rel="noopener noreferrer" title="Open">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
            <Button size="sm" className="rounded-xs h-8 px-3 text-xs gap-1.5" disabled={!asset.fileUrl} asChild>
              <a href={asset.fileUrl ? cloudinaryDownloadUrl(asset.fileUrl) : "#"} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="rounded-xs h-8 px-3 text-xs gap-1.5" onClick={handleCopy} disabled={!asset.textContent}>
            <Copy className="w-3.5 h-3.5" />
            Copy
          </Button>
        )}
      </div>
    </div>
  );
}
