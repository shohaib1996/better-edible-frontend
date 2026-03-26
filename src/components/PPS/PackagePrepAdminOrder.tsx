"use client";

import { useState, useRef, useEffect } from "react";
import { PackagePlus, Loader2, Search, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useCreateLabelOrderMutation } from "@/redux/api/PrivateLabel/ppsApi";
import { cn } from "@/lib/utils";

// ─── Searchable Private Label Store Picker ────────────────────────────────────

function PLStoreSelect({
  clients,
  value,
  onChange,
}: {
  clients: any[];
  value: string;
  onChange: (clientId: string, storeId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = clients.filter((c) =>
    (c.store?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selected = clients.find((c) => c._id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xs border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? selected.store?.name : "Select a store…"}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xs border border-border bg-popover shadow-lg">
          <div className="sticky top-0 bg-popover border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search stores…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xs border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No stores found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    onChange(c._id, c.store?._id ?? "");
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xs px-2 py-2 text-sm text-popover-foreground transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === c._id && "bg-primary/10"
                  )}
                >
                  <span className="font-medium">{c.store?.name ?? c._id}</span>
                  {value === c._id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackagePrepAdminOrder() {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: clientsData } = useGetAllPrivateLabelClientsQuery({ limit: 200 });
  const clients = clientsData?.clients ?? [];

  const { data: labelsData } = useGetAllLabelsQuery(
    { clientId: selectedClientId, stage: "ready_for_production", limit: 100 },
    { skip: !selectedClientId }
  );
  const labels = labelsData?.labels ?? [];

  const [createLabelOrder, { isLoading }] = useCreateLabelOrderMutation();

  function reset() {
    setSelectedClientId("");
    setSelectedStoreId("");
    setSelectedLabelId("");
    setQuantity("");
    setNotes("");
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStoreId || !selectedLabelId || !quantity) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error("Enter a valid quantity");
      return;
    }

    try {
      await createLabelOrder({
        storeId: selectedStoreId,
        labelId: selectedLabelId,
        quantityOrdered: qty,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("Label order placed");
      handleClose();
    } catch {
      toast.error("Failed to place order");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold self-start"
      >
        <PackagePlus className="w-4 h-4" />
        Place Label Order
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" />
              Place Label Order
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* Store — private label clients only */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Store</label>
              <PLStoreSelect
                clients={clients}
                value={selectedClientId}
                onChange={(clientId, storeId) => {
                  setSelectedClientId(clientId);
                  setSelectedStoreId(storeId);
                  setSelectedLabelId("");
                }}
              />
            </div>

            {/* Label / SKU */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Label / SKU</label>
              <select
                value={selectedLabelId}
                onChange={(e) => setSelectedLabelId(e.target.value)}
                className="rounded-xs border bg-background px-3 py-2 text-sm"
                required
                disabled={!selectedClientId}
              >
                <option value="">
                  {selectedClientId ? "Select a label…" : "Select a store first"}
                </option>
                {labels.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.flavorName}
                  </option>
                ))}
              </select>
              {selectedClientId && labels.length === 0 && (
                <p className="text-xs text-muted-foreground">No ready-for-production labels for this store.</p>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Quantity to Order</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1000"
                className="rounded-xs border bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes for this order…"
                className="rounded-xs border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isLoading || !selectedStoreId || !selectedLabelId || !quantity}
                className="flex items-center gap-2 px-5 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Order
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xs bg-muted text-muted-foreground text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
