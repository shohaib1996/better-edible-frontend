"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useUpdateDraftLabelMutation,
  useDeleteDraftLabelMutation,
} from "@/redux/api/PrivateLabel/storeLabelApi";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

interface Props {
  storeId: string;
  labels: IStoreDraftLabel[];
  isLoading: boolean;
}

function LabelCard({ label, storeId }: { label: IStoreDraftLabel; storeId: string }) {
  const [editing, setEditing] = useState(false);
  const [units, setUnits] = useState(label.unitsOrdered);
  const [flavorName, setFlavorName] = useState(label.flavorName);

  const [updateDraft, { isLoading: isSaving }] = useUpdateDraftLabelMutation();
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftLabelMutation();

  async function handleSave() {
    try {
      await updateDraft({
        id: label._id,
        storeId,
        flavorName,
        unitsOrdered: units,
      }).unwrap();
      toast.success("Updated");
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update");
    }
  }

  async function handleDelete() {
    try {
      await deleteDraft({ id: label._id, storeId }).unwrap();
      toast.success("Removed from line");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    }
  }

  const oilLabel = label.oilType === "rosin" ? "Rosin" : "BioMax";
  const sizeLabel = label.size === "xl" ? "XL" : "Standard";
  const effectLabel = label.effect.charAt(0).toUpperCase() + label.effect.slice(1);
  const flavorModeLabel = label.flavorMode === "mix" ? "Mix" : "Single";

  return (
    <div className="rounded-xs border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="w-4 h-4 text-primary shrink-0" />
          {editing ? (
            <Input
              value={flavorName}
              onChange={(e) => setFlavorName(e.target.value)}
              className="rounded-xs h-7 text-sm py-0 px-2 w-40"
              autoFocus
            />
          ) : (
            <span className="font-semibold text-sm truncate">{label.flavorName}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check className="w-3.5 h-3.5 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-xs"
                onClick={() => { setEditing(false); setFlavorName(label.flavorName); setUnits(label.unitsOrdered); }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-xs text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="rounded-xs text-xs">{oilLabel}</Badge>
        <Badge variant="outline" className="rounded-xs text-xs">{sizeLabel}</Badge>
        <Badge variant="outline" className="rounded-xs text-xs">{effectLabel}</Badge>
        <Badge variant="outline" className="rounded-xs text-xs">{flavorModeLabel} flavor</Badge>
        {label.cannabinoids.map((c) => (
          <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">
            {c.name} {c.mg}mg
          </Badge>
        ))}
      </div>

      {/* Units + pricing */}
      <div className="flex items-center justify-between text-sm gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Units:</span>
          {editing ? (
            <Input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="rounded-xs h-7 text-sm py-0 px-2 w-24"
            />
          ) : (
            <span className="font-medium">{label.unitsOrdered.toLocaleString()}</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-xs">Total: </span>
          <span className="font-semibold">${label.totalCost.toFixed(2)}</span>
          <span className="text-muted-foreground text-xs ml-1">(${label.unitCost.toFixed(4)}/ea)</span>
        </div>
      </div>

      {/* Testing fee notice */}
      {label.isRatio && !label.testingFeeWaived && (
        <div className="rounded-xs bg-amber-400/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
          +$250 testing fee applies — order 3,000+ units or join a pool to waive.
        </div>
      )}
      {label.isRatio && label.testingFeeWaived && (
        <div className="rounded-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          Testing fee waived — 3,000+ units.
        </div>
      )}
    </div>
  );
}

export function SavedGummiesList({ storeId, labels, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xs border border-border bg-card p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="rounded-xs border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
        No gummies saved yet. Use the builder to add your first SKU.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {labels.map((label) => (
        <LabelCard key={label._id} label={label} storeId={storeId} />
      ))}
    </div>
  );
}
