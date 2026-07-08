export type StopKind = "order" | "sample";
export type StopFilter = "all" | "orders" | "samples";

export interface Warehouse {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface MapStop {
  id: string;
  kind: StopKind;
  storeName: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  geocoding: boolean;
  geocodeError?: boolean;
  label: string;
  storeId: string;
  repId?: string;
  amount?: number;
}

export interface RouteLeg {
  startAddress: string;
  endAddress: string;
  distance: string;
  duration: string;
}

export interface RouteResult {
  orderedStops: MapStop[];
  legs: RouteLeg[];
  totalDistance: string;
  totalDuration: string;
  polylinePath: Array<{ lat: number; lng: number }>;
}
