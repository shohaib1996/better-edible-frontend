"use client";

import { Loader2, GitMerge, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { IFlavor } from "@/types/privateLabel/pps";

interface Props {
  flavors: IFlavor[];
  isLoading: boolean;
  isFetching: boolean;
  debouncedSearch: string;
  togglingId: string | null;
  onToggle: (flavor: IFlavor) => void;
  onEdit: (flavor: IFlavor) => void;
  onDelete: (flavor: IFlavor) => void;
}

export function FlavorCards({
  flavors,
  isLoading,
  isFetching,
  debouncedSearch,
  togglingId,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className={`md:hidden transition-opacity ${isFetching ? "opacity-60" : ""}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : flavors.length === 0 ? (
        <p className="text-center py-10 text-sm text-muted-foreground">
          {debouncedSearch ? `No flavors matching "${debouncedSearch}"` : "No flavors found"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {flavors.map((flavor) => (
            <div
              key={flavor.flavorId}
              className="rounded-xs border border-border bg-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {flavor.isBlend && (
                    <GitMerge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-semibold text-foreground leading-tight">{flavor.name}</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    flavor.isActive
                      ? "shrink-0 bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                      : "shrink-0 bg-muted text-muted-foreground border-border text-xs"
                  }
                >
                  {flavor.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {flavor.defaultAmount !== undefined && flavor.defaultAmount > 0 && (
                <p className="text-xs text-muted-foreground -mt-1">
                  {flavor.defaultAmount}g per mold
                </p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {flavor.isActive ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-2">
                  {togglingId === flavor.flavorId ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={flavor.isActive}
                      onCheckedChange={() => onToggle(flavor)}
                      disabled={togglingId === flavor.flavorId}
                    />
                  )}
                  <button
                    onClick={() => onEdit(flavor)}
                    title="Edit"
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(flavor)}
                    title="Delete"
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
