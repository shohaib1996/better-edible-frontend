"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ImageOff,
  Loader2,
  PackagePlus,
  Calculator,
  Search,
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

// ─── Per-store expanded panel ─────────────────────────────────────────────────

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

  return (
    <div className="flex flex-col divide-y divide-border">
      {labels.map((label) => {
        const img = label.labelImages?.[0]?.secureUrl;
        const qty = quantities[label._id] ?? "";
        return (
          <div
            key={label._id}
            className="flex items-center gap-4 px-5 py-3"
          >
            {/* Thumbnail */}
            <div className="relative h-12 w-12 shrink-0 rounded-xs overflow-hidden border border-border bg-muted flex items-center justify-center">
              {img ? (
                <Image
                  src={img}
                  alt={label.flavorName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <ImageOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Name */}
            <p className="flex-1 font-medium text-sm text-foreground truncate">
              {label.flavorName}
            </p>

            {/* Quantity input */}
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
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const VISIBLE_COUNT = 5;

export default function PackagePrepAdminOrder() {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, Record<string, string>>>({});
  const [calculated, setCalculated] = useState<{ totalLabels: number; totalLines: number } | null>(null);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const { data: clientsData, isLoading: clientsLoading } =
    useGetAllPrivateLabelClientsQuery({
      limit: debouncedSearch.trim() ? 50 : VISIBLE_COUNT,
      search: debouncedSearch.trim() || undefined,
    });

  const [bulkCreateLabelOrders, { isLoading: submitting }] =
    useBulkCreateLabelOrdersMutation();

  // All stores sorted alphabetically
  const stores: StoreEntry[] = useMemo(() => {
    return (clientsData?.clients ?? [])
      .filter((c: any) => c.store)
      .map((c: any) => ({
        clientId: c._id,
        storeId: c.store._id ?? c.store,
        storeName: c.store?.name ?? "Unknown Store",
      }))
      .sort((a: StoreEntry, b: StoreEntry) =>
        a.storeName.localeCompare(b.storeName)
      );
  }, [clientsData]);

  // API already filters + limits — just use stores directly
  const visibleStores = stores;

  function toggleStore(storeId: string) {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      next.has(storeId) ? next.delete(storeId) : next.add(storeId);
      return next;
    });
  }

  function handleQtyChange(storeId: string, labelId: string, value: string) {
    setCalculated(null);
    setQuantities((prev) => ({
      ...prev,
      [storeId]: { ...(prev[storeId] ?? {}), [labelId]: value },
    }));
  }

  // Build order lines from all non-empty quantities
  function buildOrderLines() {
    const lines: { storeId: string; clientId: string; labelId: string; quantity: number }[] = [];
    for (const store of stores) {
      const storeQtys = quantities[store.storeId] ?? {};
      for (const [labelId, raw] of Object.entries(storeQtys)) {
        const qty = parseInt(raw, 10);
        if (!isNaN(qty) && qty > 0) {
          lines.push({ storeId: store.storeId, clientId: store.clientId, labelId, quantity: qty });
        }
      }
    }
    return lines;
  }

  function handleCalculate() {
    const lines = buildOrderLines();
    const totalLabels = lines.reduce((s, l) => s + l.quantity, 0);
    setCalculated({ totalLabels, totalLines: lines.length });
  }

  async function handleSubmit() {
    const lines = buildOrderLines();
    if (lines.length === 0) {
      toast.error("Enter at least one quantity before submitting");
      return;
    }
    try {
      const result = await bulkCreateLabelOrders({
        orders: lines.map((l) => ({
          storeId: l.storeId,
          labelId: l.labelId,
          quantityOrdered: l.quantity,
        })),
      }).unwrap();
      toast.success(`${result.count} label order${result.count !== 1 ? "s" : ""} placed`);
      setQuantities({});
      setCalculated(null);
    } catch {
      toast.error("Failed to place orders");
    }
  }

  if (clientsLoading) {
    return (
      <div className="flex items-center gap-3 py-10 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading stores…</span>
      </div>
    );
  }

  const orderLines = buildOrderLines();
  const hasAny = orderLines.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-xs bg-primary/10 shrink-0">
            <PackagePlus className="w-4 h-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Bulk Label Order</p>
            <p className="text-xs text-muted-foreground">Expand stores, enter quantities, then submit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={!hasAny}
            className="flex items-center gap-2 px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4 shrink-0" />
            Calculate
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasAny || submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            Submit Orders
          </button>
        </div>
      </div>

      {/* Calculate summary */}
      {calculated && (
        <div className="flex items-center gap-3 rounded-xs bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
          <span className="font-semibold text-foreground">
            {calculated.totalLines} SKU{calculated.totalLines !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="font-bold text-primary text-base">
            {calculated.totalLabels.toLocaleString()} total labels
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search stores…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xs border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
        />
      </div>

      {/* Store list */}
      <div className="flex flex-col gap-2">
        {visibleStores.map((store) => {
          const isExpanded = expandedStores.has(store.storeId);
          const storeQtys = quantities[store.storeId] ?? {};
          const filledCount = Object.values(storeQtys).filter(
            (v) => parseInt(v, 10) > 0
          ).length;

          return (
            <div
              key={store.storeId}
              className={cn(
                "rounded-xs border bg-card overflow-hidden transition-colors",
                filledCount > 0 ? "border-primary/40" : "border-border"
              )}
            >
              {/* Store header / toggle */}
              <button
                type="button"
                onClick={() => toggleStore(store.storeId)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-foreground truncate">
                    {store.storeName}
                  </span>
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
                    onChange={(labelId, value) =>
                      handleQtyChange(store.storeId, labelId, value)
                    }
                  />
                </div>
              )}
            </div>
          );
        })}

        {visibleStores.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            {search.trim() ? `No stores matching "${search}"` : "No active stores found."}
          </p>
        )}

      </div>
    </div>
  );
}
