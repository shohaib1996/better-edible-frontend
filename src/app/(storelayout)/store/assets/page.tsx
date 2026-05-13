"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, SlidersHorizontal, LayoutGrid, List, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AssetCard } from "@/components/DigitalAssets/AssetCard";
import { AssetListRow } from "@/components/DigitalAssets/AssetListRow";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { useGetDigitalAssetsQuery } from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { ProductLine, AssetType, AssetCategory } from "@/types/digitalAssets/digitalAssets";

const PRODUCT_LINES: ProductLine[] = ["CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy"];
const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "file", label: "Files" },
  { value: "text", label: "Text / Copy" },
];
const CATEGORY_OPTIONS: AssetCategory[] = [
  "Banner", "ProductImage", "Video", "Email", "Flyer", "Social", "Text", "Other",
];

// Shared filter panel — used in both the Sheet and the desktop sidebar
function FilterPanel({
  selectedProductLine,
  selectedAssetType,
  selectedCategory,
  onProductLine,
  onAssetType,
  onCategory,
  onClear,
  activeFilters,
}: {
  selectedProductLine: ProductLine | undefined;
  selectedAssetType: AssetType | undefined;
  selectedCategory: AssetCategory | undefined;
  onProductLine: (v: ProductLine | undefined) => void;
  onAssetType: (v: AssetType | undefined) => void;
  onCategory: (v: AssetCategory | undefined) => void;
  onClear: () => void;
  activeFilters: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Filters</span>
        {activeFilters > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Product Line */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Product Line
        </p>
        {PRODUCT_LINES.map((pl) => {
          const active = selectedProductLine === pl;
          return (
            <button
              key={pl}
              onClick={() => onProductLine(active ? undefined : pl)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-sm text-left transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                  active ? "bg-primary" : "bg-border"
                }`}
              />
              {pl}
            </button>
          );
        })}
      </div>

      {/* Asset Type */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Asset Type
        </p>
        {ASSET_TYPES.map(({ value, label }) => {
          const active = selectedAssetType === value;
          return (
            <button
              key={value}
              onClick={() => onAssetType(active ? undefined : value)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-sm text-left transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                  active ? "bg-primary" : "bg-border"
                }`}
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Category
        </p>
        {CATEGORY_OPTIONS.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategory(active ? undefined : cat)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xs text-sm text-left transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                  active ? "bg-primary" : "bg-border"
                }`}
              />
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StoreAssetsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProductLine, setSelectedProductLine] = useState<ProductLine | undefined>(undefined);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const resetPage = useCallback(() => setPage(1), []);
  useEffect(() => {
    resetPage();
  }, [debouncedSearch, selectedProductLine, selectedAssetType, selectedCategory, resetPage]);

  const { data, isLoading, isFetching } = useGetDigitalAssetsQuery({
    status: "active",
    search: debouncedSearch || undefined,
    productLine: selectedProductLine,
    assetType: selectedAssetType,
    category: selectedCategory,
    page,
    limit,
  });

  const assets = data?.assets ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const activeFilters = [selectedProductLine, selectedAssetType, selectedCategory].filter(Boolean).length;
  const loading = isLoading || isFetching;

  function clearFilters() {
    setSelectedProductLine(undefined);
    setSelectedAssetType(undefined);
    setSelectedCategory(undefined);
  }

  function clearAll() {
    setSearch("");
    clearFilters();
    setPage(1);
  }

  const filterPanelProps = {
    selectedProductLine,
    selectedAssetType,
    selectedCategory,
    onProductLine: setSelectedProductLine,
    onAssetType: setSelectedAssetType,
    onCategory: setSelectedCategory,
    onClear: clearFilters,
    activeFilters,
  };

  return (
    <div className="space-y-5">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        {/* light mode radial glow */}
        <div className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        {/* dark mode brand accent glow */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Asset Library
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">Digital Assets</h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            {loading
              ? "Loading…"
              : `${totalItems} asset${totalItems !== 1 ? "s" : ""} available for your store`}
          </p>
        </div>
      </div>

      {/* Search + controls row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 rounded-xs h-10"
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

        {/* Filter button — mobile + tablet (hidden on lg+) */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="lg:hidden h-10 px-3 rounded-xs gap-2 shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Filters</span>
              {activeFilters > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
              <SheetTitle className="text-base">Filters</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel {...filterPanelProps} />
            </div>
          </SheetContent>
        </Sheet>

        {/* View toggle — hidden on mobile */}
        <div className="hidden sm:flex items-center border border-border rounded-xs overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2.5 transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2.5 transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {(activeFilters > 0 || debouncedSearch) && (
        <div className="flex flex-wrap gap-2 items-center">
          {debouncedSearch && (
            <Badge
              variant="secondary"
              className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer"
              onClick={() => setSearch("")}
            >
              &ldquo;{debouncedSearch}&rdquo; <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedProductLine && (
            <Badge
              variant="secondary"
              className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer"
              onClick={() => setSelectedProductLine(undefined)}
            >
              {selectedProductLine} <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedAssetType && (
            <Badge
              variant="secondary"
              className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer"
              onClick={() => setSelectedAssetType(undefined)}
            >
              {selectedAssetType === "file" ? "Files" : "Text / Copy"} <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedCategory && (
            <Badge
              variant="secondary"
              className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer"
              onClick={() => setSelectedCategory(undefined)}
            >
              {selectedCategory} <X className="w-3 h-3" />
            </Badge>
          )}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar — only visible lg+ */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 bg-card border border-border rounded-xs p-4">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xs border border-border bg-card overflow-hidden flex flex-col">
                  {/* image area */}
                  <div className="h-44 bg-muted animate-pulse" />
                  {/* body */}
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
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-xs bg-muted flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-base">No assets found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search or filters
              </p>
              {(debouncedSearch || activeFilters > 0) && (
                <Button variant="outline" size="sm" className="rounded-xs mt-4" onClick={clearAll}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* 1 col on mobile, 2 on tablet, 3 on desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-xs overflow-hidden bg-card">
              {assets.map((asset, i) => (
                <AssetListRow key={asset._id} asset={asset} last={i === assets.length - 1} />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <GlobalPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              limitOptions={[12, 24, 48]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
