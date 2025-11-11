"use client";

import { Button } from "@/src/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  Truck,
  DollarSign,
} from "lucide-react";

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

interface DeliveryItemProps {
  delivery: Delivery;
  index: number;
  moveDelivery: (index: number, direction: "up" | "down") => void;
  handleNewOrder: (delivery: Delivery) => void;
  handleEditDelivery: (delivery: Delivery) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const DeliveryItem = ({
  delivery,
  index,
  moveDelivery,
  handleNewOrder,
  handleEditDelivery,
  isFirst,
  isLast,
}: DeliveryItemProps) => {
  return (
    <div
      key={delivery._id}
      className="bg-white rounded-xl border shadow-sm p-5 transition hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Store Info */}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {delivery.storeId?.name}
          </h2>
          <p className="text-sm text-gray-600">
            {delivery.storeId?.address || "Address not available"}
          </p>
          <p className="text-xs italic text-gray-400">
            Note: {delivery.notes || "No special notes"}
          </p>
          <p className="text-xs italic text-gray-400">
            Scheduled At:{" "}
            {delivery.scheduledAt
              ? (() => {
                  const date = new Date(delivery.scheduledAt);
                  const day = date.getUTCDate();
                  const month = date.toLocaleString("en-US", {
                    month: "short",
                  });
                  const year = date.getUTCFullYear();
                  return `${month} ${day}, ${year}`;
                })()
              : "No schedule available"}
          </p>
        </div>

        {/* Payment Info + Reorder */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <DollarSign size={16} />
            <span>${delivery.amount.toFixed(2)}</span>
          </div>
          <span className="text-xs text-gray-500 uppercase">
            {delivery.disposition.replaceAll("_", " ")}
          </span>

          {/* Up/Down Arrows */}
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={isFirst}
              onClick={() => moveDelivery(index, "up")}
            >
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isLast}
              onClick={() => moveDelivery(index, "down")}
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-4 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNewOrder(delivery)}
          className="cursor-pointer"
        >
          Order
        </Button>
        <Button variant="outline" size="sm">
          Sample
        </Button>
        <Button variant="outline" size="sm">
          Dismiss
        </Button>
        <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => handleEditDelivery(delivery)}>
          Edit
        </Button>
        <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 text-sm cursor-pointer"
          onClick={() => {
            const address = delivery.storeId?.address;
            if (address) {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
            }
          }}>
          <Truck size={16} /> Drive
        </Button>
        <Button className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 text-sm">
          Follow Up
        </Button>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>
          Assigned to: {delivery.assignedTo?.name || "Unknown rep"}
        </span>
        <span>
          Status:{" "}
          <span className="capitalize font-medium text-gray-700">
            {delivery.status.replaceAll("_", " ")}
          </span>
        </span>
      </div>
    </div>
  );
};
