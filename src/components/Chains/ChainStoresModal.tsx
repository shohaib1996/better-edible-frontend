"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetAllStoresQuery } from "@/redux/api/Stores/stores";
import {
  useGetChainRollupQuery,
  useUpdateChainStoresMutation,
  type IChain,
} from "@/redux/api/Chains/chainsApi";

interface Props {
  chain: IChain;
  open: boolean;
  onClose: () => void;
}

export function ChainStoresModal({ chain, open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  const { data: rollup, isLoading: rollupLoading } = useGetChainRollupQuery(chain.id, { skip: !open });
  const { data: searchData, isLoading: storesLoading, refetch } = useGetAllStoresQuery(
    { limit: 50, page: 1, search: debouncedSearch || undefined },
    { skip: !open }
  );
  const [updateChainStores, { isLoading: saving }] = useUpdateChainStoresMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (open) refetch();
  }, [debouncedSearch, open]);

  useEffect(() => {
    if (open && rollup && !initialized.current) {
      setSelectedIds(new Set(rollup.stores.map((s) => s.id.toString())));
      initialized.current = true;
    }
    if (!open) {
      initialized.current = false;
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open, rollup]);

  const memberMap = useMemo(() => {
    const m = new Map<string, any>();
    (rollup?.stores ?? []).forEach((s) =>
      m.set(s.id.toString(), { _id: s.id, storeId: s.storeId, name: s.name, city: s.city })
    );
    return m;
  }, [rollup]);

  const searchedStores: any[] = searchData?.stores ?? [];

  const displayStores = useMemo(() => {
    const seen = new Set<string>();
    const rows: any[] = [];
    if (!search.trim()) {
      memberMap.forEach((s) => {
        if (selectedIds.has(s._id.toString())) {
          seen.add(s._id.toString());
          rows.push(s);
        }
      });
    }
    searchedStores.forEach((s) => {
      if (!seen.has(s._id)) { seen.add(s._id); rows.push(s); }
    });
    return rows;
  }, [searchedStores, memberMap, selectedIds, search]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    const result = await updateChainStores({ id: chain.id, storeIds: Array.from(selectedIds) });
    if (!("error" in result)) onClose();
  }

  if (!open) return null;

  const loading = rollupLoading || storesLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-xs shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stores in {chain.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Check the stores that belong to this chain. New members inherit the chain's buying mode default; you can fine-tune each store's switches later.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-4 mt-0.5 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {rollup && (
          <div className="grid grid-cols-3 divide-x border-b border-border shrink-0">
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold text-foreground">{selectedIds.size}</p>
              <p className="text-xs text-muted-foreground">Stores</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold text-foreground">{rollup.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold text-foreground">${rollup.totalDue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total due</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_1fr] px-4 py-2 border-b border-border bg-muted/40 shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="w-8" />
          <div>Store</div>
          <div>Location</div>
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : displayStores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No stores found.</p>
          ) : (
            displayStores.map((store: any) => {
              const checked = selectedIds.has(store._id.toString());
              return (
                <div
                  key={store._id}
                  className={`grid grid-cols-[auto_1fr_1fr] items-center px-4 py-2.5 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/40 ${checked ? "bg-primary/5" : ""}`}
                  onClick={() => toggle(store._id.toString())}
                >
                  <div className="w-8 flex items-center">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(store._id.toString())}
                      onClick={(e) => e.stopPropagation()}
                      className="border-accent"
                    />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${checked ? "text-primary" : "text-foreground"}`}>
                      {store.name}
                    </p>
                    {store.storeId && (
                      <p className="text-xs text-muted-foreground font-mono">{store.storeId}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {store.city || store.address || "—"}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="rounded-xs">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xs bg-primary text-primary-foreground">
              {saving ? "Saving…" : "Save Members"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
