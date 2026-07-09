"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateChainMutation, useUpdateChainMutation } from "@/redux/api/Chains/chainsApi";
import { MODE_LABEL, blankForm, INPUT_CLS, LABEL_CLS, type BuyingMode } from "@/constants/chainConstants";

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string;
  initial?: Partial<typeof blankForm>;
}

export function ChainModal({ open, onClose, editId, initial }: Props) {
  const [form, setForm] = useState({ ...blankForm, ...initial });
  const [error, setError] = useState("");

  const [createChain, { isLoading: creating }] = useCreateChainMutation();
  const [updateChain, { isLoading: updating }] = useUpdateChainMutation();
  const saving = creating || updating;

  if (!open) return null;

  const set =
    (k: keyof typeof blankForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Chain name is required"); return; }
    setError("");
    const payload = {
      name: form.name.trim(),
      buyingMode: form.buyingMode,
      notes: form.notes.trim() || undefined,
      buyerName: form.buyerName.trim() || undefined,
      buyerEmail: form.buyerEmail.trim() || undefined,
      buyerPhone: form.buyerPhone.trim() || undefined,
      billingContact: form.billingContact.trim() || undefined,
    };
    const result = editId
      ? await updateChain({ id: editId, ...payload })
      : await createChain(payload);
    if (!("error" in result)) onClose();
    else setError("Something went wrong. Please try again.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-xs shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {editId ? "Edit Chain" : "New Chain"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              A chain groups stores under one parent. Buying mode sets the default behavior; you can fine-tune each store afterward.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-4 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className={LABEL_CLS}>Chain name *</label>
            <input value={form.name} onChange={set("name")} placeholder="e.g. Green Holdings Group" className={INPUT_CLS} autoFocus />
          </div>

          <div>
            <label className={LABEL_CLS}>Buying mode</label>
            <select value={form.buyingMode} onChange={set("buyingMode")} className={INPUT_CLS}>
              {(Object.entries(MODE_LABEL) as [BuyingMode, string][]).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {MODE_LABEL[form.buyingMode].split("—")[1]?.trim()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Buyer name</label>
              <input value={form.buyerName} onChange={set("buyerName")} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Buyer phone</label>
              <input value={form.buyerPhone} onChange={set("buyerPhone")} className={INPUT_CLS} />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Buyer email</label>
            <input value={form.buyerEmail} onChange={set("buyerEmail")} type="email" className={INPUT_CLS} />
          </div>

          <div>
            <label className={LABEL_CLS}>Notes</label>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className={INPUT_CLS + " resize-none"} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xs">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-xs bg-primary text-primary-foreground">
              {saving ? "Saving…" : editId ? "Save Changes" : "Create Chain"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
