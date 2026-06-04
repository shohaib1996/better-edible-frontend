"use client";

import { Badge } from "@/components/ui/badge";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

interface Props {
  labels: IStoreDraftLabel[];
}

export function LineItemTable({ labels }: Props) {
  const grandTotal = labels.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);
  const testingFeeTotal = labels.reduce((sum, l) => sum + (l.testingFeeWaived ? 0 : (l.testingFee ?? 0)), 0);

  return (
    <div className="rounded-xs border border-border overflow-hidden">
      <table className="w-full text-sm">
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
          {labels.map((label) => (
            <tr key={label._id} className="bg-card">
              <td className="px-4 py-3">
                <div className="font-medium">{label.flavorName}</div>
                <div className="flex flex-wrap gap-1 mt-1">
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
                </div>
                {label.isRatio && !label.testingFeeWaived && (
                  <div className="text-[11px] text-amber-600 mt-1">+$250 testing fee</div>
                )}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {label.unitsOrdered.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                ${(label.unitCost ?? 0).toFixed(4)}
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                ${(label.totalCost ?? 0).toFixed(2)}
              </td>
            </tr>
          ))}
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
