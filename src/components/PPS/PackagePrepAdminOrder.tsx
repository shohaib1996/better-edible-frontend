"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PackagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useCreateLabelOrderMutation } from "@/redux/api/PrivateLabel/ppsApi";

export default function PackagePrepAdminOrder() {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: clientsData } = useGetAllPrivateLabelClientsQuery({ limit: 200 });
  const { data: labelsData } = useGetAllLabelsQuery(
    { clientId: selectedClientId, stage: "ready_for_production", limit: 100 },
    { skip: !selectedClientId }
  );
  const [createLabelOrder, { isLoading }] = useCreateLabelOrderMutation();

  const clients = clientsData?.clients ?? [];
  const labels = labelsData?.labels ?? [];

  // Find selected client to get storeId
  const selectedClient = clients.find((c) => c._id === selectedClientId);
  const storeId = selectedClient?.store?._id ?? "";

  function reset() {
    setSelectedClientId("");
    setSelectedLabelId("");
    setQuantity("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !selectedLabelId || !quantity) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error("Enter a valid quantity");
      return;
    }

    try {
      await createLabelOrder({
        storeId,
        labelId: selectedLabelId,
        quantityOrdered: qty,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("Label order placed");
      reset();
      setOpen(false);
    } catch {
      toast.error("Failed to place order");
    }
  }

  return (
    <div className="rounded-xs border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-primary" />
          <span className="font-semibold text-base">Place Label Order</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t px-5 py-4 flex flex-col gap-4">
          {/* Step 1 — Store/Client */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Store</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSelectedLabelId("");
              }}
              className="rounded-xs border bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Select a store…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.store?.name ?? c._id}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2 — Label/SKU */}
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
                  {l.flavorName}{l.itemId ? ` (${l.itemId})` : ""}
                </option>
              ))}
            </select>
            {selectedClientId && labels.length === 0 && (
              <p className="text-xs text-muted-foreground">No ready-for-production labels found for this store.</p>
            )}
          </div>

          {/* Step 3 — Quantity */}
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

          {/* Step 4 — Notes */}
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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !storeId || !selectedLabelId || !quantity}
              className="flex items-center gap-2 px-5 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Order
            </button>
            <button
              type="button"
              onClick={() => { reset(); setOpen(false); }}
              className="px-4 py-2 rounded-xs bg-muted text-muted-foreground text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
