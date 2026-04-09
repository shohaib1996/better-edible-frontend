"use client";

import type { IOrder } from "@/types";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { PackingListDialog } from "./PackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
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

interface NewOrdersModalsProps {
  selectedOrder: IOrder | null;
  packingOrder: IOrder | null;
  deliveryModalOpen: boolean;
  selectedOrderForDelivery: IOrder | null;
  noDeliveryWarning: { order: IOrder; newStatus: string } | null;
  onCloseOrderDetails: () => void;
  onClosePackingList: () => void;
  onCloseDelivery: () => void;
  onDeliverySuccess: () => void;
  onConfirmShipAnyway: () => void;
  onDismissNoDeliveryWarning: () => void;
}

export function NewOrdersModals({
  selectedOrder,
  packingOrder,
  deliveryModalOpen,
  selectedOrderForDelivery,
  noDeliveryWarning,
  onCloseOrderDetails,
  onClosePackingList,
  onCloseDelivery,
  onDeliverySuccess,
  onConfirmShipAnyway,
  onDismissNoDeliveryWarning,
}: NewOrdersModalsProps) {
  return (
    <>
      {selectedOrder && (
        <OrderDetailsDialog order={selectedOrder} onClose={onCloseOrderDetails} />
      )}

      {packingOrder && (
        <PackingListDialog order={packingOrder} onClose={onClosePackingList} />
      )}

      <AlertDialog
        open={!!noDeliveryWarning}
        onOpenChange={(open) => { if (!open) onDismissNoDeliveryWarning(); }}
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
              onClick={onConfirmShipAnyway}
              className="rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ship Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deliveryModalOpen && selectedOrderForDelivery && (
        <DeliveryModal
          open={deliveryModalOpen}
          orderId={selectedOrderForDelivery._id}
          sampleId={
            (selectedOrderForDelivery as any).isSample
              ? selectedOrderForDelivery._id
              : null
          }
          store={{
            _id: selectedOrderForDelivery.store?._id || "",
            name: selectedOrderForDelivery.store?.name || "",
            address: selectedOrderForDelivery.store?.address || "",
          }}
          orderAmount={selectedOrderForDelivery.total || null}
          onClose={onCloseDelivery}
          onSuccess={onDeliverySuccess}
        />
      )}
    </>
  );
}
