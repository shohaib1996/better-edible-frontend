"use client";

import { Card } from "@/components/ui/card";
import type { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { getCategoryColor, categoryIcon, fmtDate } from "./_constants";

export function AssetCard({ asset }: { asset: IDigitalAsset }) {
  const catColor = getCategoryColor(asset.category);
  const displayDate = fmtDate(asset.updatedAt || asset.createdAt);

  const handleDownload = () => {
    if (!asset.fileUrl) return;
    const a = document.createElement("a");
    a.href = asset.fileUrl;
    a.download = asset.title;
    a.target = "_blank";
    a.click();
  };

  return (
    <Card className="p-4 flex flex-col" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
      {asset.previewUrl ? (
        <div className="w-full h-36 rounded overflow-hidden mb-3 bg-[#f5f2e8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.previewUrl} alt={asset.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="w-full h-36 rounded mb-3 flex items-center justify-center"
          style={{ background: catColor.bg }}
        >
          <span className="text-4xl">{categoryIcon(asset.category)}</span>
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold leading-snug" style={{ color: "#2a2518" }}>
            {asset.title}
          </h4>
          {asset.category && (
            <span
              className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
              style={{ background: catColor.bg, color: catColor.text }}
            >
              {asset.category}
            </span>
          )}
        </div>
        {asset.productLine && (
          <p className="text-[10px] mb-1 font-medium uppercase tracking-wide" style={{ color: "#9a8f6e" }}>
            {asset.productLine}
          </p>
        )}
        {asset.description && (
          <p className="text-xs mb-2 leading-relaxed line-clamp-2" style={{ color: "#6b6045" }}>
            {asset.description}
          </p>
        )}
        {displayDate && (
          <p className="text-xs" style={{ color: "#9a8f6e" }}>{displayDate}</p>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={!asset.fileUrl}
        className="mt-3 w-full py-2 rounded text-sm font-medium transition-colors"
        style={{
          background: asset.fileUrl ? "#c45a1a" : "#e5e0c8",
          color: asset.fileUrl ? "#fff" : "#9a8f6e",
          cursor: asset.fileUrl ? "pointer" : "not-allowed",
        }}
      >
        {asset.fileUrl ? "↓ Download" : "Unavailable"}
      </button>
    </Card>
  );
}
