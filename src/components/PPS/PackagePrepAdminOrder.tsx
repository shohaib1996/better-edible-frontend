"use client";

import { useState, useRef, useEffect } from "react";
import { PackagePlus, Loader2, Search, ChevronDown, Check, ImageOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useCreateLabelOrderMutation } from "@/redux/api/PrivateLabel/ppsApi";
import { ILabel } from "@/types/privateLabel/label";
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
          "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? selected.store?.name : "Select a store…"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xs border border-border bg-popover shadow-lg">
          <div className="sticky top-0 bg-popover border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search stores…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xs border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
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
                    "flex w-full items-center justify-between rounded-xs px-3 py-2 text-sm text-popover-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    value === c._id && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <span>{c.store?.name ?? c._id}</span>
                  {value === c._id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Label Picker ─────────────────────────────────────────────────────────────

function LabelSelect({
  labels,
  isLoading,
  disabled,
  value,
  onChange,
}: {
  labels: ILabel[];
  isLoading: boolean;
  disabled: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = labels.find((l) => l._id === value);

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

  // Close dropdown when a selection is made
  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  const thumb = selected?.labelImages?.[0]?.secureUrl;

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xs border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors",
          "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !selected && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : selected && thumb ? (
            <div className="relative h-6 w-6 shrink-0 rounded-xs overflow-hidden border border-border">
              <Image src={thumb} alt={selected.flavorName} fill className="object-cover" sizes="24px" />
            </div>
          ) : null}
          <span className="truncate">
            {isLoading
              ? "Loading labels…"
              : selected
              ? selected.flavorName
              : disabled
              ? "Select a store first"
              : "Select a label…"}
          </span>
        </div>
        {!isLoading && (
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        )}
      </button>

      {/* Dropdown */}
      {open && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-xs border border-border bg-popover shadow-lg">
          {labels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-5">
              No ready-for-production labels for this store.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1">
              {labels.map((l) => {
                const img = l.labelImages?.[0]?.secureUrl;
                const isSelected = value === l._id;
                return (
                  <button
                    key={l._id}
                    type="button"
                    onClick={() => handleSelect(l._id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xs px-3 py-2.5 text-sm transition-colors",
                      "hover:bg-muted",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-10 w-10 shrink-0 rounded-xs overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {img ? (
                        <Image src={img} alt={l.flavorName} fill className="object-cover" sizes="40px" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className={cn("font-medium truncate w-full text-left", isSelected ? "text-primary" : "text-foreground")}>
                        {l.flavorName}
                      </span>
                    </div>

                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Selected Label Preview ───────────────────────────────────────────────────

function SelectedLabelPreview({ label }: { label: ILabel }) {
  const img = label.labelImages?.[0]?.secureUrl;
  return (
    <div className="flex items-center gap-3 rounded-xs border border-border bg-muted/40 px-3 py-2.5">
      <div className="relative h-12 w-12 shrink-0 rounded-xs overflow-hidden border border-border bg-muted flex items-center justify-center">
        {img ? (
          <Image src={img} alt={label.flavorName} fill className="object-cover" sizes="48px" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{label.flavorName}</span>
        {label.productType && (
          <span className="text-xs text-muted-foreground">{label.productType}</span>
        )}
      </div>
    </div>
  );
}

// ─── Field class ─────────────────────────────────────────────────────────────

const fieldClass =
  "w-full rounded-xs border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed";

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

  const { data: labelsData, isFetching: labelsLoading } = useGetAllLabelsQuery(
    { clientId: selectedClientId, stage: "ready_for_production", limit: 100 },
    { skip: !selectedClientId }
  );
  const labels = labelsData?.labels ?? [];

  const selectedLabel = labels.find((l) => l._id === selectedLabelId) ?? null;

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
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:bg-primary/80 transition-colors self-start shrink-0"
      >
        <PackagePlus className="w-4 h-4 shrink-0" />
        <span>Place Label Order</span>
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="rounded-xs bg-card text-card-foreground border-border w-full max-w-sm sm:max-w-md p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border bg-muted/40">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="flex items-center justify-center w-7 h-7 rounded-xs bg-primary/10">
                <PackagePlus className="w-4 h-4 text-primary" />
              </span>
              Place Label Order
            </DialogTitle>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
            {/* Store */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Store</label>
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
              <label className="text-sm font-medium text-foreground">Label / SKU</label>
              <LabelSelect
                labels={labels}
                isLoading={labelsLoading}
                disabled={!selectedClientId}
                value={selectedLabelId}
                onChange={setSelectedLabelId}
              />
              {/* Selected label preview */}
              {selectedLabel && <SelectedLabelPreview label={selectedLabel} />}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Quantity to Order</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1000"
                className={fieldClass}
                required
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Notes <span className="font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes for this order…"
                className={fieldClass}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedStoreId || !selectedLabelId || !quantity}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                Submit Order
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
