"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText, Truck, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { IPrivateLabelOrder } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUpdatePrivateLabelOrderMutation } from "@/redux/api/PrivateLabel/privateLabelApi";

interface PrivateLabelOrderCardProps {
  order: IPrivateLabelOrder;
  canEditStatus: boolean;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: IPrivateLabelOrder) => void;
  onEdit: (order: IPrivateLabelOrder) => void;
  onDelivery?: (order: IPrivateLabelOrder) => void;
  onGenerateInvoice?: (order: IPrivateLabelOrder) => void;
  onPackingList?: (order: IPrivateLabelOrder) => void;
}

export const PrivateLabelOrderCard: React.FC<PrivateLabelOrderCardProps> = ({
  order,
  canEditStatus,
  onStatusChange,
  onViewDetails,
  onEdit,
  onDelivery,
  onGenerateInvoice,
  onPackingList,
}) => {
  const [updateOrder] = useUpdatePrivateLabelOrderMutation();
  const selectTriggerRef = React.useRef<HTMLButtonElement>(null);
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-50 border-l-4 border-foreground";
      case "accepted":
        return "bg-secondary/20 border-l-4 border-secondary";
      case "manifested":
        return "bg-primary/10 border-l-4 border-primary";
      case "shipped":
        return "bg-green-50 border-l-4 border-green-600";
      case "cancelled":
        return "bg-destructive/10 border-l-4 border-destructive";
      default:
        return "bg-card border-l-4 border-border";
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      submitted: "bg-blue-600 text-white",
      accepted: "bg-secondary text-secondary-foreground",
      manifested: "bg-green-600 text-primary-foreground",
      shipped: "bg-green-600 text-white",
      cancelled: "bg-destructive text-white",
    };
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-xs text-xs font-semibold capitalize",
          colorMap[status] || "bg-muted text-muted-foreground"
        )}
      >
        {status}
      </span>
    );
  };

  const getStatusDropdownColor = (status: string, canEdit: boolean) => {
    if (!canEdit) {
      return "bg-muted cursor-not-allowed text-muted-foreground border-muted";
    }
    switch (status) {
      case "submitted":
        return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
      case "accepted":
        return "bg-secondary hover:bg-secondary/90 text-white border-secondary";
      case "manifested":
        return "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600";
      case "shipped":
        return "bg-green-600 hover:bg-green-700 text-white border-green-600";
      case "cancelled":
        return "bg-destructive hover:bg-destructive/90 text-white border-destructive";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
    }
  };

  const getLeftBorderColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "border-l-blue-600";
      case "accepted":
        return "border-l-secondary";
      case "manifested":
        return "border-l-emerald-600";
      case "shipped":
        return "border-l-green-600";
      case "cancelled":
        return "border-l-destructive";
      default:
        return "border-l-primary";
    }
  };

  return (
    <Card
      className={cn(
        "border overflow-hidden shadow-sm transition p-3 rounded-xs",
        !canEditStatus && "opacity-75",
        // Dynamic left border color based on order status
        "border-l-4",
        getLeftBorderColor(order.status)
      )}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 bg-card gap-2">
        <div className="flex flex-col w-full md:w-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onViewDetails(order)}
              className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {order.store?.name || "N/A"}
            </button>
            <span>{getStatusBadge(order.status)}</span>
            {/* Private Label Badge with primary gradient */}
            {/* <span className="px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-primary to-secondary text-white shadow-md">
              🏷️ PRIVATE LABEL
            </span> */}
            {!canEditStatus && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                Read Only
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {order.store?.address || "No address available"}
          </p>
        </div>

        <div className="flex justify-between items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
          {/* Action Buttons Group */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {/* Action Buttons - Only show for non-shipped/non-cancelled orders */}
            {onDelivery &&
              order.status !== "shipped" &&
              order.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 border-primary/30 hover:bg-primary/70 dark:bg-primary/70 dark:hover:bg-primary/70 cursor-pointer rounded-xs px-2 sm:px-3"
                  onClick={() => onDelivery(order)}
                >
                  <Truck className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Delivery</span>
                </Button>
              )}

            {onGenerateInvoice &&
              order.status !== "shipped" &&
              order.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 border-primary/30 hover:bg-primary/70 dark:bg-primary/70 dark:hover:bg-primary/70 cursor-pointer rounded-xs px-2 sm:px-3"
                  onClick={() => onGenerateInvoice(order)}
                >
                  <FileText className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Invoice</span>
                </Button>
              )}

            {onPackingList &&
              order.status !== "shipped" &&
              order.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 border-primary/30 hover:bg-primary/70 dark:bg-primary/70 dark:hover:bg-primary/70 cursor-pointer rounded-xs px-2 sm:px-3"
                  onClick={() => onPackingList(order)}
                >
                  <ClipboardList className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Packing List</span>
                </Button>
              )}

            {order.status !== "shipped" && order.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] sm:text-xs h-7 sm:h-8 text-white bg-accent hover:bg-accent/70 dark:bg-accent/70 dark:hover:bg-accent/70 cursor-pointer rounded-xs px-2 sm:px-3"
                onClick={() => onEdit(order)}
              >
                Edit
              </Button>
            )}
          </div>

          {/* Status Dropdown - Separate on mobile */}
          <div className="shrink-0">
            <Select
              value={order.status}
              onValueChange={(value) => {
                onStatusChange(order._id, value);
                setTimeout(() => {
                  selectTriggerRef.current?.blur();
                }, 0);
              }}
              disabled={!canEditStatus}
            >
              <SelectTrigger
                ref={selectTriggerRef}
                className={cn(
                  "w-[85px] sm:w-[110px] h-auto! sm:h-8 text-[10px] sm:text-xs font-semibold border-2 focus:ring-0 focus:ring-offset-0 focus:outline-none rounded-xs px-1 sm:px-3 py-1.5! min-h-0",
                  getStatusDropdownColor(order.status, canEditStatus)
                )}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="text-xs md:text-sm">
                {[
                  "submitted",
                  "accepted",
                  "manifested",
                  "shipped",
                  "cancelled",
                ].map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className={cn(
                      "capitalize font-medium text-xs md:text-sm",
                      s === "submitted"
                        ? "text-foreground dark:text-foreground"
                        : s === "accepted"
                        ? "text-secondary-foreground dark:text-secondary"
                        : s === "manifested"
                        ? "text-primary dark:text-primary"
                        : s === "shipped"
                        ? "text-green-700 dark:text-green-400"
                        : "text-destructive dark:text-destructive"
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-muted text-xs leading-relaxed rounded-xs p-3">
        <div className="flex justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Order Date:</span>{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            {order.status === "shipped" ? (
              <p>
                <span className="font-semibold">Shipped Date:</span>{" "}
                {order.deliveryDate
                  ? format(new Date(order.deliveryDate), "MM/dd/yyyy")
                  : format(new Date(), "MM/dd/yyyy")}
              </p>
            ) : order.status === "cancelled" ? (
              <p>
                <span className="font-semibold">Cancelled At:</span>{" "}
                {order.deliveryDate
                  ? format(new Date(order.deliveryDate), "MM/dd/yyyy")
                  : format(new Date(), "MM/dd/yyyy")}
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <span className="font-semibold">Delivery Date:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 bg-card text-card-foreground font-normal h-6 text-xs border-primary/30 px-2 dark:hover:text-white dark:hover:bg-primary/50 transition-colors cursor-pointer rounded-xs"
                      disabled={!canEditStatus}
                    >
                      <CalendarIcon className="h-3 w-3 text-primary dark:text-white" />
                      {order.deliveryDate ? (
                        format(new Date(order.deliveryDate), "MM/dd/yyyy")
                      ) : (
                        <span>Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        order.deliveryDate
                          ? new Date(order.deliveryDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (!date || !canEditStatus) return;
                        updateOrder({
                          id: order._id,
                          deliveryDate: format(date, "yyyy-MM-dd"),
                        })
                          .unwrap()
                          .then(() => {
                            toast.success("Delivery date updated");
                          })
                          .catch(() =>
                            toast.error("Error updating delivery date")
                          );
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </p>
            )}
            <p>
              <span className="font-semibold">Rep:</span>{" "}
              {order.rep?.name || "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p>
              <span className="font-semibold">Total Items:</span>{" "}
              {order.items?.length || 0}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              <span className="font-bold text-primary">
                ${order.total.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {order.note && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-card-foreground">
              <span className="font-semibold">Note:</span> {order.note}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
