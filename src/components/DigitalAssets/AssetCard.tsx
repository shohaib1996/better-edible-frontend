"use client";

import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy, ImageIcon, Video, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cloudinaryViewUrl, cloudinaryDownloadUrl } from "@/lib/cloudinaryUrl";

interface AssetCardProps {
  asset: IDigitalAsset;
}

function getFileType(asset: IDigitalAsset): "image" | "video" | "pdf" | "other" {
  const url = asset.fileUrl ?? "";
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (url.includes("/video/upload/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (ext === "pdf" || url.includes("/raw/upload/")) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || url.includes("/image/upload/")) return "image";
  return "other";
}

function AssetPreview({ asset }: { asset: IDigitalAsset }) {
  if (asset.assetType === "text") {
    return (
      <div className="h-44 bg-muted/60 flex items-center justify-center p-5">
        <p className="text-sm text-muted-foreground line-clamp-5 text-center leading-relaxed italic">
          &ldquo;{asset.textContent}&rdquo;
        </p>
      </div>
    );
  }

  if (asset.previewUrl) {
    return (
      <div className="h-44 bg-muted overflow-hidden">
        <img
          src={cloudinaryViewUrl(asset.previewUrl)}
          alt={asset.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  const type = getFileType(asset);
  const Icon = type === "video" ? Video : type === "image" ? ImageIcon : FileText;
  const label = type === "video" ? "Video" : type === "pdf" ? "PDF" : type === "image" ? "Image" : "File";

  return (
    <div className="h-44 bg-muted/60 flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 rounded-xs bg-background/80 flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function AssetCard({ asset }: AssetCardProps) {
  function handleCopy() {
    if (!asset.textContent) return;
    navigator.clipboard.writeText(asset.textContent);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="group rounded-xs border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Preview */}
      <div className="relative overflow-hidden">
        <AssetPreview asset={asset} />
        {/* Category pill overlay */}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-background/90 backdrop-blur-sm text-foreground px-2 py-0.5 rounded-xs border border-border/50">
            {asset.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3 flex-1">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{asset.title}</p>
          {asset.productLine && (
            <Badge variant="outline" className="text-[10px] rounded-xs px-1.5 py-0 h-4">
              {asset.productLine}
            </Badge>
          )}
          {asset.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{asset.description}</p>
          )}
        </div>

        {/* Actions */}
        {asset.assetType === "file" ? (
          <div className="flex gap-1.5">
            <Button size="sm" className="flex-1 rounded-xs h-8 text-xs" disabled={!asset.fileUrl} asChild>
              <a href={asset.fileUrl ? cloudinaryDownloadUrl(asset.fileUrl) : "#"} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </a>
            </Button>
            {asset.fileUrl && (
              <Button size="sm" variant="outline" className="rounded-xs h-8 w-8 p-0 shrink-0" asChild>
                <a href={cloudinaryViewUrl(asset.fileUrl)} target="_blank" rel="noopener noreferrer" title="Open file">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-xs h-8 text-xs"
            onClick={handleCopy}
            disabled={!asset.textContent}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy Text
          </Button>
        )}
      </div>
    </div>
  );
}
