"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useSetReorderThresholdMutation } from "@/redux/api/PrivateLabel/ppsApi";
import type { ILabelInventory } from "@/types/privateLabel/packagePrep";

export function ReorderThresholdInline({ inv }: { inv: ILabelInventory }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(inv.reorderThreshold));
  const [setThreshold, { isLoading }] = useSetReorderThresholdMutation();

  async function handleSave() {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid threshold"); return; }
    try {
      await setThreshold({ inventoryId: inv._id, reorderThreshold: n }).unwrap();
      toast.success("Reorder threshold updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update threshold");
    }
  }

  return (
    <div className="border-t border-border mx-4 py-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Reorder threshold:</span>
      {editing ? (
        <>
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-xs border border-input bg-background px-2 py-1 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="p-1 rounded-xs text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(String(inv.reorderThreshold)); }}
            className="p-1 rounded-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <span className="text-xs font-semibold">
            {inv.reorderThreshold > 0 ? inv.reorderThreshold.toLocaleString() : "not set"}
          </span>
          <button
            onClick={() => { setEditing(true); setValue(String(inv.reorderThreshold)); }}
            className="p-1 rounded-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}
