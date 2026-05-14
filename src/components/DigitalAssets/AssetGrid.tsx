"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetCard } from "./AssetCard";
import { AssetListRow } from "./AssetListRow";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";

interface AssetGridProps {
  assets: IDigitalAsset[];
  loading: boolean;
  viewMode: "grid" | "list";
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasActiveFilters: boolean;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onClearAll: () => void;
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xs border border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="h-44 bg-muted animate-pulse" />
          <div className="p-3 flex flex-col gap-3 flex-1">
            <div className="space-y-2">
              <div className="h-3.5 bg-muted animate-pulse rounded-xs w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded-xs w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded-xs w-1/4" />
            </div>
            <div className="h-8 bg-muted animate-pulse rounded-xs mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onClearAll,
}: {
  hasActiveFilters: boolean;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-xs bg-muted flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-semibold text-base">No assets found</p>
      <p className="text-muted-foreground text-sm mt-1">
        Try adjusting your search or filters
      </p>
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-xs mt-4"
          onClick={onClearAll}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

export function AssetGrid({
  assets,
  loading,
  viewMode,
  page,
  limit,
  totalPages,
  totalItems,
  hasActiveFilters,
  onPageChange,
  onLimitChange,
  onClearAll,
}: AssetGridProps) {
  if (loading) return <SkeletonCards />;

  if (assets.length === 0) {
    return <EmptyState hasActiveFilters={hasActiveFilters} onClearAll={onClearAll} />;
  }

  return (
    <div className="space-y-5">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xs overflow-hidden bg-card">
          {assets.map((asset, i) => (
            <AssetListRow
              key={asset._id}
              asset={asset}
              last={i === assets.length - 1}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <GlobalPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={onPageChange}
          onLimitChange={(l) => {
            onLimitChange(l);
            onPageChange(1);
          }}
          limitOptions={[12, 24, 48]}
        />
      )}
    </div>
  );
}
