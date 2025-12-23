"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { IRep } from "@/types";

interface ShippedOrdersTabProps {
  orders: any[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  onFilter: (args: {
    startDate?: string;
    endDate?: string;
    repName?: string;
  }) => void;
  onEdit: (order: any) => void;
  isLoading: boolean;
  reps: any[];
  totalOrders?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  currentRep?: Partial<IRep> | null;
  isRepView?: boolean;
}

export const ShippedOrdersTab: React.FC<ShippedOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  onFilter,
  onEdit,
  isLoading,
  totalOrders = 0,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onLimitChange,
  currentRep,
  isRepView = false,
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedRepName, setSelectedRepName] = useState<string | undefined>();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const handleOpenDialog = (order: any) => {
    setSelectedOrder(order);
  };

  const handleCloseDialog = () => {
    setSelectedOrder(null);
  };

  const handleUnauthorizedAction = () => {
    toast.error("You are not authorized to change it. This is not your order.");
  };

  const handleFilter = () => {
    onFilter({
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      repName: selectedRepName,
    });
    onPageChange?.(1); // Reset to first page when filtering
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedRepName(undefined);
    onFilter({});
    onPageChange?.(1); // Reset to first page when clearing
  };

  if (isLoading || !orders.length) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!orders.length)
    return <p className="text-gray-500 mt-4">No shipped orders found.</p>;

  // ✅ Show ONLY shipped value (exclude cancelled and all others)
  const shippedTotal = orders.reduce(
    (sum, o) => (o?.status === "shipped" ? sum + (Number(o?.total) || 0) : sum),
    0
  );

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const getStatusStyle = (status: string) => {
    switch (status) {
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

  // ✅ Dropdown style based on current status
  const getDropdownStyle = (status: string, isOwn: boolean) => {
    if (!isOwn) {
      return "bg-gray-400 cursor-not-allowed text-white";
    }
    switch (status) {
      case "shipped":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "cancelled":
        return "bg-red-600 hover:bg-red-700 text-white";
      default:
        return "bg-gray-700 hover:bg-gray-800 text-white";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end items-center gap-2 my-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "PPP")
              ) : (
                <span>Pick a start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <Button onClick={handleFilter}>Filter</Button>
        <Button onClick={handleClear} variant="ghost">
          Clear
        </Button>
      </div>
      {/* ✅ Shipped-only total */}
      <div className="text-right font-semibold text-green-700 pr-1">
        Shipped Orders Value: ${shippedTotal.toFixed(2)}
      </div>

      {orders.map((order) => {
        const isSample = (order as any).isSample === true;
        const isOwnOrder = isRepView ? order.rep?._id === currentRep?._id : true;

        return (
          <Card
            key={order._id}
            className={cn(
              "border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition p-3",
              !isOwnOrder && "opacity-75",
              isSample
                ? "bg-linear-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500 border-purple-200"
                : getStatusStyle(order.status)
            )}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              {/* Store Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {!isSample ? (
                    <button
                      onClick={() => handleOpenDialog(order)}
                      className="text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all after:duration-300 hover:after:w-full"
                    >
                      {order.store?.name || "N/A"}
                    </button>
                  ) : (
                    <span className="text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2 text-left">
                      {order.store?.name || "N/A"}
                    </span>
                  )}
                  {isSample && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-md">
                      📦 SAMPLE REQUEST
                    </span>
                  )}
                  {!isOwnOrder && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                      Other Rep's Order
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{order.store?.address}</p>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!isSample && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      if (isOwnOrder) {
                        onEdit(order);
                      } else {
                        handleUnauthorizedAction();
                      }
                    }}
                    disabled={!isOwnOrder}
                  >
                    Edit
                  </Button>
                )}

                <Select
                  value={order.status}
                  onValueChange={(value) => {
                    if (isOwnOrder) {
                      handleChangeStatus(order._id, value);
                    } else {
                      handleUnauthorizedAction();
                    }
                  }}
                  disabled={!isOwnOrder}
                >
                  <SelectTrigger
                    className={cn(
                      "w-[120px] h-8 text-xs font-semibold border-none focus:ring-0",
                      getDropdownStyle(order.status, isOwnOrder)
                    )}
                  >
                    <SelectValue placeholder="Change" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    {[
                      "shipped",
                      "cancelled",
                      "manifested",
                      "accepted",
                      "submitted",
                    ].map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className={cn(
                          "capitalize font-medium",
                          s === "shipped"
                            ? "text-green-700"
                            : s === "cancelled"
                            ? "text-red-700"
                            : "text-gray-700"
                        )}
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-md text-xs leading-relaxed">
              {isSample ? (
                // Sample-specific details
                <div className="bg-white/80 rounded-lg p-3 border border-purple-200">
                  <div className="flex justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5">
                        <span className="text-purple-700 font-bold text-xs">
                          📋 Type:
                        </span>
                        <span className="text-purple-900 font-semibold text-xs">
                          Sample Request
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-purple-700 font-bold text-xs">
                          📅 Request Date:
                        </span>
                        <span className="text-gray-700 text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                      {(order as any).shippedDate && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-purple-700 font-bold text-xs">
                            📦 Shipped Date:
                          </span>
                          <span className="text-gray-700 text-xs">
                            {new Date((order as any).shippedDate).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      {Object.entries((order as any).samples || {})
                        .filter(([_, value]) => value)
                        .map(([key, value]) => (
                          <p key={key} className="text-xs text-gray-700">
                            <span className="font-bold uppercase">{key}:</span>{" "}
                            {String(value)}
                          </p>
                        ))}
                      <p className="flex items-center gap-1.5 text-xs">
                        <span className="text-purple-700 font-bold">
                          👤 Rep:
                        </span>
                        <span className="text-gray-700">
                          {order.rep?.name || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular order details
                <>
                  <p>
                    <span className="font-semibold">Order#:</span>{" "}
                    {order.orderNumber}
                  </p>
                  {order.shippedDate && (
                    <p>
                      <span className="font-semibold">Shipped Date:</span>{" "}
                      {new Date(order.shippedDate).toLocaleDateString()}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Amount:</span> $
                    {(Number(order.total) || 0).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-semibold">Rep:</span>{" "}
                    {order.rep?.name || "N/A"}
                  </p>
                </>
              )}
            </div>
          </Card>
        );
      })}

      {/* Pagination */}
      {totalOrders > itemsPerPage && onPageChange && onLimitChange && (
        <GlobalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalOrders}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onLimitChange={(limit) => {
            onLimitChange(limit);
            onPageChange(1); // Reset to first page when changing limit
          }}
          limitOptions={[10, 25, 50, 100]}
        />
      )}

      <OrderDetailsDialog order={selectedOrder} onClose={handleCloseDialog} />
    </div>
  );
};
