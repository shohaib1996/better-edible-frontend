"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Plus, PauseCircle, PlayCircle, LayoutGrid, List } from "lucide-react";

interface StoreActionsProps {
  selected: string[];
  stores: any[];
  toggling: boolean;
  onToggleBlock: () => void;
  onAssignStores: () => void;
  onAddStore: () => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export const StoreActions = ({
  selected,
  stores,
  toggling,
  onToggleBlock,
  onAssignStores,
  onAddStore,
  viewMode = "grid",
  onViewModeChange,
}: StoreActionsProps) => {
  const selectedStores = stores.filter((s: any) => selected.includes(s._id));
  const allBlocked = selectedStores.every((s: any) => s.blocked);

  return (
    <div className="flex flex-wrap items-center gap-3 justify-between">
      {/* View Toggle - Only visible on large screens */}
      {onViewModeChange && (
        <div className="hidden lg:flex items-center gap-2 bg-muted/50 rounded-xs p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="rounded-xs cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="rounded-xs cursor-pointer"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 ml-auto">
        <Button
          disabled={selected.length === 0 || toggling}
          onClick={onToggleBlock}
          className="flex items-center gap-2 rounded-xs cursor-pointer whitespace-nowrap"
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : allBlocked ? (
            <>
              <PlayCircle className="h-4 w-4" /> Unpause
            </>
          ) : (
            <>
              <PauseCircle className="h-4 w-4" /> Pause
            </>
          )}
        </Button>

        <Button
          disabled={selected.length === 0}
          onClick={onAssignStores}
          className="flex items-center gap-2 rounded-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Assign Stores
        </Button>

        <Button
          onClick={onAddStore}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>
    </div>
  );
};
