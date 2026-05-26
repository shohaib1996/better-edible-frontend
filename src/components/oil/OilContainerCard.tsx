"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IOilContainer } from "@/types/privateLabel/pps";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  empty: "bg-gray-100 text-gray-600 border-gray-200",
  cleaning: "bg-amber-100 text-amber-800 border-amber-200",
};

interface Props {
  container: IOilContainer;
  onRefill: (container: IOilContainer) => void;
  onClean: (container: IOilContainer) => void;
}

export function OilContainerCard({ container, onRefill, onClean }: Props) {
  const pct =
    container.totalAmount > 0
      ? Math.round((container.remainingAmount / container.totalAmount) * 100)
      : 0;

  return (
    <div className="rounded-xs border bg-card flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold leading-tight">{container.name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{container.containerId}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[container.status]}`}>
            {container.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {container.cannabisType}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        {(
          [
            ["Remaining", `${container.remainingAmount}g`, pct < 20 ? "text-destructive" : "text-green-600"],
            ["Total", `${container.totalAmount}g`, ""],
            ["Balance", `${pct}%`, pct < 20 ? "text-destructive" : ""],
          ] as const
        ).map(([label, value, color]) => (
          <div key={label} className="px-3 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mx-5 mt-3 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct < 20 ? "bg-destructive" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 py-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRefill(container)}
          disabled={container.status === "cleaning"}
          className="gap-1.5 rounded-xs text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refill
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onClean(container)}
          disabled={container.status === "cleaning" || container.remainingAmount === 0}
          className="gap-1.5 rounded-xs text-xs text-destructive hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clean / Zero Out
        </Button>
      </div>
    </div>
  );
}
