// src/components/pages/TodayContact/DeliveryItem.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  Truck,
  DollarSign,
  ShoppingCart,
  Package,
  X,
  Pencil,
  StickyNote,
  CalendarPlus,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { useDeleteDeliveryMutation } from "@/redux/api/Deliveries/deliveryApi";
import { AddNoteModal } from "@/components/Notes/AddNoteModal";
import { NotesModal } from "@/components/Notes/NotesModal";
import { SampleModal } from "@/components/Sample/SampleModal";
import type { Delivery } from "@/types";
import { ManageFollowUpModal } from "../../Followup/ManageFollowUpModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateDeliveryStatusMutation } from "@/redux/api/Deliveries/deliveryApi";
import {
  useChangeOrderStatusMutation,
  useUpdateOrderMutation,
} from "@/redux/api/orders/orders";
import {
  useUpdateSampleStatusMutation,
  useUpdateSampleMutation,
} from "@/redux/api/Samples/samplesApi";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";

interface DeliveryItemProps {
  delivery: Delivery;
  index: number;
  moveDelivery: (index: number, direction: "up" | "down") => void;
  handleNewOrder: (delivery: Delivery) => void;
  handleEditDelivery: (delivery: Delivery) => void;
  isFirst: boolean;
  isLast: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_transit":
      return "bg-blue-500 text-white";
    case "completed":
      return "bg-emerald-500 text-white";
    case "cancelled":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

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
  const [changeOrderStatus] = useChangeOrderStatusMutation();
  const [updateSampleStatus] = useUpdateSampleStatusMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [updateSample] = useUpdateSampleMutation();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: delivery._id, status: newStatus }).unwrap();

      if (newStatus === "completed") {
        const today = format(new Date(), "yyyy-MM-dd");

        if (delivery.orderId) {
          await updateOrder({
            id: delivery.orderId,
            deliveryDate: delivery.scheduledAt
              ? format(new Date(delivery.scheduledAt), "yyyy-MM-dd")
              : today,
            shippedDate: today,
          }).unwrap();

          await changeOrderStatus({
            id: delivery.orderId,
            status: "shipped",
          }).unwrap();
          toast.success("Linked order marked as shipped");
        } else if (delivery.sampleId) {
          await updateSample({
            id: delivery.sampleId,
            deliveryDate: delivery.scheduledAt
              ? format(new Date(delivery.scheduledAt), "yyyy-MM-dd")
              : today,
            shippedDate: today,
          }).unwrap();

          await updateSampleStatus({
            id: delivery.sampleId,
            status: "shipped",
          }).unwrap();
          toast.success("Linked sample marked as shipped");
        }
      }

      if (newStatus === "cancelled") {
        if (delivery.orderId) {
          await changeOrderStatus({
            id: delivery.orderId,
            status: "cancelled",
          }).unwrap();
          toast.success("Linked order marked as cancelled");
        } else if (delivery.sampleId) {
          await updateSampleStatus({
            id: delivery.sampleId,
            status: "cancelled",
          }).unwrap();
          toast.success("Linked sample marked as cancelled");
        }
      }

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
    if (!iso) return "No schedule";
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
    <div className="bg-card rounded-xs border-l-4 border-l-primary border border-border shadow-sm transition hover:shadow-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 py-3">
        {/* Store Info */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className="text-base md:text-lg text-foreground font-bold relative inline-block cursor-pointer group"
              onClick={() => setAddNoteModalOpen(true)}
            >
              {delivery.storeId?.name}
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-xs ${getStatusColor(
                delivery.status
              )}`}
            >
              {delivery.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {delivery.storeId?.address || "Address not available"}
          </p>
        </div>

        {/* Amount + Reorder Buttons */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>{delivery.amount.toFixed(2)}</span>
            </div>
            <span className="text-xs text-muted-foreground uppercase">
              {delivery.disposition.replaceAll("_", " ")}
            </span>
          </div>

          {/* Up/Down Arrows */}
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              disabled={isFirst}
              onClick={() => moveDelivery(index, "up")}
              className="h-6 w-6 rounded-xs"
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isLast}
              onClick={() => moveDelivery(index, "down")}
              className="h-6 w-6 rounded-xs"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-4 py-2 bg-secondary/30 dark:bg-secondary/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatScheduledAt(delivery.scheduledAt)}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {delivery.assignedTo?.name || "Unknown"}
          </span>
          {delivery.notes && (
            <span className="italic">Note: {delivery.notes}</span>
          )}
        </div>

        {/* Status Select */}
        <Select
          value={delivery.status}
          onValueChange={handleStatusChange}
          disabled={isUpdatingStatus}
        >
          <SelectTrigger
            className={`h-7 w-28 rounded-xs text-xs gap-1 [&>svg]:ml-0 ${getStatusColor(
              delivery.status
            )}`}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xs">
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="completed">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-border">
        <TooltipProvider>
          <MobileTooltip content="Order">
            <Button
              size="icon"
              onClick={() => handleNewOrder(delivery)}
              className="h-8 w-8 rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </MobileTooltip>

          <MobileTooltip content="Sample">
            <Button
              size="icon"
              onClick={() => setOpenSampleModal(true)}
              className="h-8 w-8 rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary"
            >
              <Package className="h-4 w-4" />
            </Button>
          </MobileTooltip>

          <MobileTooltip content="Edit">
            <Button
              size="icon"
              onClick={() => handleEditDelivery(delivery)}
              className="h-8 w-8 rounded-xs bg-secondary text-white hover:bg-primary dark:bg-secondary dark:hover:bg-primary"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </MobileTooltip>

          <MobileTooltip content="View Notes">
            <Button
              size="icon"
              onClick={() => setViewNotesModalOpen(true)}
              className="h-8 w-8 rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </MobileTooltip>

          <MobileTooltip content="Follow Up">
            <Button
              size="icon"
              onClick={() => setFollowupModalOpen(true)}
              className="h-8 w-8 rounded-xs bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </MobileTooltip>

          <MobileTooltip content="Drive">
            <Button
              size="icon"
              onClick={openMaps}
              className="h-8 w-8 rounded-xs bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <Truck className="h-4 w-4" />
            </Button>
          </MobileTooltip>

          <MobileTooltip content="Dismiss">
            <ConfirmDialog
              trigger={
                <Button
                  size="icon"
                  disabled={isDeleting}
                  className="h-8 w-8 rounded-xs bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 border-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              }
              title="Are you sure you want to dismiss this delivery?"
              description="This action cannot be undone. This will permanently delete the delivery."
              onConfirm={handleDelete}
              disabled={isDeleting}
            />
          </MobileTooltip>
        </TooltipProvider>
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
      <ManageFollowUpModal
        open={isFollowupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        storeId={delivery.storeId._id}
        repId={delivery.assignedTo._id}
      />
    </div>
  );
};
