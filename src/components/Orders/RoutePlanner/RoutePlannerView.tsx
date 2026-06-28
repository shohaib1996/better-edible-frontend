"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useGetAllOrdersQuery } from "@/redux/api/orders/orders";
import { useGetAllSamplesQuery } from "@/redux/api/Samples/samplesApi";
import { MapStop, RouteResult } from "@/types/routePlannerTypes";
import { useGeocoder } from "@/lib/useGeocoder";
import { useRouteOptimizer } from "@/lib/useRouteOptimizer";
import { RoutePlannerMap } from "./RoutePlannerMap";
import { RoutePlannerPanel } from "./RoutePlannerPanel";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const LIBRARIES: ("geometry")[] = ["geometry"];

const WAREHOUSE_NAME = "Better Edibles Warehouse";
const WAREHOUSE_LATLNG = { lat: 45.5051, lng: -122.675 };

export function RoutePlannerView() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  const { data: ordersData } = useGetAllOrdersQuery({
    status: ["manifested"],
    limit: 999,
  });
  const { data: samplesData } = useGetAllSamplesQuery({
    status: ["submitted", "accepted", "manifested"],
    limit: 999,
  });

  const [stops, setStops] = useState<MapStop[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const { geocodeStops } = useGeocoder(isLoaded);
  const { optimizeRoute, isOptimizing } = useRouteOptimizer(isLoaded);

  // Build stops from API data and trigger geocoding
  useEffect(() => {
    if (!isLoaded) return;

    const orders: any[] = (ordersData as any)?.orders || [];
    const samples: any[] = (samplesData as any)?.samples
      || (samplesData as any)?.data
      || [];

    const built: MapStop[] = [];
    const seen = new Set<string>();

    for (const order of orders) {
      if (!order.store?.address || seen.has(order._id)) continue;
      seen.add(order._id);
      const isSample = (order as any).isSample === true;
      built.push({
        id: order._id,
        kind: isSample ? "sample" : "order",
        storeName: order.store.name,
        address: order.store.address,
        city: order.store.city ?? undefined,
        geocoding: true,
        label: isSample ? "Sample" : order.orderNumber ? `Order #${order.orderNumber}` : "Order",
      });
    }

    for (const sample of samples) {
      if (!sample.store?.address || seen.has(sample._id)) continue;
      seen.add(sample._id);
      built.push({
        id: sample._id,
        kind: "sample",
        storeName: sample.store.name,
        address: sample.store.address,
        city: sample.store.city ?? undefined,
        geocoding: true,
        label: "Sample",
      });
    }

    setStops(built);
    setRouteResult(null);

    if (built.length > 0) {
      geocodeStops(built, (updated) => {
        setStops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      });
    }
    // geocodeStops is stable when isLoaded is true; omit from deps to avoid re-run on every stop update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersData, samplesData, isLoaded]);

  const handleOptimize = useCallback(async () => {
    const geocodedStops = stops.filter((s) => s.lat !== undefined && s.lng !== undefined);
    if (geocodedStops.length < 1) {
      toast.error("No stops with addresses to optimize");
      return;
    }
    const result = await optimizeRoute(geocodedStops, WAREHOUSE_LATLNG);
    if (result) {
      setRouteResult(result);
    } else {
      toast.error("Could not compute route. Check your Google Maps API key permissions.");
    }
  }, [stops, optimizeRoute]);

  const handleClear = useCallback(() => {
    setRouteResult(null);
  }, []);

  const routeOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    routeResult?.orderedStops.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [routeResult]);

  const geocodingCount = stops.filter((s) => s.geocoding).length;
  // After optimize show stops in route order; before optimize show all geocoded stops
  const displayStops = routeResult
    ? routeResult.orderedStops
    : stops.filter((s) => s.lat !== undefined && !s.geocodeError);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-destructive">
        Failed to load Google Maps. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading map…
      </div>
    );
  }

  return (
    <div className="flex gap-3 mt-4" style={{ height: 580 }}>
      <div className="flex-1 rounded-xs overflow-hidden border border-border">
        <RoutePlannerMap
          stops={stops}
          routeOrderMap={routeOrderMap}
          routePath={routeResult?.polylinePath ?? []}
          warehouse={{ ...WAREHOUSE_LATLNG, name: WAREHOUSE_NAME }}
        />
      </div>

      <div className="w-64 shrink-0 border border-border rounded-xs bg-background overflow-hidden">
        <RoutePlannerPanel
          stops={displayStops}
          routeOrderMap={routeOrderMap}
          geocodingCount={geocodingCount}
          routeLegs={routeResult?.legs ?? []}
          totalDistance={routeResult?.totalDistance ?? ""}
          totalDuration={routeResult?.totalDuration ?? ""}
          isOptimizing={isOptimizing}
          warehouseName={WAREHOUSE_NAME}
          onOptimize={handleOptimize}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}
