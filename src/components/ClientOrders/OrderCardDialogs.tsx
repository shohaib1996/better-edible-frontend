"use client";

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
import { IClientOrder } from "@/types";

interface Props {
  order: IClientOrder;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  showNoDeliveryWarning: boolean;
  setShowNoDeliveryWarning: (v: boolean) => void;
  showShippedDialog: boolean;
  setShowShippedDialog: (v: boolean) => void;
  deleting: boolean;
  updatingStatus: boolean;
  handleDelete: () => void;
  handleConfirmShipped: () => void;
}

export function OrderCardDialogs({
  order,
  showDeleteDialog, setShowDeleteDialog,
  showNoDeliveryWarning, setShowNoDeliveryWarning,
  showShippedDialog, setShowShippedDialog,
  deleting,
  updatingStatus,
  handleDelete,
  handleConfirmShipped,
}: Props) {
  return (
    <>
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-secondary dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order {order.orderNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">
              Cancel
            </AlertDialogCancel>
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

      {/* No Delivery Warning */}
      <AlertDialog open={showNoDeliveryWarning} onOpenChange={setShowNoDeliveryWarning}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>No Delivery Assigned</AlertDialogTitle>
            <AlertDialogDescription>
              Order {order.orderNumber} does not have a delivery created yet. Shipping without a delivery may cause tracking issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoDeliveryWarning(false);
                setShowShippedDialog(true);
              }}
              className="rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ship Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Shipped */}
      <AlertDialog open={showShippedDialog} onOpenChange={setShowShippedDialog}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-secondary dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Order as Shipped</AlertDialogTitle>
            <AlertDialogDescription>
              Order {order.orderNumber} will be marked as shipped. An email notification will be sent to both the client and rep.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">
              Cancel
            </AlertDialogCancel>
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
    </>
  );
}
