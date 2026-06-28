import { useCallback } from "react";
import { MapStop } from "@/types/routePlannerTypes";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Oregon bounding box — any geocoding result outside this is rejected
const OR_BOUNDS = { minLat: 41.99, maxLat: 46.24, minLng: -124.56, maxLng: -116.46 };
const inOregon = (lat: number, lng: number) =>
  lat >= OR_BOUNDS.minLat && lat <= OR_BOUNDS.maxLat &&
  lng >= OR_BOUNDS.minLng && lng <= OR_BOUNDS.maxLng;

export function useGeocoder(isLoaded: boolean) {
  const geocodeStops = useCallback(
    async (stops: MapStop[], onUpdate: (updated: MapStop) => void) => {
      if (!isLoaded || typeof window === "undefined" || !window.google) return;

      const geocoder = new google.maps.Geocoder();

      for (const stop of stops) {
        const query = stop.city
          ? `${stop.address}, ${stop.city}, Oregon`
          : `${stop.address}, Oregon`;

        try {
          const results = await new Promise<google.maps.GeocoderResult[] | null>(
            (resolve) => {
              geocoder.geocode(
                { address: query, componentRestrictions: { country: "us" } },
                (res, status) => resolve(status === "OK" && res ? res : null)
              );
            }
          );

          if (results?.[0]) {
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            if (inOregon(lat, lng)) {
              onUpdate({ ...stop, lat, lng, geocoding: false });
            } else {
              console.warn(`[Geocoder] "${query}" resolved outside Oregon: (${lat}, ${lng}) — skipping`);
              onUpdate({ ...stop, geocoding: false, geocodeError: true });
            }
          } else {
            onUpdate({ ...stop, geocoding: false, geocodeError: true });
          }
        } catch {
          onUpdate({ ...stop, geocoding: false, geocodeError: true });
        }

        await sleep(60);
      }
    },
    [isLoaded]
  );

  return { geocodeStops };
}
