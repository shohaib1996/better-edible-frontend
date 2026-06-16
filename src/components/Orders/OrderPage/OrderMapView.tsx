"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPin, Package, FlaskConical, Loader2, X, Check, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetMapOrdersQuery,
  useCreateRouteFromMapMutation,
  IMapOrderItem,
  ICreateRouteItem,
} from "@/redux/api/MapOrders/mapOrdersApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { toast } from "sonner";

declare global {
  interface Window {
    google: any;
    initOrderMap: () => void;
  }
}

type PinType = "orders" | "samples" | "both";

interface SelectedItem extends IMapOrderItem {
  included: boolean; // samples can be toggled; orders always true
}

export const OrderMapView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [calOpen, setCalOpen] = useState(false);
  const [pinType, setPinType] = useState<PinType>("both");
  const [mapReady, setMapReady] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRep, setSelectedRep] = useState<string>("");
  const [drawingMode, setDrawingMode] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data, isLoading, isFetching } = useGetMapOrdersQuery(
    { date: dateStr, type: pinType },
    { skip: !mapReady }
  );

  const { data: repsData } = useGetAllRepsQuery({});
  const [createRoute, { isLoading: isCreating }] = useCreateRouteFromMapMutation();

  // ── Load Google Maps script ──────────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) {
      setMapReady(true);
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
      return;
    }
    window.initOrderMap = () => setMapReady(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,geometry&callback=initOrderMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
      delete window.initOrderMap;
    };
  }, []);

  // ── Initialize Google Map ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || googleMapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 44.05, lng: -121.3 }, // Central Oregon
      zoom: 7,
      mapTypeId: "roadmap",
      fullscreenControl: true,
      streetViewControl: false,
    });
    googleMapRef.current = map;

    // Drawing manager for circle tool
    const dm = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      circleOptions: {
        fillColor: "#f97316",
        fillOpacity: 0.15,
        strokeWeight: 2,
        strokeColor: "#f97316",
        clickable: false,
        editable: true,
        zIndex: 1,
      },
    });
    dm.setMap(map);
    drawingManagerRef.current = dm;

    window.google.maps.event.addListener(dm, "circlecomplete", (circle: any) => {
      // Remove previous circle
      if (circleRef.current) circleRef.current.setMap(null);
      circleRef.current = circle;
      dm.setDrawingMode(null);
      setDrawingMode(false);
      selectPinsInCircle(circle);
    });
  }, [mapReady]);

  // ── Place/update markers when data changes ───────────────────────────────────
  useEffect(() => {
    if (!googleMapRef.current || !data) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    data.results.forEach((item) => {
      const pos = { lat: item.store.lat, lng: item.store.lng };
      const isOrder = item.type === "order";

      const marker = new window.google.maps.Marker({
        position: pos,
        map: googleMapRef.current,
        title: item.store.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isOrder ? "#f97316" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family:sans-serif;min-width:160px">
            <strong style="font-size:13px">${item.store.name}</strong><br/>
            <span style="font-size:11px;color:${isOrder ? "#f97316" : "#3b82f6"}">${isOrder ? "📦 Order" : "🧪 Sample"}</span><br/>
            <span style="font-size:11px;color:#666">${item.store.city || ""}, ${item.store.state || ""}</span><br/>
            ${item.deliveryDate ? `<span style="font-size:11px">Due: ${item.deliveryDate.slice(0, 10)}</span>` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      (marker as any)._item = item;
      markersRef.current.push(marker);
      bounds.extend(pos);
      hasPoints = true;
    });

    if (hasPoints) googleMapRef.current.fitBounds(bounds);
  }, [data]);

  // ── Select pins inside circle ────────────────────────────────────────────────
  const selectPinsInCircle = useCallback((circle: any) => {
    const inside: SelectedItem[] = [];
    markersRef.current.forEach((marker) => {
      const pos = marker.getPosition();
      const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
        pos,
        circle.getCenter()
      );
      if (dist <= circle.getRadius()) {
        inside.push({ ...(marker as any)._item, included: true });
      }
    });
    setSelectedItems(inside);
    if (inside.length > 0) setShowConfirm(true);
  }, []);

  // Re-select when circle is edited
  useEffect(() => {
    if (!circleRef.current) return;
    const listener = window.google.maps.event.addListener(
      circleRef.current,
      "radius_changed",
      () => selectPinsInCircle(circleRef.current)
    );
    const listener2 = window.google.maps.event.addListener(
      circleRef.current,
      "center_changed",
      () => selectPinsInCircle(circleRef.current)
    );
    return () => {
      window.google.maps.event.removeListener(listener);
      window.google.maps.event.removeListener(listener2);
    };
  }, [circleRef.current, selectPinsInCircle]);

  const toggleDrawing = () => {
    if (!drawingManagerRef.current) return;
    if (drawingMode) {
      drawingManagerRef.current.setDrawingMode(null);
      setDrawingMode(false);
    } else {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      setSelectedItems([]);
      setShowConfirm(false);
      drawingManagerRef.current.setDrawingMode(
        window.google.maps.drawing.OverlayType.CIRCLE
      );
      setDrawingMode(true);
    }
  };

  const toggleSampleIncluded = (id: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item._id === id && item.type === "sample"
          ? { ...item, included: !item.included }
          : item
      )
    );
  };

  const handleConfirmRoute = async () => {
    if (!selectedRep) {
      toast.error("Please select a rep/driver first");
      return;
    }
    const included = selectedItems.filter((i) => i.included);
    if (!included.length) {
      toast.error("No stops selected");
      return;
    }
    const items: ICreateRouteItem[] = included.map((i) => ({
      type: i.type,
      _id: i._id,
      storeId: i.store._id,
    }));
    try {
      const result = await createRoute({
        repId: selectedRep,
        scheduledAt: selectedDate.toISOString(),
        items,
      }).unwrap();
      toast.success(`Route created! ${result.deliveries.length} deliveries scheduled.`);
      setShowConfirm(false);
      setSelectedItems([]);
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create route");
    }
  };

  const orders = selectedItems.filter((i) => i.type === "order");
  const samples = selectedItems.filter((i) => i.type === "sample");

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Controls bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date picker */}
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-44 justify-start text-left font-normal bg-white")}>
              <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
              {format(selectedDate, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { setSelectedDate(d); setCalOpen(false); } }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Orders / Samples toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(["both", "orders", "samples"] as PinType[]).map((t) => (
            <button
              key={t}
              onClick={() => setPinType(t)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                pinType === t
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              {t === "both" ? "All" : t === "orders" ? "Orders" : "Samples"}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-2">
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            Orders
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            Samples
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {(isLoading || isFetching) && (
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          )}
          <Badge variant="outline" className="text-gray-600">
            {data?.total ?? 0} pins
          </Badge>
          <Button
            onClick={toggleDrawing}
            variant={drawingMode ? "default" : "outline"}
            className={cn(
              "gap-2",
              drawingMode && "bg-orange-500 hover:bg-orange-600 text-white"
            )}
          >
            <MapPin className="h-4 w-4" />
            {drawingMode ? "Drawing… (click to cancel)" : "Draw Circle"}
          </Button>
        </div>
      </div>

      {/* ── Map + Confirm panel ────────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-[500px]">
        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <span className="ml-3 text-gray-500">Loading map…</span>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Confirm panel */}
        {showConfirm && selectedItems.length > 0 && (
          <div className="w-80 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-orange-50">
              <div>
                <p className="font-semibold text-gray-800">Route Preview</p>
                <p className="text-xs text-gray-500">{selectedItems.filter(i => i.included).length} stops selected</p>
              </div>
              <button onClick={() => { setShowConfirm(false); if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null; } setSelectedItems([]); }}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Orders (always included) */}
              {orders.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Package className="h-3 w-3" /> Orders ({orders.length})
                  </p>
                  {orders.map((item) => (
                    <div key={item._id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-orange-50 border border-orange-100">
                      <Check className="h-3 w-3 text-orange-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.store.name}</p>
                        <p className="text-xs text-gray-500">{item.store.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Samples (toggleable) */}
              {samples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" /> Samples ({samples.length})
                  </p>
                  {samples.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => toggleSampleIncluded(item._id)}
                      className={cn(
                        "w-full flex items-center gap-2 py-1.5 px-2 rounded-lg border text-left transition-colors",
                        item.included
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                        item.included ? "bg-blue-500 border-blue-500" : "border-gray-300"
                      )}>
                        {item.included && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.store.name}</p>
                        <p className="text-xs text-gray-500">{item.store.city}</p>
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-gray-400 mt-1">Tap samples to include/exclude</p>
                </div>
              )}
            </div>

            {/* Rep selector + confirm */}
            <div className="p-3 border-t border-gray-100 space-y-2">
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select driver / rep…</option>
                {(repsData?.reps || repsData || []).map((rep: any) => (
                  <option key={rep._id} value={rep._id}>
                    {rep.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleConfirmRoute}
                disabled={isCreating || !selectedRep}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Create Route ({selectedItems.filter(i => i.included).length} stops)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderMapView;
