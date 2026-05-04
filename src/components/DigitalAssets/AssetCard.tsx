"use client";

import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Copy, FileText, ImageIcon, Video, File } from "lucide-react";
import { toast } from "sonner";

interface AssetCardProps {
  asset: IDigitalAsset;
}

function AssetPreview({ asset }: { asset: IDigitalAsset }) {
  if (asset.assetType === "text") {
    return (
      <div className="h-36 bg-muted rounded-xs flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground line-clamp-4 text-center">
          {asset.textContent}
        </p>
      </div>
    );
  }

  if (asset.previewUrl) {
    return (
      <div className="h-36 bg-muted rounded-xs overflow-hidden">
        <img
          src={asset.previewUrl}
          alt={asset.title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const ext = asset.fileUrl?.split(".").pop()?.toLowerCase();
  const Icon =
    ext && ["mp4", "mov", "avi", "webm"].includes(ext)
      ? Video
      : ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
      ? ImageIcon
      : File;

  return (
    <div className="h-36 bg-muted rounded-xs flex items-center justify-center">
      <Icon className="w-10 h-10 text-muted-foreground" />
    </div>
  );
}

export function AssetCard({ asset }: AssetCardProps) {
  function handleDownload() {
    if (!asset.fileUrl) return;
    const a = document.createElement("a");
    a.href = asset.fileUrl;
    a.download = asset.title;
    a.target = "_blank";
    a.click();
  }

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
          <Button
            size="sm"
            className="w-full rounded-xs"
            onClick={handleDownload}
            disabled={!asset.fileUrl}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download
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
