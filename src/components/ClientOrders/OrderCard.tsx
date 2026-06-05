"use client";

import { toast } from "sonner";
import { Truck, Calendar, Pencil, Trash2, FileText, ClipboardList, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ORDER_STATUS_LABELS } from "@/constants/privateLabel";
import { EditOrderModal } from "./EditOrderModal";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { ClientOrderPackingListDialog } from "./ClientOrderPackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { generateClientOrderInvoice } from "@/utils/clientOrderInvoiceGenerator";
import { cn } from "@/lib/utils";
import { useOrderCard } from "@/lib/useOrderCard";
import { OrderCardSummary } from "./OrderCardSummary";
import { OrderCardDialogs } from "./OrderCardDialogs";

interface OrderCardProps {
  order: IClientOrder;
  onUpdate: () => void;
  currentRepId?: string;
}

export const OrderCard = ({ order, onUpdate, currentRepId }: OrderCardProps) => {
  const {
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
  } = useOrderCard({ order, onUpdate, currentRepId });

  const authToast = () =>
    toast.error("You are not authorized to change it. This is not your order.");

  return (
    <>
      <Card className={cn("p-0 gap-0 rounded-xs border-l-4 border-l-primary bg-card transition-all duration-300 shadow-xs overflow-hidden", !isOwnOrder && "opacity-75")}>
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 p-3">
          {/* Left - Store, Order#, Delivery */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {order.shipASAP && (
                <Badge variant="destructive" className="flex items-center gap-1 rounded-xs">
                  <Truck className="h-3 w-3" /> Ship ASAP
                </Badge>
              )}
              {order.isRecurring && (
                <Badge variant="outline" className="rounded-xs border-primary/20 text-primary bg-primary/5">
                  Recurring
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-lg font-bold text-foreground cursor-pointer text-left relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {order.client?.store?.name || "Unknown Store"}
              </button>
              {!isOwnOrder && currentRepId && (
                <span className="px-2 py-0.5 rounded-xs text-xs font-semibold bg-muted text-muted-foreground">
                  Other Rep
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground">{order.orderNumber}</h3>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Delivery:{" "}
                <span className="font-medium text-foreground">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </span>
              </span>
            </div>

            {/* Rep info — small screens */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2 lg:hidden">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Rep: <span className="font-medium text-foreground">{order.assignedRep?.name || "Unassigned"}</span>
              </span>
              <span>
                <span className="font-semibold text-primary">Created by:</span>{" "}
                <span className="font-medium text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
              </span>
            </div>
          </div>

          {/* Right - Actions */}
          <TooltipProvider>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {order.status !== "shipped" && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline" size="icon"
                          onClick={() => isOwnOrder ? setShowDeliveryModal(true) : authToast()}
                          disabled={!isOwnOrder}
                          className={cn("h-8 w-8 rounded-xs border-none bg-accent text-accent-foreground hover:bg-primary hover:text-white dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Schedule delivery</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline" size="icon"
                          onClick={() => isOwnOrder ? setShowPackingListDialog(true) : authToast()}
                          disabled={!isOwnOrder}
                          className={cn("h-8 w-8 rounded-xs border-none bg-accent text-accent-foreground hover:bg-primary hover:text-white dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View packing list</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline" size="icon"
                          disabled={!isOwnOrder}
                          onClick={() => isOwnOrder ? generateClientOrderInvoice(order) : authToast()}
                          className={cn("h-8 w-8 rounded-xs border-none bg-accent text-accent-foreground hover:bg-primary hover:text-white dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate invoice</TooltipContent>
                    </Tooltip>
                  </>
                )}

                <Select
                  value={order.status}
                  onValueChange={(v) => isOwnOrder ? handleStatusChange(v as ClientOrderStatus) : authToast()}
                  disabled={updatingStatus || checkingDelivery || !isOwnOrder}
                >
                  <SelectTrigger className={cn("h-8 w-[110px] sm:h-8.5 sm:w-[140px] text-xs sm:text-sm rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20">
                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="rounded-xs cursor-pointer focus:bg-primary/10 focus:text-primary">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {order.status !== "shipped" && (
                  <>
                    {canPushToPPS && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => isOwnOrder ? handlePushToPPS() : authToast()}
                            disabled={pushing || !isOwnOrder}
                            className={cn("h-8 text-xs sm:h-8.5 sm:text-sm rounded-xs border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}
                          >
                            {pushing ? "Pushing..." : "Push to PPS"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Push order to production</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={order.shipASAP ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => isOwnOrder ? handleToggleShipASAP() : authToast()}
                          disabled={toggling || !isOwnOrder}
                          className={cn(
                            "h-8 text-xs sm:h-8.5 sm:text-sm rounded-xs transition-all duration-200",
                            !order.shipASAP && "border border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 hover:text-primary",
                            !isOwnOrder && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          {order.shipASAP ? "ASAP On" : "Ship ASAP"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {order.shipASAP ? "Disable ship ASAP" : "Mark for immediate shipping"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline" size="icon"
                          onClick={() => isOwnOrder ? setShowEditModal(true) : authToast()}
                          disabled={!canEdit || !isOwnOrder}
                          className={cn("h-8 w-8 rounded-xs border-none bg-secondary text-secondary-foreground hover:bg-primary hover:text-white dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-primary dark:hover:text-white transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!isOwnOrder ? "Cannot edit another rep's order" : canEdit ? "Edit order" : "Cannot edit order in production"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline" size="icon"
                          onClick={() => isOwnOrder ? setShowDeleteDialog(true) : authToast()}
                          disabled={inProduction || !isOwnOrder}
                          className={cn("h-8 w-8 rounded-xs text-white border-none bg-accent hover:bg-destructive hover:text-white dark:bg-accent dark:text-white dark:hover:bg-destructive dark:hover:text-white transition-all duration-200", !isOwnOrder && "opacity-50 cursor-not-allowed")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!isOwnOrder ? "Cannot delete another rep's order" : inProduction ? "Cannot delete order in production" : "Delete order"}
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>

              {/* Rep info — large screens */}
              <div className="hidden lg:flex flex-col gap-1 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Rep: <span className="font-medium text-foreground">{order.assignedRep?.name || "Unassigned"}</span>
                </span>
                <span>
                  <span className="font-semibold text-primary">Created by:</span>{" "}
                  <span className="font-medium text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
                </span>
              </div>
            </div>
          </TooltipProvider>
        </div>

        <OrderCardSummary order={order} />
      </Card>

      <OrderCardDialogs
        order={order}
        showDeleteDialog={showDeleteDialog} setShowDeleteDialog={setShowDeleteDialog}
        showNoDeliveryWarning={showNoDeliveryWarning} setShowNoDeliveryWarning={setShowNoDeliveryWarning}
        showShippedDialog={showShippedDialog} setShowShippedDialog={setShowShippedDialog}
        deleting={deleting}
        updatingStatus={updatingStatus}
        handleDelete={handleDelete}
        handleConfirmShipped={handleConfirmShipped}
      />

      <EditOrderModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        order={order}
        onSuccess={onUpdate}
      />

      <OrderDetailsModal
        order={showDetailsModal ? order : null}
        onClose={() => setShowDetailsModal(false)}
      />

      <ClientOrderPackingListDialog
        order={showPackingListDialog ? order : null}
        onClose={() => setShowPackingListDialog(false)}
      />

      <DeliveryModal
        open={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        store={
          order.client?.store
            ? { _id: order.client.store._id, name: order.client.store.name, address: order.client.store.address }
            : null
        }
        clientOrderId={order._id}
        orderAmount={order.total}
        onSuccess={onUpdate}
      />
    </>
  );
};
