"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, X, SlidersHorizontal, LayoutGrid, List, Sparkles,
  Plus, ClipboardList, ChevronRight, Calendar, RefreshCw,
} from "lucide-react";
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
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { useGetMyDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import { getStoreUser } from "@/lib/storeUser";
import type { IDesignRequest } from "@/types/designRequests/designRequests";

type Tab = "assets" | "requests";

function RequestCard({ req }: { req: IDesignRequest }) {
  return (
    <Link
      href={`/store/design-requests/${req._id}`}
      className="group block bg-card border border-border rounded-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      <div className="px-4 py-4 flex items-center gap-4">
        <div className={`w-1 self-stretch rounded-full shrink-0 ${
          req.status === "completed" ? "bg-green-500" :
          req.status === "in-progress" ? "bg-amber-400" :
          req.status === "revision-requested" ? "bg-orange-500" :
          "bg-muted-foreground/30"
        }`} />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {req.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <RequestStatusBadge status={req.status} />
            <Badge variant="outline" className="rounded-xs text-xs capitalize">{req.requestType}</Badge>
            {req.productLine && (
              <Badge variant="secondary" className="rounded-xs text-xs">{req.productLine}</Badge>
            )}
            {req.revisionCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xs px-1.5 py-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function StoreAssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "assets";

  function setTab(t: Tab) {
    router.replace(`/store/assets?tab=${t}`);
  }

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contactId, setContactId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoreUser();
    if (user) setContactId((user as any).contactId ?? null);
  }, []);

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

  const { data: requestsData, isLoading: isLoadingRequests } = useGetMyDesignRequestsQuery(
    { contactId: contactId! },
    { skip: !contactId },
  );

  const requests = requestsData?.requests ?? [];
  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    revision: requests.filter((r) => r.status === "revision-requested").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

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
        <div className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }} />
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

      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        {([
          { id: "assets" as Tab, label: "Asset Library" },
          { id: "requests" as Tab, label: "My Requests", count: requests.length || undefined },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Asset Library tab ── */}
      {tab === "assets" && (
        <>
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

          <div className="flex gap-6">
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-xs p-4">
                <FilterPanel {...filterPanelProps} />
              </div>
            </aside>
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
        </>
      )}

      {/* ── My Requests tab ── */}
      {tab === "requests" && (
        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoadingRequests ? "Loading…" : `${requests.length} total request${requests.length !== 1 ? "s" : ""}`}
            </p>
            <Button asChild className="rounded-xs h-9 gap-1.5">
              <Link href="/store/design-requests/new">
                <Plus className="w-4 h-4" />
                New Request
              </Link>
            </Button>
          </div>

          {/* Stats */}
          {!isLoadingRequests && requests.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Pending", count: counts.pending, color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
                { label: "In Progress", count: counts.inProgress, color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" },
                { label: "Revision", count: counts.revision, color: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
                { label: "Completed", count: counts.completed, color: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
              ].map(({ label, count, color, dot }) => (
                <div key={label} className="bg-card border border-border rounded-xs px-4 py-3 flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                  <div>
                    <p className={`text-lg font-bold leading-none ${color}`}>{count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List */}
          {isLoadingRequests ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xs px-4 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-1 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded-xs w-2/3" />
                    <div className="h-3 bg-muted rounded-xs w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xs bg-card">
              <div className="w-16 h-16 rounded-xs bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-base">No design requests yet</p>
              <p className="text-muted-foreground text-sm mt-1">Submit your first request and our team will get started</p>
              <Button asChild className="rounded-xs mt-5">
                <Link href="/store/design-requests/new">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Submit a Request
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {requests.map((req) => (
                <RequestCard key={req._id} req={req} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
