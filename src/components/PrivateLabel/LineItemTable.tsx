"use client";

import { Badge } from "@/components/ui/badge";
import { GummyVisual } from "./GummyVisual";
import { hexToHueRotation } from "@/lib/useGummyBuilder";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

interface Props {
  labels: IStoreDraftLabel[];
}

export function LineItemTable({ labels }: Props) {
  const grandTotal = labels.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);
  const testingFeeTotal = labels.reduce((sum, l) => sum + (l.testingFeeWaived ? 0 : (l.testingFee ?? 0)), 0);

  return (
    <div className="rounded-xs border border-border overflow-x-auto">
      <table className="min-w-[520px] w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
              Flavor
            </th>
            <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
              Units
            </th>
            <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
              Unit Cost
            </th>
            <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {labels.map((label) => {
            const hue = label.gummyColorHex ? hexToHueRotation(label.gummyColorHex) : 0;
            return (
              <tr key={label._id} className="bg-card">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {/* Gummy visual */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <GummyVisual size={label.size} hue={hue} compact />
                      {label.gummyColorHex && (
                        <span
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: label.gummyColorHex }}
                          title={label.gummyColorName ?? label.gummyColorHex}
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium">{label.flavorName}</div>

                      {/* Color name */}
                      {label.gummyColorName && (
                        <p className="text-sm font-medium" style={{ color: label.gummyColorHex }}>{label.gummyColorName}</p>
                      )}

                      {/* Spec badges */}
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
                          {label.oilType === "rosin" ? "Rosin" : "BioMax"}
                        </Badge>
                        <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
                          {label.size === "xl" ? "XL" : "Standard"}
                        </Badge>
                        <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
                          {label.effect.charAt(0).toUpperCase() + label.effect.slice(1)}
                        </Badge>
                        {label.cannabinoids.map((c) => (
                          <Badge key={c.name} variant="secondary" className="rounded-xs text-[10px] px-1.5 py-0">
                            {c.name} {c.mg}mg
                          </Badge>
                        ))}
                        {(label.selectedFlavors ?? []).map((f) => (
                          <Badge
                            key={f}
                            className="rounded-xs text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>

                      {label.isRatio && !label.testingFeeWaived && (
                        <div className="text-[11px] text-amber-600 mt-0.5">+$250 testing fee</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground align-top pt-4">
                  {label.unitsOrdered.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground align-top pt-4">
                  ${(label.unitCost ?? 0).toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right font-semibold align-top pt-4">
                  ${(label.totalCost ?? 0).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-border bg-muted/50">
          {testingFeeTotal > 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
                Testing fees (ratio products)
              </td>
              <td className="px-4 py-2 text-right text-sm font-medium text-amber-700 dark:text-amber-400">
                +${testingFeeTotal}
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={3} className="px-4 py-3 font-semibold text-sm">Grand Total</td>
            <td className="px-4 py-3 text-right font-bold text-base">
              ${(grandTotal + testingFeeTotal).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
