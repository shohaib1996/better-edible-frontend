"use client";

import { Beaker, Droplets, FileText, Palette, Pill } from "lucide-react";
import { ILabel } from "@/types";

interface Props {
  label: ILabel;
}

export function LabelCardDetails({ label }: Props) {
  const sizeLabel = label.size === "xl" ? "XL" : label.size === "standard" ? "Standard" : null;
  const oilLabel = label.oilType === "rosin" ? "Rosin" : label.oilType === "biomax" ? "BioMax" : null;
  const effectLabel = label.effect ? label.effect.charAt(0).toUpperCase() + label.effect.slice(1) : null;
  const hasGummySpec = sizeLabel || oilLabel || effectLabel || (label.cannabinoids?.length ?? 0) > 0;
  const hasPricing = label.unitsOrdered || label.unitCost || label.totalCost;

  return (
    <div className="px-4 pb-4 pt-0">
      <div className="border-t border-border dark:border-white/10 pt-3 space-y-2.5">

        {/* Gummy spec: size, oil, effect, cannabinoids */}
        {hasGummySpec && (
          <div className="flex flex-wrap gap-1.5">
            {sizeLabel && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs border border-border bg-muted/50">
                {sizeLabel}
              </span>
            )}
            {oilLabel && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs border border-border bg-muted/50">
                {oilLabel}
              </span>
            )}
            {effectLabel && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs border border-border bg-muted/50">
                {effectLabel}
              </span>
            )}
            {(label.cannabinoids ?? []).map((c) => (
              <span
                key={c.name}
                className="text-[11px] font-medium px-2 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300"
              >
                {c.name} {c.mg}mg
              </span>
            ))}
          </div>
        )}

        {/* Pricing: units, per-unit cost, total */}
        {hasPricing && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {label.unitsOrdered && (
              <span>{label.unitsOrdered.toLocaleString()} units</span>
            )}
            {label.unitCost && (
              <span className="text-foreground font-medium">${label.unitCost.toFixed(4)}/unit</span>
            )}
            {label.totalCost && (
              <span className="font-semibold text-foreground">${label.totalCost.toFixed(2)} total</span>
            )}
          </div>
        )}

        {/* Legacy fields */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {label.cannabinoidMix && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Pill className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="font-medium text-foreground">{label.cannabinoidMix}</span>
            </div>
          )}
          {label.color && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Palette className="h-3.5 w-3.5 shrink-0 text-pink-500" />
              <span className="font-medium text-foreground">{label.color}</span>
            </div>
          )}
          {label.flavorComponents && label.flavorComponents.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              <div className="flex items-center gap-1 flex-wrap">
                {label.flavorComponents.map((c, i) => (
                  <span key={i} className="inline-flex items-center bg-orange-500/10 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded text-[11px] font-medium">
                    {c.name} {c.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}
          {label.colorComponents && label.colorComponents.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Beaker className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <div className="flex items-center gap-1 flex-wrap">
                {label.colorComponents.map((c, i) => (
                  <span key={i} className="inline-flex items-center bg-violet-500/10 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded text-[11px] font-medium">
                    {c.name} {c.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {label.specialInstructions && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
            <p className="line-clamp-2 leading-relaxed">{label.specialInstructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
