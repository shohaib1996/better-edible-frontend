"use client";

import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { PackingListDialog } from "./PackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { useUpdateSampleMutation } from "@/redux/api/Samples/samplesApi";
import { useLazyCheckDeliveryExistsQuery } from "@/redux/api/Deliveries/deliveryApi";
import { StatusBadge, getStatusStyle } from "./allOrders/orderStatusHelpers";
import { OrderCardActions } from "./allOrders/OrderCardActions";
import { SampleCardBody, RegularOrderCardBody } from "./allOrders/OrderCardBody";
import type { IOrder, IRep } from "@/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
(pdfMake as any).vfs = (pdfFonts as any).vfs;

interface AllOrdersTabProps {
  orders: IOrder[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
  currentRep?: Partial<IRep> | null;
}

export const AllOrdersTab: React.FC<AllOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit,
  currentRep,
}) => {
  const [updateSample] = useUpdateSampleMutation();
  const [checkDeliveryExists] = useLazyCheckDeliveryExistsQuery();

  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [packingOrder, setPackingOrder] = useState<IOrder | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<IOrder | null>(null);
  const [noDeliveryWarning, setNoDeliveryWarning] = useState<{ order: IOrder; newStatus: string } | null>(null);

  const handleUnauthorized = () => {
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

  const allOrdersValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (!orders.length) {
    return <p className="text-muted-foreground mt-4">No orders found.</p>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="text-right font-semibold text-primary pr-2">
          Total Orders Value: $
          {allOrdersValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {orders.map((order) => {
          const isSample = (order as any).isSample === true;
          const isOwnOrder = order.rep?._id === currentRep?._id;

          return (
            <Card
              key={order._id}
              className={cn(
                "border rounded-xs overflow-hidden shadow-sm hover:shadow-md transition py-3 gap-0",
                !isOwnOrder && "opacity-75",
                isSample
                  ? "bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-l-4 border-l-purple-500 border-purple-200 dark:border-purple-800"
                  : getStatusStyle(order.status)
              )}
            >
              {/* Header row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-3 py-1.5 gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {!isSample ? (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      >
                        {order.store?.name || "N/A"}
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                        {order.store?.name || "N/A"}
                      </span>
                    )}
                    <StatusBadge status={order.status} />
                    {isSample && (
                      <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-linear-to-r from-purple-600 to-pink-600 text-white">
                        SAMPLE
                      </span>
                    )}
                    {!isOwnOrder && (
                      <span className="px-2 py-0.5 rounded-xs text-xs font-semibold bg-muted text-muted-foreground">
                        Other Rep
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.store?.address || "No address available"}
                  </p>
                </div>

                <OrderCardActions
                  order={order}
                  isOwnOrder={isOwnOrder}
                  isSample={isSample}
                  onDelivery={() => { setSelectedOrderForDelivery(order); setDeliveryModalOpen(true); }}
                  onEdit={() => onEdit(order)}
                  onPackingList={() => setPackingOrder(order)}
                  onStatusChange={(value) => handleStatusChangeWithCheck(order, value)}
                  onUnauthorized={handleUnauthorized}
                />
              </div>

              {/* Body */}
              <div className="bg-secondary/30 dark:bg-secondary/10 text-xs leading-relaxed rounded-xs mx-3 px-3 py-2">
                {isSample ? (
                  <SampleCardBody
                    order={order}
                    isOwnOrder={isOwnOrder}
                    updateSample={updateSample}
                    refetch={refetch}
                  />
                ) : (
                  <RegularOrderCardBody
                    order={order}
                    isOwnOrder={isOwnOrder}
                    updateOrder={updateOrder}
                    refetch={refetch}
                  />
                )}
                {order.note && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-foreground">
                      <span className="font-semibold text-primary">Note:</span> {order.note}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <OrderDetailsDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      <PackingListDialog order={packingOrder} onClose={() => setPackingOrder(null)} />

      <AlertDialog
        open={!!noDeliveryWarning}
        onOpenChange={(open) => { if (!open) setNoDeliveryWarning(null); }}
      >
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>No Delivery Assigned</AlertDialogTitle>
            <AlertDialogDescription>
              This order does not have a delivery created yet. Shipping without a delivery may cause tracking issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (noDeliveryWarning) handleChangeStatus(noDeliveryWarning.order._id, noDeliveryWarning.newStatus);
                setNoDeliveryWarning(null);
              }}
              className="rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ship Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeliveryModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        store={selectedOrderForDelivery?.store || null}
        rep={currentRep}
        sampleId={(selectedOrderForDelivery as any)?.isSample ? selectedOrderForDelivery?._id : null}
        orderId={!(selectedOrderForDelivery as any)?.isSample ? selectedOrderForDelivery?._id : null}
        orderAmount={selectedOrderForDelivery?.total || null}
      />
    </TooltipProvider>
  );
};
