// src/components/pages/TodayContact/DeliveryList.tsx
"use client";

import { Loader2 } from "lucide-react";
import { DeliveryItem } from "./DeliveryItem";
import type { Delivery } from "@/types";

interface DeliveryListProps {
  isLoading: boolean;
  orderedDeliveries: Delivery[];
  moveDelivery: (index: number, direction: "up" | "down") => void;
  handleNewOrder: (delivery: Delivery) => void;
  handleEditDelivery: (delivery: Delivery) => void;
}

export const DeliveryList = ({
  isLoading,
  orderedDeliveries,
  moveDelivery,
  handleNewOrder,
  handleEditDelivery,
}: DeliveryListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderedDeliveries.length > 0 ? (
        orderedDeliveries.map((delivery, index) => (
          <DeliveryItem
            key={delivery._id}
            delivery={delivery}
            index={index}
            moveDelivery={moveDelivery}
            handleNewOrder={handleNewOrder}
            handleEditDelivery={handleEditDelivery}
            isFirst={index === 0}
            isLast={index === orderedDeliveries.length - 1}
          />
        ))
      ) : (
        <div className="text-center py-10 bg-card rounded-xs border border-border">
          <p className="text-muted-foreground">
            No deliveries assigned for today.
          </p>
        </div>
      )}
    </div>
  );
};
