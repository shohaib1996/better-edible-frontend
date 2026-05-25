"use client";

import { AlertCircle, FlaskConical, Palette, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ICookItem } from "@/types/privateLabel/pps";

interface Props {
  item: ICookItem;
  compact?: boolean;
  flavorNameMap: Map<string, string>;
  colorNameMap: Map<string, string>;
  onOpen: () => void;
}

export default function FlavorColorBlock({ item, compact: c, flavorNameMap, colorNameMap, onOpen }: Props) {
  const hasData = (item.flavorIds?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div className={`mx-5 mb-3 flex items-center justify-between gap-3 px-4 ${c ? "py-3" : "py-4"} rounded-xs border border-dashed border-amber-400/50 bg-amber-400/5`}>
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className={`${c ? "w-4 h-4" : "w-5 h-5"} shrink-0`} />
          <p className={c ? "text-xs font-medium" : "text-sm font-medium"}>
            No flavor &amp; color recorded
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={`shrink-0 rounded-xs gap-1.5 ${c ? "text-xs h-7" : "text-sm h-9"} border-amber-400/50 text-amber-700 hover:bg-amber-400/10`}
          onClick={onOpen}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    );
  }

  return (
    <div className={`mx-5 mb-3 rounded-xs border bg-muted/30 ${c ? "px-4 py-3" : "px-4 py-4"} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`${c ? "text-xs" : "text-sm"} font-semibold text-foreground`}>
          Flavor &amp; Color
        </p>
        <Button
          size="sm"
          variant="ghost"
          className={`shrink-0 rounded-xs gap-1 ${c ? "text-xs h-6 px-2" : "text-xs h-7 px-2"} text-muted-foreground`}
          onClick={onOpen}
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Button>
      </div>

      {(item.flavorAmounts ?? []).map((fa, i) => (
        <div key={i} className="flex items-center gap-2">
          <FlaskConical className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} text-amber-500 shrink-0`} />
          <span className={`${c ? "text-xs" : "text-sm"} font-medium flex-1 truncate`}>
            {flavorNameMap.get(fa.flavorId) ?? fa.flavorId}
          </span>
          <span className={`${c ? "text-xs" : "text-sm"} font-semibold tabular-nums text-foreground`}>
            {fa.amountGrams}g
          </span>
        </div>
      ))}

      {(item.colorAmounts ?? []).length > 0 && <div className="border-t my-1" />}

      {(item.colorAmounts ?? []).length > 0 ? (
        (item.colorAmounts ?? []).map((ca, i) => (
          <div key={i} className="flex items-center gap-2">
            <Palette className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} text-purple-500 shrink-0`} />
            <span className={`${c ? "text-xs" : "text-sm"} font-medium flex-1 truncate`}>
              {colorNameMap.get(ca.colorId) ?? ca.colorId}
            </span>
            <span className={`${c ? "text-xs" : "text-sm"} font-semibold tabular-nums text-foreground`}>
              {ca.amountGrams}g
            </span>
          </div>
        ))
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Palette className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} shrink-0`} />
          <span className={c ? "text-xs" : "text-sm"}>No color</span>
        </div>
      )}
    </div>
  );
}
