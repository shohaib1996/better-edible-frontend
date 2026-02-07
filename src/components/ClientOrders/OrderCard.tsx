"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Truck,
  Calendar,
  Pencil,
  Trash2,
  FileText,
  ClipboardList,
  User,
} from "lucide-react";
import {
  useUpdateClientOrderStatusMutation,
  usePushOrderToPPSMutation,
  useToggleShipASAPMutation,
  useDeleteClientOrderMutation,
} from "@/redux/api/PrivateLabel/clientOrderApi";
import { IClientOrder, ClientOrderStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ORDER_STATUS_LABELS,
  canEditOrder,
  isOrderInProduction,
} from "@/constants/privateLabel";
import { EditOrderModal } from "./EditOrderModal";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { ClientOrderPackingListDialog } from "./ClientOrderPackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { generateClientOrderInvoice } from "@/utils/clientOrderInvoiceGenerator";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: IClientOrder;
  onUpdate: () => void;
}

export const OrderCard = ({ order, onUpdate }: OrderCardProps) => {
  const [updateStatus, { isLoading: updatingStatus }] =
    useUpdateClientOrderStatusMutation();
  const [pushToPPS, { isLoading: pushing }] = usePushOrderToPPSMutation();
  const [toggleShipASAP, { isLoading: toggling }] = useToggleShipASAPMutation();
  const [deleteOrder, { isLoading: deleting }] = useDeleteClientOrderMutation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPackingListDialog, setShowPackingListDialog] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showShippedDialog, setShowShippedDialog] = useState(false);

  const handleStatusChange = async (newStatus: ClientOrderStatus) => {
    // Show dialog for tracking number when changing to shipped
    if (newStatus === "shipped") {
      setShowShippedDialog(true);
      return;
    }

    try {
      await updateStatus({
        id: order._id,
        status: newStatus,
      }).unwrap();
      toast.success("Order status updated");
      onUpdate();
    } catch (error: unknown) {
      console.error("Error updating status:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update status");
    }
  };

  const handleConfirmShipped = async () => {
    try {
      await updateStatus({
        id: order._id,
        status: "shipped",
      }).unwrap();
      toast.success("Order marked as shipped");
      setShowShippedDialog(false);
      onUpdate();
    } catch (error: unknown) {
      console.error("Error updating status:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update status");
    }
  };

  const handlePushToPPS = async () => {
    try {
      await pushToPPS(order._id).unwrap();
      toast.success("Order pushed to production");
      onUpdate();
    } catch (error: unknown) {
      console.error("Error pushing to PPS:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to push to production");
    }
  };

  const handleToggleShipASAP = async () => {
    try {
      await toggleShipASAP({
        id: order._id,
        shipASAP: !order.shipASAP,
      }).unwrap();
      toast.success(
        order.shipASAP
          ? "Ship ASAP disabled"
          : "Order marked for immediate shipping",
      );
      onUpdate();
    } catch (error: unknown) {
      console.error("Error toggling ship ASAP:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(order._id).unwrap();
      toast.success("Order deleted successfully");
      onUpdate();
    } catch (error: unknown) {
      console.error("Error deleting order:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to delete order");
    }
  };

  const canEdit = canEditOrder(order.status);
  const canPushToPPS = order.status === "waiting";
  const inProduction = isOrderInProduction(order.status);

  return (
    <>
      <Card className="p-4 rounded-xs border-border/60 bg-card hover:border-primary/20 transition-all duration-300 shadow-xs hover:shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Order Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
              {order.shipASAP && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 rounded-xs"
                >
                  <Truck className="h-3 w-3" />
                  Ship ASAP
                </Badge>
              )}
              {order.isRecurring && (
                <Badge
                  variant="outline"
                  className="rounded-xs border-primary/20 text-primary bg-primary/5"
                >
                  Recurring
                </Badge>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(true)}
              className="text-lg font-bold text-foreground mb-1 cursor-pointer text-left relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {order.client?.store?.name || "Unknown Store"}
            </button>

            {/* Assigned Rep */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <User className="h-3.5 w-3.5" />
              <span>
                Rep:{" "}
                <span className="font-medium text-foreground">
                  {order.assignedRep?.name || "Unassigned"}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
              </span>
              <span>Items: {order.items.length}</span>
            </div>

            {/* Items Summary */}
            <div className="text-sm mb-2">
              {order.items.map((item, idx) => (
                <span key={idx}>
                  {item.flavorName} ({item.quantity})
                  {idx < order.items.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>

            {/* Pricing */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
              {order.discountAmount > 0 && (
                <span className="text-green-600">
                  Discount: -${order.discountAmount.toFixed(2)}
                </span>
              )}
              <span className="font-semibold">
                Total: ${order.total.toFixed(2)}
              </span>
            </div>

            {/* Notes */}
            {order.note && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                Note: {order.note}
              </p>
            )}
          </div>

          {/* Actions - Two Rows (hide most actions for shipped orders) */}
          <div className="flex flex-col gap-2 items-end">
            {/* Row 1: Delivery, Packing List, Invoice, Status Selector */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {/* Delivery Button - Only for non-shipped */}
              {order.status !== "shipped" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeliveryModal(true)}
                  className="h-8.5 rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Delivery
                </Button>
              )}

              {/* Packing List Button - Only for non-shipped */}
              {order.status !== "shipped" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPackingListDialog(true)}
                  className="h-8.5 rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                >
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Packing List
                </Button>
              )}

              {/* Invoice Button - Only for non-shipped */}
              {order.status !== "shipped" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                  onClick={() => generateClientOrderInvoice(order)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Invoice
                </Button>
              )}

              {/* Status Selector - Always visible */}
              <Select
                value={order.status}
                onValueChange={(value) =>
                  handleStatusChange(value as ClientOrderStatus)
                }
                disabled={updatingStatus}
              >
                <SelectTrigger className="h-8.5 w-[140px] rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xs border-border dark:border-white/20">
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="rounded-xs cursor-pointer focus:bg-primary/10 focus:text-primary"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Push to PPS, Ship ASAP, Edit, Delete - Only for non-shipped */}
            {order.status !== "shipped" && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Push to PPS Button */}
                {canPushToPPS && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePushToPPS}
                    disabled={pushing}
                    className="h-8.5 rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                  >
                    {pushing ? "Pushing..." : "Push to PPS"}
                  </Button>
                )}

                {/* Ship ASAP Toggle */}
                <Button
                  variant={order.shipASAP ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleToggleShipASAP}
                  disabled={toggling}
                  className={cn(
                    "h-8.5 rounded-xs transition-all duration-200",
                    !order.shipASAP &&
                      "border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  <Truck className="h-4 w-4 mr-1" />
                  {order.shipASAP ? "ASAP On" : "Ship ASAP"}
                </Button>

                {/* Edit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  disabled={!canEdit}
                  title={
                    canEdit ? "Edit Order" : "Cannot edit order in production"
                  }
                  className="h-8.5 rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Delete Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={inProduction}
                  className="h-8.5 rounded-xs border border-red-200 dark:border-red-900/50 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title={
                    inProduction
                      ? "Cannot delete order in production"
                      : "Delete Order"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-secondary dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order {order.orderNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xs"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Shipped Dialog */}
      <AlertDialog open={showShippedDialog} onOpenChange={setShowShippedDialog}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-secondary dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Order as Shipped</AlertDialogTitle>
            <AlertDialogDescription>
              Order {order.orderNumber} will be marked as shipped. An email
              notification will be sent to both the client and rep.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmShipped}
              disabled={updatingStatus}
              className="rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {updatingStatus ? "Updating..." : "Mark as Shipped"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Order Modal */}
      <EditOrderModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        order={order}
        onSuccess={onUpdate}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={showDetailsModal ? order : null}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Packing List Dialog */}
      <ClientOrderPackingListDialog
        order={showPackingListDialog ? order : null}
        onClose={() => setShowPackingListDialog(false)}
      />

      {/* Delivery Modal */}
      <DeliveryModal
        open={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        store={
          order.client?.store
            ? {
                _id: order.client.store._id,
                name: order.client.store.name,
                address: order.client.store.address,
              }
            : null
        }
        rep={order.assignedRep}
        orderId={order._id}
        onSuccess={onUpdate}
      />
    </>
  );
};
