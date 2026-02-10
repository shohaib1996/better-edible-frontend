"use client";

import type React from "react";
import { useState } from "react";
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
import {
  CalendarIcon,
  Truck,
  FileText,
  Pencil,
  ClipboardList,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import type { IOrder, IRep } from "@/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { generateInvoice } from "@/utils/invoiceGenerator";
import { PackingListDialog } from "./PackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { useUpdateSampleMutation } from "@/redux/api/Samples/samplesApi";
(pdfMake as any).vfs = (pdfFonts as any).vfs;

interface AllOrdersTabProps {
  orders: IOrder[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
  currentRep?: Partial<IRep> | null;
}

const getStatusSelectBg = (status: string) => {
  switch (status) {
    case "submitted":
      return "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white";
    case "accepted":
      return "bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-500 dark:text-white";
    case "manifested":
      return "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white";
    case "shipped":
      return "bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:text-white";
    case "cancelled":
      return "bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:text-white";
    default:
      return "bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-700 dark:text-white";
  }
};

export const AllOrdersTab: React.FC<AllOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit,
  currentRep,
}) => {
  const [updateSample] = useUpdateSampleMutation();
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [packingOrder, setPackingOrder] = useState<IOrder | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] =
    useState<IOrder | null>(null);

  const handleOpenDialog = (order: IOrder) => {
    setSelectedOrder(order);
  };

  const handleCloseDialog = () => {
    setSelectedOrder(null);
  };

  const handleUnauthorizedAction = () => {
    toast.error("You are not authorized to change it. This is not your order.");
  };

  const allOrdersValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (!orders.length) {
    return <p className="text-muted-foreground mt-4">No orders found.</p>;
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "border-l-4 border-l-blue-600";
      case "accepted":
        return "border-l-4 border-l-yellow-500";
      case "manifested":
        return "border-l-4 border-l-emerald-600";
      case "shipped":
        return "border-l-4 border-l-green-600";
      case "cancelled":
        return "border-l-4 border-l-red-600";
      default:
        return "border-l-4 border-l-border";
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      submitted: { bg: "bg-blue-600", text: "text-white" },
      accepted: { bg: "bg-yellow-500", text: "text-white" },
      manifested: { bg: "bg-emerald-600", text: "text-white" },
      shipped: { bg: "bg-green-600", text: "text-white" },
      cancelled: { bg: "bg-red-600", text: "text-white" },
    };
    const colors = colorMap[status] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
    };
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-xs text-xs font-semibold capitalize",
          colors.bg,
          colors.text
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="text-right font-semibold text-primary pr-2">
          Total Orders Value: $
          {allOrdersValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
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
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-3 py-1.5 gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {!isSample ? (
                      <button
                        onClick={() => handleOpenDialog(order)}
                        className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      >
                        {order.store?.name || "N/A"}
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                        {order.store?.name || "N/A"}
                      </span>
                    )}
                    {getStatusBadge(order.status)}
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

                <div className="flex flex-wrap items-center gap-1.5 mt-2 md:mt-0">
                  {isSample ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-xs bg-accent text-white border border-purple-400 dark:border-purple-600 hover:bg-primary hover:text-white transition-colors dark:bg-accent dark:text-white",
                            !isOwnOrder && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (isOwnOrder) {
                              setSelectedOrderForDelivery(order);
                              setDeliveryModalOpen(true);
                            } else {
                              handleUnauthorizedAction();
                            }
                          }}
                          disabled={!isOwnOrder}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delivery</TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs bg-accent text-white border border-border dark:border-gray-600 hover:bg-primary hover:text-white transition-colors dark:bg-accent dark:text-white",
                              !isOwnOrder && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (isOwnOrder) {
                                setSelectedOrderForDelivery(order);
                                setDeliveryModalOpen(true);
                              } else {
                                handleUnauthorizedAction();
                              }
                            }}
                            disabled={!isOwnOrder}
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delivery</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs bg-accent text-white border border-border dark:border-gray-600 hover:bg-primary hover:text-white transition-colors dark:bg-accent dark:text-white",
                              !isOwnOrder && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (isOwnOrder) {
                                generateInvoice(order);
                              } else {
                                handleUnauthorizedAction();
                              }
                            }}
                            disabled={!isOwnOrder}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Generate Invoice</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs bg-secondary text-white border border-secondary hover:bg-primary hover:text-white transition-colors dark:bg-secondary dark:text-white",
                              !isOwnOrder && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (isOwnOrder) {
                                onEdit(order);
                              } else {
                                handleUnauthorizedAction();
                              }
                            }}
                            disabled={!isOwnOrder}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs bg-accent text-white border border-border dark:border-gray-600 hover:bg-primary hover:text-white transition-colors dark:bg-accent dark:text-white",
                              !isOwnOrder && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (isOwnOrder) {
                                setPackingOrder(order);
                              } else {
                                handleUnauthorizedAction();
                              }
                            }}
                            disabled={!isOwnOrder}
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Packing List</TooltipContent>
                      </Tooltip>
                    </>
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
                        "h-8! w-24 text-xs font-semibold rounded-xs border-none focus:ring-0 gap-1 [&>svg]:ml-0",
                        isOwnOrder
                          ? getStatusSelectBg(order.status)
                          : "bg-gray-400 cursor-not-allowed text-white"
                      )}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="text-sm rounded-xs">
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
                          className="capitalize font-medium rounded-xs"
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-secondary/30 dark:bg-secondary/10 text-xs leading-relaxed rounded-xs mx-3 px-3 py-2">
                {isSample ? (
                  <div className="flex justify-between flex-wrap gap-3">
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1.5">
                        <span className="text-purple-700 dark:text-purple-400 font-semibold">
                          Type:
                        </span>
                        <span className="text-foreground font-medium">
                          Sample Request
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-purple-700 dark:text-purple-400 font-semibold">
                          Request Date:
                        </span>
                        <span className="text-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-purple-700 dark:text-purple-400 font-semibold">
                          Delivery Date:
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5 bg-card text-foreground font-normal dark:hover:text-purple-600 h-6 text-xs border-purple-300 dark:border-purple-700 px-2 rounded-xs"
                              disabled={!isOwnOrder}
                            >
                              <CalendarIcon className="h-3 w-3 text-purple-500 dark:text-purple-400 " />
                              {order.deliveryDate
                                ? format(
                                    new Date(order.deliveryDate),
                                    "MM/dd/yyyy"
                                  )
                                : "Pick date"}
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
                                if (!date || !isOwnOrder) return;
                                updateSample({
                                  id: order._id,
                                  deliveryDate: format(date, "yyyy-MM-dd"),
                                })
                                  .unwrap()
                                  .then(() => {
                                    toast.success("Delivery date updated");
                                    refetch();
                                  })
                                  .catch(() =>
                                    toast.error("Error updating delivery date")
                                  );
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      {(order as any).description && (
                        <p className="text-foreground">
                          <span className="font-semibold text-purple-700 dark:text-purple-400">
                            Description:
                          </span>{" "}
                          {(order as any).description}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold text-purple-700 dark:text-purple-400">
                          Rep:
                        </span>{" "}
                        <span className="text-primary font-medium">
                          {order.rep?.name || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between flex-wrap gap-2">
                    <div className="space-y-0.5">
                      <p>
                        <span className="font-semibold text-primary">
                          Order#:
                        </span>{" "}
                        <span className="text-foreground">
                          {order.orderNumber}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-primary">
                          Order Date:
                        </span>{" "}
                        <span className="text-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          Delivery Date:
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5 bg-card text-foreground font-normal dark:hover:text-secondary h-6 text-xs rounded-xs"
                              disabled={!isOwnOrder}
                            >
                              <CalendarIcon className="h-3 w-3 text-muted-foreground " />
                              {order.deliveryDate
                                ? format(
                                    new Date(order.deliveryDate),
                                    "MM/dd/yyyy"
                                  )
                                : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                order.deliveryDate
                                  ? new Date(order.deliveryDate)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (!date || !isOwnOrder) return;
                                updateOrder({
                                  id: order._id,
                                  deliveryDate: format(date, "yyyy-MM-dd"),
                                })
                                  .unwrap()
                                  .then(() => {
                                    toast.success("Delivery date updated");
                                    refetch();
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
                      <p>
                        <span className="font-semibold text-primary">Rep:</span>{" "}
                        <span className="text-primary font-medium">
                          {order.rep?.name || "N/A"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p>
                        <span className="font-semibold text-primary">
                          Total Items:
                        </span>{" "}
                        <span className="text-foreground">
                          {order.items?.length || 0}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-primary">
                          Amount:
                        </span>{" "}
                        <span className="font-bold text-primary">
                          $
                          {order.total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {order.note && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-foreground">
                      <span className="font-semibold text-primary">Note:</span>{" "}
                      {order.note}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <OrderDetailsDialog order={selectedOrder} onClose={handleCloseDialog} />
      <PackingListDialog
        order={packingOrder}
        onClose={() => setPackingOrder(null)}
      />
      <DeliveryModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        store={selectedOrderForDelivery?.store || null}
        rep={currentRep}
        sampleId={
          (selectedOrderForDelivery as any)?.isSample
            ? selectedOrderForDelivery?._id
            : null
        }
        orderId={
          !(selectedOrderForDelivery as any)?.isSample
            ? selectedOrderForDelivery?._id
            : null
        }
        orderAmount={selectedOrderForDelivery?.total || null}
      />
    </TooltipProvider>
  );
};
