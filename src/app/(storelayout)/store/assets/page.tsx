"use client";

import { useState } from "react";
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
import { FilterPanel } from "@/components/DigitalAssets/FilterPanel";
import { AssetGrid } from "@/components/DigitalAssets/AssetGrid";
import { useAssetFilters } from "@/hooks/useAssetFilters";

export default function StoreAssetsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const {
    search, setSearch,
    debouncedSearch,
    selectedProductLine, setSelectedProductLine,
    selectedAssetType, setSelectedAssetType,
    selectedCategory, setSelectedCategory,
    page, setPage,
    limit, setLimit,
    assets, totalItems, totalPages,
    loading, activeFilters,
    clearFilters, clearAll,
  } = useAssetFilters();

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
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Asset Library
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            Digital Assets
          </h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${totalItems} asset${totalItems !== 1 ? "s" : ""} available for your store`}
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

        {/* Filter drawer — mobile + tablet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden h-10 px-3 rounded-xs gap-2 shrink-0">
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
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2.5 transition-colors ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {(activeFilters > 0 || debouncedSearch) && (
        <div className="flex flex-wrap gap-2 items-center">
          {debouncedSearch && (
            <Badge variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer" onClick={() => setSearch("")}>
              &ldquo;{debouncedSearch}&rdquo; <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedProductLine && (
            <Badge variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer" onClick={() => setSelectedProductLine(undefined)}>
              {selectedProductLine} <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedAssetType && (
            <Badge variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer" onClick={() => setSelectedAssetType(undefined)}>
              {selectedAssetType === "file" ? "Files" : "Text / Copy"} <X className="w-3 h-3" />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer" onClick={() => setSelectedCategory(undefined)}>
              {selectedCategory} <X className="w-3 h-3" />
            </Badge>
          )}
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 bg-card border border-border rounded-xs p-4">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AssetGrid
            assets={assets}
            loading={loading}
            viewMode={viewMode}
            page={page}
            limit={limit}
            totalPages={totalPages}
            totalItems={totalItems}
            hasActiveFilters={activeFilters > 0 || !!debouncedSearch}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onClearAll={clearAll}
          />
        </div>
      </div>
    </div>
  );
}
