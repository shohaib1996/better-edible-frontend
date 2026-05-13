"use client";

import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Copy, ImageIcon, Video, FileText } from "lucide-react";
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
      <div className="h-36 bg-muted rounded-xs flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground line-clamp-4 text-center">{asset.textContent}</p>
      </div>
    );
  }

  if (asset.previewUrl) {
    return (
      <div className="h-36 bg-muted rounded-xs overflow-hidden">
        <img src={cloudinaryViewUrl(asset.previewUrl)} alt={asset.title} className="w-full h-full object-cover" />
      </div>
    );
  }

  const type = getFileType(asset);
  const Icon = type === "video" ? Video : type === "image" ? ImageIcon : FileText;
  const label = type === "video" ? "Video" : type === "pdf" ? "PDF" : type === "image" ? "Image" : "File";

  return (
    <div className="h-36 bg-muted rounded-xs flex flex-col items-center justify-center gap-2">
      <Icon className="w-10 h-10 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
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
    <Card className="rounded-xs border border-border/50 hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="p-3 flex flex-col gap-3 flex-1">
        <AssetPreview asset={asset} />

        <div className="flex-1 space-y-1.5">
          <p className="font-medium text-sm leading-snug line-clamp-2">{asset.title}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs rounded-xs px-1.5 py-0">
              {asset.category}
            </Badge>
            {asset.productLine && (
              <Badge variant="outline" className="text-xs rounded-xs px-1.5 py-0">
                {asset.productLine}
              </Badge>
            )}
          </div>
        </div>

        {asset.assetType === "file" ? (
          <Button size="sm" className="w-full rounded-xs" disabled={!asset.fileUrl} asChild>
            <a
              href={asset.fileUrl ? cloudinaryDownloadUrl(asset.fileUrl) : "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-xs"
            onClick={handleCopy}
            disabled={!asset.textContent}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy Text
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
