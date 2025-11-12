// src/components/pages/TodayContact/DeliveryItem.tsx
"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { ChevronUp, ChevronDown, Truck, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { SampleModal } from "@/src/components/Sample/SampleModal";
import type { Delivery } from "@/src/types";

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
  const [openSampleModal, setOpenSampleModal] = useState(false);

  const openMaps = () => {
    const address = delivery.storeId?.address;
    if (address) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          address
        )}`,
        "_blank"
      );
    } else {
      toast.error("No address found");
    }
  };

  const formatScheduledAt = (iso?: string) => {
    if (!iso) return "No schedule available";
    try {
      const date = new Date(iso);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 transition hover:shadow-md">
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
            Scheduled At: {formatScheduledAt(delivery.scheduledAt)}
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenSampleModal(true)}
        >
          Sample
        </Button>

        <Button variant="outline" size="sm">
          Dismiss
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditDelivery(delivery)}
        >
          Edit
        </Button>

        <Button
          className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 text-sm"
          onClick={openMaps}
        >
          <Truck size={16} /> Drive
        </Button>

        <Button className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 text-sm">
          Follow Up
        </Button>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>Assigned to: {delivery.assignedTo?.name || "Unknown rep"}</span>
        <span>
          Status:{" "}
          <span className="capitalize font-medium text-gray-700">
            {delivery.status.replaceAll("_", " ")}
          </span>
        </span>
      </div>

      {/* Sample Modal */}
      <SampleModal
        open={openSampleModal}
        onClose={() => setOpenSampleModal(false)}
        storeId={delivery.storeId._id}
        storeName={delivery.storeId.name}
        storeAddress={delivery.storeId.address}
        repId={delivery.assignedTo._id}
        repName={delivery.assignedTo.name}
      />
    </div>
  );
};
