import { X } from "lucide-react";
import type { QueuedGummy } from "@/lib/gummyBuilderConfig";

interface Props {
  queue: QueuedGummy[];
  onRemove: (id: string) => void;
}

export function GummyQueue({ queue, onRemove }: Props) {
  if (queue.length === 0) return null;

  const queueTotal = queue.reduce((s, q) => s + q.grandTotal, 0);

  return (
    <div className="rounded-xs border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Queued — {queue.length} gummy{queue.length !== 1 ? "s" : ""}
        </p>
        <span className="text-xs text-muted-foreground font-mono">${queueTotal.toFixed(2)}</span>
      </div>
      <div className="divide-y divide-border">
        {queue.map((item) => (
          <div key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.flavorName}</p>
              <p className="text-xs text-muted-foreground">
                {item.oilType === "rosin" ? "Rosin" : "BioMax"} · {item.size === "xl" ? "XL" : "Std"} · {item.effect} · {item.unitsOrdered.toLocaleString()} units
                {item.cannabinoids.length > 0 &&
                  ` · ${item.cannabinoids.map((c) => `${c.name} ${c.mg}mg`).join(", ")}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold font-mono">${item.grandTotal.toFixed(2)}</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
