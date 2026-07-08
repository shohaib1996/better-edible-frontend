"use client";

import { Loader2, GitMerge, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ReUsableComponents/DataTable";
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

export function FlavorTable({
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
    <div className={`hidden md:block transition-opacity ${isFetching ? "opacity-60" : ""}`}>
      <DataTable
        data={flavors}
        isLoading={isLoading}
        emptyMessage={
          debouncedSearch ? `No flavors matching "${debouncedSearch}"` : "No flavors found"
        }
        columns={[
          {
            key: "name",
            header: "Flavor Name",
            render: (flavor) => (
              <div className="flex items-center gap-2">
                {flavor.isBlend && (
                  <GitMerge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium">{flavor.name}</span>
                {flavor.defaultAmount !== undefined && flavor.defaultAmount > 0 && (
                  <span className="text-xs text-muted-foreground">· {flavor.defaultAmount}g</span>
                )}
              </div>
            ),
          },
          {
            key: "isActive",
            header: "Status",
            className: "w-[140px]",
            render: (flavor) => (
              <Badge
                variant="outline"
                className={
                  flavor.isActive
                    ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                    : "bg-muted text-muted-foreground border-border text-xs"
                }
              >
                {flavor.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "flavorId",
            header: "Actions",
            className: "w-[140px] text-right",
            render: (flavor) => (
              <div className="flex items-center justify-end gap-2">
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
            ),
          },
        ]}
      />
    </div>
  );
}
