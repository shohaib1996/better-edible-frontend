"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Truck, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ORDER_STATUS_COLORS,
  canEditOrder,
  isOrderInProduction,
} from "@/constants/privateLabel";

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

  const handleStatusChange = async (newStatus: ClientOrderStatus) => {
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
          : "Order marked for immediate shipping"
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
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Order Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
              <Badge className={ORDER_STATUS_COLORS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              {order.shipASAP && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <Truck className="h-3 w-3" />
                  Ship ASAP
                </Badge>
              )}
              {order.isRecurring && (
                <Badge variant="outline">Recurring</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              {order.client?.store?.name || "Unknown Store"}
            </p>

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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Selector */}
            <Select
              value={order.status}
              onValueChange={(value) =>
                handleStatusChange(value as ClientOrderStatus)
              }
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Push to PPS Button */}
            {canPushToPPS && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePushToPPS}
                disabled={pushing}
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
            >
              <Truck className="h-4 w-4 mr-1" />
              {order.shipASAP ? "ASAP On" : "Ship ASAP"}
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={!canEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                  disabled={inProduction}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order {order.orderNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
