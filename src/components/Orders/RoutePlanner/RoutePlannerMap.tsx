"use client";

import { useCallback } from "react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { MapStop } from "@/types/routePlannerTypes";

const MAP_CENTER = { lat: 44.0, lng: -120.5 };
const MAP_CONTAINER = { width: "100%", height: "100%" };

const POLYLINE_OPTIONS = {
  strokeColor: "#16a34a",
  strokeWeight: 4,
  strokeOpacity: 0.8,
};

interface Props {
  stops: MapStop[];
  routeOrderMap: Map<string, number>;
  routePath: Array<{ lat: number; lng: number }>;
  warehouse: { lat: number; lng: number; name: string };
}

export function RoutePlannerMap({ stops, routeOrderMap, routePath, warehouse }: Props) {
  const onMapLoad = useCallback((_map: google.maps.Map) => {}, []);

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER}
      center={MAP_CENTER}
      zoom={7}
      onLoad={onMapLoad}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      }}
    >
      {stops
        .filter((s) => s.lat !== undefined && s.lng !== undefined)
        .map((stop) => {
          const routeNum = routeOrderMap.get(stop.id);
          const fillColor = routeNum !== undefined
            ? "#16a34a"
            : stop.kind === "order"
            ? "#f97316"
            : "#3b82f6";
          return (
            <Marker
              key={stop.id}
              position={{ lat: stop.lat!, lng: stop.lng! }}
              title={`${stop.storeName} — ${stop.address}`}
              label={
                routeNum !== undefined
                  ? { text: String(routeNum), color: "white", fontWeight: "bold", fontSize: "11px" }
                  : undefined
              }
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: routeNum !== undefined ? 11 : 8,
                fillColor,
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          );
        })}

      {routePath.length > 0 && (
        <Polyline path={routePath} options={POLYLINE_OPTIONS} />
      )}

      <Marker
        position={{ lat: warehouse.lat, lng: warehouse.lng }}
        title={warehouse.name}
        zIndex={10}
        label={{ text: "W", color: "white", fontWeight: "bold", fontSize: "11px" }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: "#7c3aed",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2.5,
        }}
      />
    </GoogleMap>
  );
}
