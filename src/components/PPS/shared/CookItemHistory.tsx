"use client";

import { Hammer, Wind, Droplets, Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetCookItemHistoryQuery } from "@/redux/api/PrivateLabel/ppsApi";
import type { IHistoryEntry } from "@/types/privateLabel/pps";

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  mold_assigned: "Mold Assigned",
  stage_1_complete: "Molding Complete",
  mold_processed: "Mold Processed",
  stage_2_complete: "Dehydrating Started",
  tray_removed: "Tray Removed",
  stage_3_complete: "Container Packed",
  packaging_started: "Packaging Started",
  packaging_complete: "Packaging Complete",
};

function ActionIcon({ action }: { action: string }) {
  if (action === "mold_assigned" || action === "stage_1_complete") {
    return <Hammer className="w-3.5 h-3.5" />;
  }
  if (action === "mold_processed" || action === "stage_2_complete") {
    return <Wind className="w-3.5 h-3.5" />;
  }
  if (action === "tray_removed") {
    return <Droplets className="w-3.5 h-3.5" />;
  }
  return <Package className="w-3.5 h-3.5" />;
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return ts;
  }
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function HistoryEntryRow({ entry }: { entry: IHistoryEntry }) {
  const label = ACTION_LABELS[entry.action] ?? entry.action;

  return (
    <div className="flex gap-3 items-start">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
          <ActionIcon action={entry.action} />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {entry.performedBy.userName}
          </Badge>
          {entry.performedBy.repType === "pps" && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20"
            >
              PPS
            </Badge>
          )}
        </div>
        {entry.detail && (
          <p className="text-xs text-muted-foreground font-mono">{entry.detail}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CookItemHistoryProps {
  cookItemId: string;
  isAdmin: boolean;
}

export default function CookItemHistory({ cookItemId, isAdmin }: CookItemHistoryProps) {
  const { data, isLoading } = useGetCookItemHistoryQuery(cookItemId, {
    skip: !isAdmin,
  });

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className="border-t pt-3 flex items-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading history…
      </div>
    );
  }

  const history = data?.history ?? [];

  if (history.length === 0) {
    return (
      <div className="border-t pt-3 text-xs text-muted-foreground">
        No history recorded yet.
      </div>
    );
  }

  return (
    <div className="border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Activity History
      </p>
      <div className="flex flex-col">
        {history.map((entry, i) => (
          <HistoryEntryRow key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}
