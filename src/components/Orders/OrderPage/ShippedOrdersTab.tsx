"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { CalendarIcon, Loader2, Pencil, Package } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import type { IRep } from "@/types";

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
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  const [startDate, setStartDate] = useState<Date | undefined>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const [selectedRepName, setSelectedRepName] = useState<string | undefined>();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Set default date range and trigger initial filter
  useEffect(() => {
    onFilter({
      startDate: format(sevenDaysAgo, "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    });
  }, []); // Empty dependency array - run only once on mount

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
    onPageChange?.(1);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedRepName(undefined);
    onFilter({});
    onPageChange?.(1);
  };

  const shippedTotal = orders.reduce(
    (sum, o) => (o?.status === "shipped" ? sum + (Number(o?.total) || 0) : sum),
    0
  );

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "shipped":
        return "border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
      case "cancelled":
        return "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
      default:
        return "border-l-4 border-l-gray-300 dark:border-l-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      shipped: "bg-emerald-500 text-white",
      cancelled: "bg-red-500 text-white",
    };
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-xs text-xs font-semibold capitalize",
          colorMap[status] || "bg-gray-500 text-white"
        )}
      >
        {status}
      </span>
    );
  };

  const getDropdownStyle = (status: string, isOwn: boolean) => {
    if (!isOwn) {
      return "bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white";
    }
    switch (status) {
      case "shipped":
        return "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700";
      case "cancelled":
        return "bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700";
      case "manifested":
        return "bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-600 dark:hover:bg-teal-700";
      case "accepted":
        return "bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-500 dark:hover:bg-yellow-600";
      case "submitted":
        return "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700";
      default:
        return "bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-600 dark:hover:bg-gray-700";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:flex md:justify-end items-center gap-2 my-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[200px] justify-start text-left font-normal rounded-xs dark:hover:bg-secondary dark:hover:text-white",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {startDate ? format(startDate, "PPP") : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xs">
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
                  "w-full md:w-[200px] justify-start text-left font-normal rounded-xs dark:hover:bg-secondary dark:hover:text-white",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {endDate ? format(endDate, "PPP") : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xs">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleFilter}
            className="w-full md:w-auto rounded-xs bg-primary hover:bg-primary/90"
          >
            Filter
          </Button>
          <Button
            onClick={handleClear}
            className="w-full bg-accent hover:bg-red-500/90 md:w-auto rounded-xs"
          >
            Clear
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : !orders.length ? (
          <p className="text-muted-foreground mt-4 text-center">
            No shipped orders found.
          </p>
        ) : (
          <>
            <div className="text-right font-semibold text-emerald-600 dark:text-emerald-400 pr-1">
              Shipped Orders Value: $
              {shippedTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            {orders.map((order) => {
              const isSample = (order as any).isSample === true;
              const isOwnOrder = isRepView
                ? order.rep?._id === currentRep?._id
                : true;

              return (
                <Card
                  key={order._id}
                  className={cn(
                    "rounded-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card dark:bg-card py-3 gap-0",
                    !isOwnOrder && "opacity-75",
                    isSample
                      ? "border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                      : getStatusStyle(order.status)
                  )}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 px-3 py-0 border-b border-border/50">
                    {/* Store Info */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isSample ? (
                          <button
                            onClick={() => handleOpenDialog(order)}
                            className="group text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative"
                          >
                            <span className="relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 group-hover:after:w-full">
                              {order.store?.name || "N/A"}
                            </span>
                          </button>
                        ) : (
                          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
                            {order.store?.name || "N/A"}
                          </span>
                        )}
                        {getStatusBadge(order.status)}
                        {isSample && (
                          <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-purple-600 text-white flex items-center gap-1">
                            <Package className="w-3 h-3" /> SAMPLE
                          </span>
                        )}
                        {!isOwnOrder && (
                          <span className="px-2 py-0.5 rounded-xs text-xs font-semibold bg-muted text-muted-foreground">
                            Other Rep
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.store?.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isSample && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-xs border border-border dark:border-gray-500 bg-primary text-white hover:bg-primary hover:text-white dark:hover:bg-primary"
                              onClick={() => {
                                if (isOwnOrder) {
                                  onEdit(order);
                                } else {
                                  handleUnauthorizedAction();
                                }
                              }}
                              disabled={!isOwnOrder}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Order</p>
                          </TooltipContent>
                        </Tooltip>
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
                            "w-24 h-8! text-xs font-semibold border-none focus:ring-0 rounded-xs px-2 gap-1 [&>svg]:ml-0",
                            getDropdownStyle(order.status, isOwnOrder)
                          )}
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="text-sm rounded-xs">
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
                              className="capitalize font-medium rounded-xs"
                            >
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="px-3 pt-2 text-xs bg-muted/50 dark:bg-muted/20">
                    {isSample ? (
                      <div className="flex justify-between flex-wrap gap-3">
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              Type:
                            </span>
                            <span className="text-foreground font-medium">
                              Sample Request
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              Request Date:
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </p>
                          {(order as any).deliveryDate && (
                            <p className="flex items-center gap-1.5">
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                Shipped:
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(
                                  (order as any).deliveryDate
                                ).toLocaleDateString()}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="space-y-0.5 text-right">
                          {(order as any).description && (
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                Note:
                              </span>{" "}
                              {(order as any).description}
                            </p>
                          )}
                          <p>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              Rep:
                            </span>{" "}
                            <span className="text-primary font-medium">
                              {order.rep?.name || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between flex-wrap gap-2 bg-accent/10 p-2 rounded-xs">
                        <div className="space-y-0.5">
                          <p>
                            <span className="text-primary font-semibold">
                              Order#:
                            </span>{" "}
                            <span className="text-foreground">
                              {order.orderNumber}
                            </span>
                          </p>
                          {order.deliveryDate && (
                            <p>
                              <span className="text-primary font-semibold">
                                Shipped:
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {new Date(
                                  order.deliveryDate
                                ).toLocaleDateString()}
                              </span>
                            </p>
                          )}
                          <p>
                            <span className="text-primary font-semibold">
                              Rep:
                            </span>{" "}
                            <span className="text-primary font-medium">
                              {order.rep?.name || "N/A"}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Amount: $
                            {(Number(order.total) || 0).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                      </div>
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
                  onPageChange(1);
                }}
                limitOptions={[10, 25, 50, 100]}
              />
            )}
          </>
        )}

        <OrderDetailsDialog order={selectedOrder} onClose={handleCloseDialog} />
      </div>
    </TooltipProvider>
  );
};
