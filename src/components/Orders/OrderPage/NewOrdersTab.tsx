"use client";

import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { IOrder, IRep } from "@/types";
import { useNewOrdersTab } from "@/redux/hooks/useNewOrdersTab";
import { OrderCard } from "./OrderCard";
import { NewOrdersModals } from "./NewOrdersModals";

interface NewOrdersTabProps {
  orders: IOrder[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
  currentRep?: Partial<IRep> | null;
  isRepView?: boolean;
}

export const NewOrdersTab: React.FC<NewOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit,
  currentRep,
  isRepView = false,
}) => {
  const {
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
  } = useNewOrdersTab(orders, handleChangeStatus);

  if (!orders.length) {
    return <p className="text-gray-500 mt-4">No new orders found.</p>;
  }

  let orderIndex = 0;
  let sampleIndex = 0;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between pr-2">
          <Select
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "orders" | "samples" | "both")}
          >
            <SelectTrigger className="w-44 rounded-xs border border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Orders &amp; Samples</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="samples">Samples</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-right">
            <span className="font-semibold text-emerald-600">
              {regularOrders.length} Orders = $
              {ordersValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {sampleOrders.length > 0 && (
              <span className="font-semibold text-purple-600 ml-4">
                {sampleOrders.length} Samples
              </span>
            )}
          </div>
        </div>

        {/* Order cards */}
        {filteredOrders.map((order) => {
          const isSample = (order as any).isSample === true;
          const displayNumber = isSample ? ++sampleIndex : ++orderIndex;
          const isOwnOrder = isRepView ? order.rep?._id === currentRep?._id : true;

          return (
            <OrderCard
              key={order._id}
              order={order}
              displayNumber={displayNumber}
              isOwnOrder={isOwnOrder}
              updateOrder={updateOrder}
              updateSample={updateSample}
              refetch={refetch}
              onOpenDialog={handleOpenDialog}
              onEdit={onEdit}
              onOpenDelivery={(o) => {
                setSelectedOrderForDelivery(o);
                setDeliveryModalOpen(true);
              }}
              onOpenPackingList={setPackingOrder}
              onStatusChange={handleStatusChangeWithCheck}
              onUnauthorized={handleUnauthorizedAction}
            />
          );
        })}
      </div>

      {/* Modals */}
      <NewOrdersModals
        selectedOrder={selectedOrder}
        packingOrder={packingOrder}
        deliveryModalOpen={deliveryModalOpen}
        selectedOrderForDelivery={selectedOrderForDelivery}
        noDeliveryWarning={noDeliveryWarning}
        onCloseOrderDetails={handleCloseDialog}
        onClosePackingList={() => setPackingOrder(null)}
        onCloseDelivery={() => {
          setDeliveryModalOpen(false);
          setSelectedOrderForDelivery(null);
        }}
        onDeliverySuccess={() => {
          refetch();
          setDeliveryModalOpen(false);
          setSelectedOrderForDelivery(null);
        }}
        onConfirmShipAnyway={() => {
          if (noDeliveryWarning) {
            handleChangeStatus(noDeliveryWarning.order._id, noDeliveryWarning.newStatus);
          }
          setNoDeliveryWarning(null);
        }}
        onDismissNoDeliveryWarning={() => setNoDeliveryWarning(null)}
      />
    </TooltipProvider>
  );
};
