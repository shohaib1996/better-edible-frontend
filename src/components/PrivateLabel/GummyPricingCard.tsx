import type { IGummyPricingResult } from "@/types/privateLabel/gummyBuilder";

interface Props {
  pricing: IGummyPricingResult;
  unitsOrdered: number;
  grandTotal: number;
}

export function GummyPricingCard({ pricing, unitsOrdered, grandTotal }: Props) {
  return (
    <div className="rounded-xs border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Live Pricing
        </p>
      </div>
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Unit cost</span>
          <span className="font-mono font-medium text-foreground">
            ${pricing.unitCost.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>× {unitsOrdered.toLocaleString()} units</span>
          <span className="font-mono">${pricing.totalCost.toFixed(2)}</span>
        </div>
        {pricing.isRatio && (
          <div className="flex justify-between text-muted-foreground">
            <span>Testing fee</span>
            {pricing.testingFeeWaived ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Waived</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">+${pricing.testingFee}</span>
            )}
          </div>
        )}
      </div>
      <div className="px-4 py-3 bg-primary/5 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
