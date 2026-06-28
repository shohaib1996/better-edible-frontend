import { useCallback, useState } from "react";
import { MapStop, RouteResult, RouteLeg } from "@/types/routePlannerTypes";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function useRouteOptimizer(isLoaded: boolean) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeRoute = useCallback(
    async (
      stops: MapStop[],
      warehouse?: { lat: number; lng: number }
    ): Promise<RouteResult | null> => {
      if (!isLoaded || !window.google) return null;

      const geocoded = stops.filter((s) => s.lat !== undefined && s.lng !== undefined);
      const minStops = warehouse ? 1 : 2;
      if (geocoded.length < minStops) return null;

      setIsOptimizing(true);

      try {
        const service = new google.maps.DirectionsService();
        const toLatLng = (s: MapStop) => new google.maps.LatLng(s.lat!, s.lng!);

        let origin: google.maps.LatLng;
        let destination: google.maps.LatLng;
        let waypointStops: MapStop[];

        if (warehouse) {
          // Warehouse is the fixed start; all stops are freely optimizable
          origin = new google.maps.LatLng(warehouse.lat, warehouse.lng);
          destination = toLatLng(geocoded[geocoded.length - 1]);
          waypointStops = geocoded.slice(0, -1);
        } else {
          origin = toLatLng(geocoded[0]);
          destination = toLatLng(geocoded[geocoded.length - 1]);
          waypointStops = geocoded.slice(1, -1);
        }

        const waypoints = waypointStops.map((s) => ({ location: toLatLng(s), stopover: true }));

        console.log("[RouteOptimizer] origin:", origin.toJSON());
        console.log("[RouteOptimizer] waypoints:", waypointStops.map(s => ({ id: s.id, name: s.storeName, lat: s.lat, lng: s.lng })));
        console.log("[RouteOptimizer] destination:", destination.toJSON());

        const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
          service.route(
            {
              origin,
              destination,
              waypoints,
              optimizeWaypoints: true,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (res, status) => {
              if (status !== "OK") console.error("[DirectionsService] status:", status);
              resolve(status === "OK" && res ? res : null);
            }
          );
        });

        if (!result) return null;

        const route = result.routes[0];

        const reordered: MapStop[] = warehouse
          ? [
              ...route.waypoint_order.map((i) => waypointStops[i]),
              geocoded[geocoded.length - 1],
            ]
          : [
              geocoded[0],
              ...route.waypoint_order.map((i) => waypointStops[i]),
              geocoded[geocoded.length - 1],
            ];

        const legs: RouteLeg[] = route.legs.map((leg) => ({
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          distance: leg.distance?.text ?? "",
          duration: leg.duration?.text ?? "",
        }));

        const totalMeters = route.legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0);
        const totalSeconds = route.legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0);

        const polylinePath = route.overview_path.map((p) => ({
          lat: p.lat(),
          lng: p.lng(),
        }));

        return {
          orderedStops: reordered,
          legs,
          totalDistance: `${(totalMeters / 1609.34).toFixed(1)} mi`,
          totalDuration: formatDuration(totalSeconds),
          polylinePath,
        };
      } catch {
        return null;
      } finally {
        setIsOptimizing(false);
      }
    },
    [isLoaded]
  );

  return { optimizeRoute, isOptimizing };
}
