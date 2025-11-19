// src/components/pages/TodayContact/DeliveryItem.tsx
"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { ChevronUp, ChevronDown, Truck, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/src/components/ReUsableComponents/ConfirmDialog";
import { useDeleteDeliveryMutation } from "@/src/redux/api/Deliveries/deliveryApi";
import { AddNoteModal } from "@/src/components/Notes/AddNoteModal";
import { NotesModal } from "@/src/components/Notes/NotesModal";
import { SampleModal } from "@/src/components/Sample/SampleModal";
import type { Delivery } from "@/src/types";
import { FollowUpModal } from "../../Followup/FollowUpModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useUpdateDeliveryStatusMutation } from "@/src/redux/api/Deliveries/deliveryApi";

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
  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [isViewNotesModalOpen, setViewNotesModalOpen] = useState(false);
  const [isFollowupModalOpen, setFollowupModalOpen] = useState(false);

  const [deleteDelivery, { isLoading: isDeleting }] =
    useDeleteDeliveryMutation();

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateDeliveryStatusMutation();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: delivery._id, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDelivery(delivery._id).unwrap();
      toast.success("Delivery dismissed successfully");
    } catch (error) {
      toast.error("Failed to delete delivery");
    }
  };

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
          <h2
            className="text-lg text-black font-bold dark:text-white relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-[#326EA6] after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
            onClick={() => setAddNoteModalOpen(true)}
          >
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

        <ConfirmDialog
          triggerText="Dismiss"
          title="Are you sure you want to dismiss this delivery?"
          description="This action cannot be undone. This will permanently delete the delivery."
          onConfirm={handleDelete}
          disabled={isDeleting}
          variant="outline"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditDelivery(delivery)}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewNotesModalOpen(true)}
        >
          View Notes
        </Button>

        <Button
          className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 text-sm"
          onClick={openMaps}
        >
          <Truck size={16} /> Drive
        </Button>
        <Button
          className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 text-sm"
          onClick={() => setFollowupModalOpen(true)}
        >
          Follow Up
        </Button>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>Assigned to: {delivery.assignedTo?.name || "Unknown rep"}</span>
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Select
            value={delivery.status}
            onValueChange={handleStatusChange}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="w-[140px] h-8 border-green-500">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modals */}
      <SampleModal
        open={openSampleModal}
        onClose={() => setOpenSampleModal(false)}
        storeId={delivery.storeId._id}
        storeName={delivery.storeId.name}
        storeAddress={delivery.storeId.address}
        repId={delivery.assignedTo._id}
        repName={delivery.assignedTo.name}
      />
      <AddNoteModal
        open={isAddNoteModalOpen}
        onClose={() => setAddNoteModalOpen(false)}
        storeId={delivery.storeId._id}
        repId={delivery.assignedTo._id}
      />
      <NotesModal
        open={isViewNotesModalOpen}
        onClose={() => setViewNotesModalOpen(false)}
        entityId={delivery.storeId}
      />
      <FollowUpModal
        open={isFollowupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        storeId={delivery.storeId._id}
        repId={delivery.assignedTo._id}
      />
    </div>
  );
};
