"use client";

import { MapPin } from "lucide-react";

interface Props {
  store: { _id: string; name: string; address?: string };
}

export function DeliveryStoreInfo({ store }: Props) {
  return (
    <div className="bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xs p-3 shadow-sm shrink-0">
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-bold text-foreground">{store.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {store.address || "Address not available"}
          </p>
        </div>
      </div>
    </div>
  );
}
