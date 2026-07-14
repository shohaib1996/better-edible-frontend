"use client";

import { Trash2, Pencil, FlaskConical } from "lucide-react";
import { GummyVisual } from "./GummyVisual";
import { hexToHueRotation } from "@/lib/useGummyBuilder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

interface Props {
  label: IStoreDraftLabel;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function LabelCardView({ label, isDeleting, onEdit, onDelete }: Props) {
  const oilLabel = label.oilType === "rosin" ? "Rosin" : "BioMax";
  const sizeLabel = label.size === "xl" ? "XL" : "Standard";
  const effectLabel = label.effect.charAt(0).toUpperCase() + label.effect.slice(1);
  const gummyHue = label.gummyColorHex ? hexToHueRotation(label.gummyColorHex) : 0;

  return (
    <div className="rounded-xs border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <GummyVisual size={label.size} hue={gummyHue} compact />
          {label.gummyColorHex && (
            <span
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: label.gummyColorHex }}
              title={label.gummyColorName ?? label.gummyColorHex}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FlaskConical className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-sm truncate">{label.flavorName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-xs" onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-7 w-7 rounded-xs text-destructive hover:text-destructive"
                onClick={onDelete} disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {label.gummyColorName && (
            <p className="text-sm font-medium" style={{ color: label.gummyColorHex }}>{label.gummyColorName}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="rounded-xs text-xs">{oilLabel}</Badge>
            <Badge variant="outline" className="rounded-xs text-xs">{sizeLabel}</Badge>
            <Badge variant="outline" className="rounded-xs text-xs">{effectLabel}</Badge>
            {label.cannabinoids.map((c) => (
              <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">{c.name} {c.mg}mg</Badge>
            ))}
            {(label.selectedFlavors ?? []).map((f) => (
              <Badge key={f} className="rounded-xs text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">{f}</Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm gap-4">
            <span className="text-muted-foreground text-xs">{label.unitsOrdered.toLocaleString()} units</span>
            <div className="text-right">
              <span className="font-semibold">${(label.totalCost ?? 0).toFixed(2)}</span>
              <span className="text-muted-foreground text-xs ml-1">(${(label.unitCost ?? 0).toFixed(4)}/ea)</span>
            </div>
          </div>
        </div>
      </div>

      {label.isRatio && !label.testingFeeWaived && (
        <div className="rounded-xs bg-amber-400/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
          +$250 testing fee applies — order 3,000+ units to waive.
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
