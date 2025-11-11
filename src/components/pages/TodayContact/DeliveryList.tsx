"use client";

import { Loader2 } from "lucide-react";
import { DeliveryItem } from "./DeliveryItem";

interface Delivery {
  _id: string;
  storeId: {
    _id: string;
    name: string;
    address: string;
    city?: string | null;
    state?: string | null;
  };
  assignedTo: {
    _id: string;
    name: string;
    repType: string;
  };
  disposition: string;
  paymentAction: string;
  amount: number;
  scheduledAt: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
        <Loader2 className="animate-spin w-6 h-6 text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <p className="text-center text-gray-500 py-10">
          No deliveries assigned for today.
        </p>
      )}
    </div>
  );
};
