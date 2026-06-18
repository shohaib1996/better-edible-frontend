"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ImageOff,
  Loader2,
  Search,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useBulkCreateLabelOrdersMutation } from "@/redux/api/PrivateLabel/ppsApi";
import { cn } from "@/lib/utils";
import type { ILabel } from "@/types/privateLabel/label";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreEntry {
  clientId: string;
  storeId: string;
  storeName: string;
}

// ─── Per-store expanded panel (display + inputs only, no submit) ──────────────

function StoreLabelPanel({
  clientId,
  quantities,
  onChange,
}: {
  clientId: string;
  quantities: Record<string, string>;
  onChange: (labelId: string, value: string) => void;
}) {
  const { data, isFetching } = useGetAllLabelsQuery(
    { clientId, stage: "ready_for_production", limit: 100 },
    { skip: !clientId }
  );

  const labels: ILabel[] = data?.labels ?? [];

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 px-5 py-4 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading labels…
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">
        No approved labels for this store.
      </p>
    );
  }

  const filledLines = labels.filter((l) => {
    const qty = parseInt(quantities[l._id] ?? "", 10);
    return !isNaN(qty) && qty > 0;
  });
  const totalQty = filledLines.reduce((s, l) => s + parseInt(quantities[l._id], 10), 0);

  return (
    <div className="flex flex-col">
      {/* Label rows */}
      <div className="flex flex-col divide-y divide-border">
        {labels.map((label) => {
          const img = label.labelImages?.[0]?.secureUrl;
          const qty = quantities[label._id] ?? "";
          return (
            <div key={label._id} className="flex items-center gap-4 px-5 py-3">
              <div className="relative h-12 w-12 shrink-0 rounded-xs overflow-hidden border border-border bg-muted flex items-center justify-center">
                {img ? (
                  <Image src={img} alt={label.flavorName} fill className="object-cover" sizes="48px" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="flex-1 font-medium text-sm text-foreground truncate">
                {label.flavorName}
              </p>
              <input
                type="number"
                min={1}
                placeholder="Qty"
                value={qty}
                onChange={(e) => onChange(label._id, e.target.value)}
                className="w-28 rounded-xs border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              />
            </div>
          );
        })}
      </div>

      {/* Info row */}
      {filledLines.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filledLines.length} SKU{filledLines.length !== 1 ? "s" : ""}</span>
            {" · "}
            <span className="font-semibold text-foreground">{totalQty.toLocaleString()}</span> labels entered
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PackagePrepAdminOrder() {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, Record<string, string>>>({});
  const [search, setSearch] = useState("");
  // Stores that have been expanded at least once — persisted across search changes
  const [pinnedStores, setPinnedStores] = useState<StoreEntry[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const [bulkCreateLabelOrders, { isLoading: submittingAll }] = useBulkCreateLabelOrdersMutation();

  const { data: clientsData, isLoading: clientsLoading } =
    useGetAllPrivateLabelClientsQuery({
      limit: debouncedSearch.trim() ? 50 : 10,
      search: debouncedSearch.trim() || undefined,
    });

  const searchResultStores: StoreEntry[] = useMemo(() => {
    return (clientsData?.clients ?? [])
      .filter((c: any) => c.store)
      .map((c: any) => ({
        clientId: c._id,
        storeId: c.store._id ?? c.store,
        storeName: c.store?.name ?? "Unknown Store",
      }))
      .sort((a: StoreEntry, b: StoreEntry) => a.storeName.localeCompare(b.storeName));
  }, [clientsData]);

  // Merge pinned stores with current search results — pinned always stay visible
  const displayedStores = useMemo(() => {
    const pinnedIds = new Set(pinnedStores.map((s) => s.storeId));
    const freshSearchResults = debouncedSearch.trim()
      ? searchResultStores.filter((s) => !pinnedIds.has(s.storeId))
      : [];
    return [...pinnedStores, ...freshSearchResults].sort((a, b) =>
      a.storeName.localeCompare(b.storeName)
    );
  }, [pinnedStores, searchResultStores, debouncedSearch]);

  function toggleStore(storeId: string, storeEntry?: StoreEntry) {
    const isCurrentlyExpanded = expandedStores.has(storeId);
    setExpandedStores((prev) => {
      const next = new Set(prev);
      isCurrentlyExpanded ? next.delete(storeId) : next.add(storeId);
      return next;
    });
    // Pin when expanding so it survives search changes
    if (!isCurrentlyExpanded && storeEntry) {
      setPinnedStores((prev) =>
        prev.some((s) => s.storeId === storeId) ? prev : [...prev, storeEntry]
      );
    }
  }

  function handleQtyChange(storeId: string, labelId: string, value: string) {
    setQuantities((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] ?? {}), [labelId]: value },
    }));
  }

  async function handlePlaceAllOrders() {
    // Build one combined orders array from all stores' quantities
    const allOrders: { storeId: string; labelId: string; quantityOrdered: number }[] = [];
    for (const [storeId, storeQtys] of Object.entries(quantities)) {
      for (const [labelId, raw] of Object.entries(storeQtys)) {
        const qty = parseInt(raw, 10);
        if (!isNaN(qty) && qty > 0) {
          allOrders.push({ storeId, labelId, quantityOrdered: qty });
        }
      }
    }

    if (allOrders.length === 0) {
      toast.error("Enter at least one quantity before placing orders");
      return;
    }

    try {
      const result = await bulkCreateLabelOrders({ orders: allOrders }).unwrap();
      toast.success(`${result.count} order${result.count !== 1 ? "s" : ""} placed successfully`);
      // Clear everything
      setQuantities({});
      setExpandedStores(new Set());
      setPinnedStores([]);
    } catch {
      toast.error("Failed to place orders");
    }
  }

  // Computed totals for the "Place All Orders" button label
  const orderSummary = useMemo(() => {
    let totalLabels = 0;
    let totalSkus = 0;
    const storesWithOrders = new Set<string>();
    for (const [storeId, storeQtys] of Object.entries(quantities)) {
      for (const raw of Object.values(storeQtys)) {
        const qty = parseInt(raw, 10);
        if (!isNaN(qty) && qty > 0) {
          totalLabels += qty;
          totalSkus++;
          storesWithOrders.add(storeId);
        }
      }
    }
    return { totalLabels, totalSkus, totalStores: storesWithOrders.size };
  }, [quantities]);

  const hasAny = orderSummary.totalSkus > 0;

  if (clientsLoading) {
    return (
      <div className="flex items-center gap-3 py-10 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading stores…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search stores…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xs border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Expand stores and enter quantities, then place all orders at once.</p>

      {/* Store list */}
      <div className="flex flex-col gap-2">
        {displayedStores.length === 0 && !debouncedSearch.trim() && (
          <p className="text-sm text-muted-foreground text-center py-8">Search for a store above to get started.</p>
        )}
        {displayedStores.length === 0 && debouncedSearch.trim() && (
          <p className="text-sm text-muted-foreground text-center py-10">
            No stores matching &quot;{debouncedSearch}&quot;
          </p>
        )}
        {displayedStores.map((store) => {
          const isExpanded = expandedStores.has(store.storeId);
          const storeQtys = quantities[store.storeId] ?? {};
          const filledCount = Object.values(storeQtys).filter((v) => parseInt(v, 10) > 0).length;

          return (
            <div
              key={store.storeId}
              className={cn(
                "rounded-xs border bg-card overflow-hidden transition-colors",
                filledCount > 0 ? "border-primary/40" : "border-border"
              )}
            >
              {/* Store header */}
              <button
                type="button"
                onClick={() => toggleStore(store.storeId, store)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-foreground truncate">{store.storeName}</span>
                  {filledCount > 0 && (
                    <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      {filledCount} SKU{filledCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {/* Expanded label rows */}
              {isExpanded && (
                <div className="border-t border-border">
                  <StoreLabelPanel
                    clientId={store.clientId}
                    quantities={storeQtys}
                    onChange={(labelId, value) => handleQtyChange(store.storeId, labelId, value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Place All Orders — shown when any quantity is entered */}
      {hasAny && (
        <div className="flex items-center justify-between gap-4 rounded-xs border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 px-4 py-3 mt-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            <span className="font-bold">{orderSummary.totalStores} store{orderSummary.totalStores !== 1 ? "s" : ""}</span>
            {" · "}
            <span className="font-bold">{orderSummary.totalSkus} SKU{orderSummary.totalSkus !== 1 ? "s" : ""}</span>
            {" · "}
            <span className="font-bold">{orderSummary.totalLabels.toLocaleString()} labels</span>
          </p>
          <button
            type="button"
            onClick={handlePlaceAllOrders}
            disabled={submittingAll}
            className="flex items-center gap-2 px-5 py-2 rounded-xs bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submittingAll ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <PackageCheck className="w-4 h-4 shrink-0" />
            )}
            {submittingAll ? "Placing Orders…" : "Place All Orders"}
          </button>
        </div>
      )}
    </div>
  );
}
