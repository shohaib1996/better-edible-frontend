"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AssetCard } from "@/components/DigitalAssets/AssetCard";
import { AssetFilters } from "@/components/DigitalAssets/AssetFilters";
import { useGetDigitalAssetsQuery } from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { ProductLine, AssetType } from "@/types/digitalAssets/digitalAssets";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoreAssetsPage() {
  const [search, setSearch] = useState("");
  const [selectedProductLines, setSelectedProductLines] = useState<ProductLine[]>([]);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<AssetType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useGetDigitalAssetsQuery({ status: "active" });
  const assets = data?.assets ?? [];

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      if (search && !asset.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedProductLines.length > 0 && (!asset.productLine || !selectedProductLines.includes(asset.productLine))) return false;
      if (selectedAssetTypes.length > 0 && !selectedAssetTypes.includes(asset.assetType)) return false;
      return true;
    });
  }, [assets, search, selectedProductLines, selectedAssetTypes]);

  function handleProductLineChange(value: ProductLine, checked: boolean) {
    setSelectedProductLines((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
  }

  function handleAssetTypeChange(value: AssetType, checked: boolean) {
    setSelectedAssetTypes((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
  }

  const hasFilters = selectedProductLines.length > 0 || selectedAssetTypes.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Digital Assets</h1>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xs md:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4 mr-1.5" />
          Filters
          {hasFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
              {selectedProductLines.length + selectedAssetTypes.length}
            </span>
          )}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters — desktop always visible, mobile toggle */}
        <aside
          className={`w-48 shrink-0 space-y-4 ${showFilters ? "block" : "hidden"} md:block`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Filters</p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSelectedProductLines([]);
                  setSelectedAssetTypes([]);
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
          <AssetFilters
            selectedProductLines={selectedProductLines}
            selectedAssetTypes={selectedAssetTypes}
            onProductLineChange={handleProductLineChange}
            onAssetTypeChange={handleAssetTypeChange}
          />
        </aside>

        {/* Asset grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xs" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">No assets found</p>
              {(search || hasFilters) && (
                <button
                  onClick={() => { setSearch(""); setSelectedProductLines([]); setSelectedAssetTypes([]); }}
                  className="mt-2 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((asset) => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
