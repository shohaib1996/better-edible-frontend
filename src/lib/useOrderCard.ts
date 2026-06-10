"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IClientOrder, ClientOrderStatus } from "@/types";
import {
  useUpdateClientOrderStatusMutation,
  usePushOrderToPPSMutation,
  useToggleShipASAPMutation,
  useDeleteClientOrderMutation,
} from "@/redux/api/PrivateLabel/clientOrderApi";
import { useLazyCheckDeliveryExistsQuery } from "@/redux/api/Deliveries/deliveryApi";
import { canEditOrder, isOrderInProduction } from "@/constants/privateLabel";

interface Props {
  order: IClientOrder;
  onUpdate: () => void;
  currentRepId?: string;
}

export function useOrderCard({ order, onUpdate, currentRepId }: Props) {
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateClientOrderStatusMutation();
  const [pushToPPS, { isLoading: pushing }] = usePushOrderToPPSMutation();
  const [toggleShipASAP, { isLoading: toggling }] = useToggleShipASAPMutation();
  const [deleteOrder, { isLoading: deleting }] = useDeleteClientOrderMutation();
  const [checkDeliveryExists, { isFetching: checkingDelivery }] = useLazyCheckDeliveryExistsQuery();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPackingListDialog, setShowPackingListDialog] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showShippedDialog, setShowShippedDialog] = useState(false);
  const [showNoDeliveryWarning, setShowNoDeliveryWarning] = useState(false);

  const canEdit = canEditOrder(order.status);
  const canPushToPPS = order.status === "waiting" || order.status === "cooking_molding";
  const inProduction = isOrderInProduction(order.status);
  const isOwnOrder = currentRepId ? order.assignedRep?._id === currentRepId : true;

  async function handleStatusChange(newStatus: ClientOrderStatus) {
    if (newStatus === "shipped") {
      const result = await checkDeliveryExists({ clientOrderId: order._id }).unwrap();
      if (!result.exists) {
        setShowNoDeliveryWarning(true);
      } else {
        setShowShippedDialog(true);
      }
      return;
    }
    try {
      await updateStatus({ id: order._id, status: newStatus }).unwrap();
      toast.success("Order status updated");
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update status");
    }
  }

  async function handleConfirmShipped() {
    try {
      await updateStatus({ id: order._id, status: "shipped" }).unwrap();
      toast.success("Order marked as shipped");
      setShowShippedDialog(false);
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update status");
    }
  }

  async function handlePushToPPS() {
    try {
      await pushToPPS(order._id).unwrap();
      toast.success("Order pushed to production");
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to push to production");
    }
  }

  async function handleToggleShipASAP() {
    try {
      await toggleShipASAP({ id: order._id, shipASAP: !order.shipASAP }).unwrap();
      toast.success(order.shipASAP ? "Ship ASAP disabled" : "Order marked for immediate shipping");
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update");
    }
  }

  async function handleDelete() {
    try {
      await deleteOrder(order._id).unwrap();
      toast.success("Order deleted successfully");
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to delete order");
    }
  }

  return {
    showDeleteDialog, setShowDeleteDialog,
    showEditModal, setShowEditModal,
    showDetailsModal, setShowDetailsModal,
    showPackingListDialog, setShowPackingListDialog,
    showDeliveryModal, setShowDeliveryModal,
    showShippedDialog, setShowShippedDialog,
    showNoDeliveryWarning, setShowNoDeliveryWarning,
    canEdit, canPushToPPS, inProduction, isOwnOrder,
    updatingStatus, pushing, toggling, deleting, checkingDelivery,
    handleStatusChange,
    handleConfirmShipped,
    handlePushToPPS,
    handleToggleShipASAP,
    handleDelete,
  };
}
