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
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-50 border-l-4 border-blue-500";
      case "accepted":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case "manifested":
        return "bg-emerald-50 border-l-4 border-emerald-500";
      case "shipped":
        return "bg-green-50 border-l-4 border-green-600";
      case "cancelled":
        return "bg-red-50 border-l-4 border-red-600";
      default:
        return "bg-white border-l-4 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      accepted: "bg-yellow-100 text-yellow-800",
      manifested: "bg-emerald-100 text-emerald-800",
      shipped: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
          colorMap[status] || "bg-gray-100 text-gray-800"
        )}
      >
        {status}
      </span>
    );
  };

  const getStatusDropdownColor = (status: string, canEdit: boolean) => {
    if (!canEdit) {
      return "bg-gray-400 cursor-not-allowed text-white";
    }
    switch (status) {
      case "submitted":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "accepted":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "manifested":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      default:
        return "bg-gray-700 hover:bg-gray-800 text-white";
    }
  };

  return (
    <Card
      className={cn(
        "border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition p-3",
        !canEditStatus && "opacity-75",
        // Orange left border for private label orders
        "border-l-4 border-l-orange-500"
      )}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 bg-white gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetails(order)}
              className="text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all after:duration-300 hover:after:w-full"
            >
              {order.store?.name || "N/A"}
            </button>
            <span>{getStatusBadge(order.status)}</span>
            {/* Private Label Badge with orange gradient */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-orange-500 to-yellow-500 text-white shadow-md">
              🏷️ PRIVATE LABEL
            </span>
            {!canEditStatus && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                Read Only
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            {order.store?.address || "No address available"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          {/* Action Buttons - Only show for non-shipped/non-cancelled orders */}
          {onDelivery && order.status !== "shipped" && order.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-orange-300 hover:bg-orange-50"
              onClick={() => onDelivery(order)}
            >
              <Truck className="w-3 h-3 mr-1" />
              Delivery
            </Button>
          )}

          {onGenerateInvoice && order.status !== "shipped" && order.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-orange-300 hover:bg-orange-50"
              onClick={() => onGenerateInvoice(order)}
            >
              <FileText className="w-3 h-3 mr-1" />
              Invoice
            </Button>
          )}

          {onPackingList && order.status !== "shipped" && order.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-orange-300 hover:bg-orange-50"
              onClick={() => onPackingList(order)}
            >
              <ClipboardList className="w-3 h-3 mr-1" />
              Packing List
            </Button>
          )}

          {order.status !== "shipped" && order.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onEdit(order)}
            >
              Edit
            </Button>
          )}

          <Select
            value={order.status}
            onValueChange={(value) => onStatusChange(order._id, value)}
            disabled={!canEditStatus}
          >
            <SelectTrigger
              className={cn(
                "w-[120px] h-8 text-xs font-semibold border-none focus:ring-0",
                getStatusDropdownColor(order.status, canEditStatus)
              )}
            >
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent className="text-sm">
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
                    "capitalize font-medium",
                    s === "submitted"
                      ? "text-blue-700"
                      : s === "accepted"
                      ? "text-yellow-700"
                      : s === "manifested"
                      ? "text-emerald-700"
                      : "text-gray-700"
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-gray-50 text-xs leading-relaxed rounded-md p-3">
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
                      className="flex items-center gap-1.5 bg-white text-gray-700 font-normal h-6 text-xs border-orange-300 px-2"
                      disabled={!canEditStatus}
                    >
                      <CalendarIcon className="h-3 w-3 text-orange-500" />
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
              <span className="font-bold text-orange-700">
                ${order.total.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {order.note && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-gray-700">
              <span className="font-semibold">Note:</span> {order.note}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
