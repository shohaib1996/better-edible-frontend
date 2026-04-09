"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { IOrder } from "@/types";
import { useUpdateSampleMutation } from "@/redux/api/Samples/samplesApi";
import { useLazyCheckDeliveryExistsQuery } from "@/redux/api/Deliveries/deliveryApi";

export function useNewOrdersTab(
  orders: IOrder[],
  handleChangeStatus: (id: string, status: string) => void
) {
  const [updateSample] = useUpdateSampleMutation();
  const [checkDeliveryExists] = useLazyCheckDeliveryExistsQuery();

  const [viewMode, setViewMode] = useState<"orders" | "samples" | "both">("both");
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [packingOrder, setPackingOrder] = useState<IOrder | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<IOrder | null>(null);
  const [noDeliveryWarning, setNoDeliveryWarning] = useState<{ order: IOrder; newStatus: string } | null>(null);

  const handleOpenDialog = (order: IOrder) => setSelectedOrder(order);
  const handleCloseDialog = () => setSelectedOrder(null);

  const handleUnauthorizedAction = () => {
    toast.error("You are not authorized to change it. This is not your order.");
  };

  const handleStatusChangeWithCheck = async (order: IOrder, newStatus: string) => {
    if (newStatus === "shipped") {
      const isSample = (order as any).isSample === true;
      const params = isSample ? { sampleId: order._id } : { orderId: order._id };
      const result = await checkDeliveryExists(params).unwrap();
      if (!result.exists) {
        setNoDeliveryWarning({ order, newStatus });
        return;
      }
    }
    handleChangeStatus(order._id, newStatus);
  };

  const filteredOrders =
    viewMode === "orders"
      ? orders.filter((o) => !(o as any).isSample)
      : viewMode === "samples"
      ? orders.filter((o) => (o as any).isSample)
      : orders;

  const regularOrders = filteredOrders.filter((o) => !(o as any).isSample);
  const sampleOrders = filteredOrders.filter((o) => (o as any).isSample);
  const ordersValue = regularOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    updateSample,
    viewMode,
    setViewMode,
    selectedOrder,
    packingOrder,
    setPackingOrder,
    deliveryModalOpen,
    setDeliveryModalOpen,
    selectedOrderForDelivery,
    setSelectedOrderForDelivery,
    noDeliveryWarning,
    setNoDeliveryWarning,
    handleOpenDialog,
    handleCloseDialog,
    handleUnauthorizedAction,
    handleStatusChangeWithCheck,
    filteredOrders,
    regularOrders,
    sampleOrders,
    ordersValue,
  };
}
