"use client";

import { MapStop, RouteLeg } from "@/types/routePlannerTypes";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation, Route } from "lucide-react";

interface Props {
  stops: MapStop[];
  routeOrderMap: Map<string, number>;
  geocodingCount: number;
  routeLegs: RouteLeg[];
  totalDistance: string;
  totalDuration: string;
  isOptimizing: boolean;
  warehouseName: string;
  onOptimize: () => void;
  onClear: () => void;
}

export function RoutePlannerPanel({
  stops,
  routeOrderMap,
  geocodingCount,
  routeLegs,
  totalDistance,
  totalDuration,
  isOptimizing,
  warehouseName,
  onOptimize,
  onClear,
}: Props) {
  const hasRoute = routeLegs.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {/* Warehouse */}
      <div className="flex items-center gap-2 rounded-xs bg-violet-50 border border-violet-200 px-2.5 py-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-violet-800 leading-tight truncate">{warehouseName}</p>
          <p className="text-xs text-violet-600 leading-tight">Route start</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
          Order
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
          Sample
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" />
          In route
        </span>
      </div>

      {/* Stops list */}
      <div className="space-y-1.5 flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Stops ({stops.length})
          {geocodingCount > 0 && (
            <span className="ml-2 normal-case font-normal inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              placing {geocodingCount}…
            </span>
          )}
        </p>

        {stops.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {geocodingCount > 0 ? "Loading stops…" : "No manifested orders found."}
          </p>
        ) : (
          <div className="space-y-1">
            {stops.map((stop, i) => {
              const routeNum = routeOrderMap.get(stop.id);
              return (
                <div
                  key={stop.id}
                  className="flex items-start gap-2 border border-border rounded-xs px-2.5 py-2 bg-muted/20"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 pt-0.5">
                    {routeNum ?? i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{stop.storeName}</p>
                    <p className={`text-xs truncate leading-tight ${stop.kind === "sample" ? "text-blue-500" : "text-orange-500"}`}>
                      {stop.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Route legs */}
      {hasRoute && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5" />
            Route — {totalDistance} · {totalDuration}
          </p>
          <div className="space-y-1">
            <div className="text-xs border-l-2 border-violet-500 pl-2.5 py-0.5">
              <p className="font-semibold text-violet-700 leading-tight">Start: {warehouseName}</p>
            </div>
            {routeLegs.map((leg, i) => (
              <div key={i} className="text-xs border-l-2 border-green-500 pl-2.5 py-0.5">
                <p className="font-medium text-foreground leading-tight truncate">{leg.endAddress}</p>
                <p className="text-muted-foreground">{leg.distance} · {leg.duration}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <Button
          className="flex-1 rounded-xs"
          size="sm"
          disabled={stops.length === 0 || geocodingCount > 0 || isOptimizing}
          onClick={onOptimize}
        >
          {isOptimizing ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Optimizing…</>
          ) : (
            <><Navigation className="h-3.5 w-3.5 mr-2" />Optimize Route</>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xs"
          onClick={onClear}
          disabled={!hasRoute}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
