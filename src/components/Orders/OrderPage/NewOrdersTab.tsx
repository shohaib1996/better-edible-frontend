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
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IOrder, IRep } from "@/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { generateInvoice } from "@/utils/invoiceGenerator";
import { PackingListDialog } from "./PackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal"; // Fixed import path - removed space from filename
import { useUpdateSampleMutation } from "@/redux/api/Samples/samplesApi";
(pdfMake as any).vfs = (pdfFonts as any).vfs;

interface NewOrdersTabProps {
  orders: IOrder[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
  currentRep?: Partial<IRep> | null;
  isRepView?: boolean;
}

export const NewOrdersTab: React.FC<NewOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit,
  currentRep,
  isRepView = false,
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

  const newOrdersValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (!orders.length) {
    return <p className="text-gray-500 mt-4">No new orders found.</p>;
  }

  const getStatusStyle = (status: string, isSample: boolean) => {
    if (isSample) {
      return "border-l-4 border-l-purple-500 rounded-xs";
    }
    switch (status) {
      case "submitted":
        return "border-l-4 border-l-blue-600 rounded-xs";
      case "accepted":
        return "border-l-4 border-l-yellow-600 rounded-xs";
      case "manifested":
        return "border-l-4 border-l-emerald-600 rounded-xs";
      case "shipped":
        return "border-l-4 border-l-green-600 rounded-xs";
      case "cancelled":
        return "border-l-4 border-l-red-600 rounded-xs";
      default:
        return "border-l-4 border-l-border rounded-xs";
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      submitted: {
        bg: "bg-blue-100 dark:bg-blue-950",
        text: "text-blue-800 dark:text-blue-200",
      },
      accepted: {
        bg: "bg-yellow-100 dark:bg-yellow-950",
        text: "text-yellow-800 dark:text-yellow-200",
      },
      manifested: {
        bg: "bg-emerald-100 dark:bg-emerald-950",
        text: "text-emerald-800 dark:text-emerald-200",
      },
      shipped: {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-800 dark:text-green-200",
      },
      cancelled: {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-800 dark:text-red-200",
      },
    };
    const colors = colorMap[status] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
    };
    return (
      <span
        className={cn(
          "px-2 py-1 rounded-xs text-xs font-semibold capitalize",
          colors.bg,
          colors.text
        )}
      >
        {status}
      </span>
    );
  };

  const getStatusSelectBg = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-600 text-white dark:bg-blue-600 dark:text-white";
      case "accepted":
        return "bg-secondary text-secondary-foreground dark:bg-yellow-600 dark:text-white";
      case "manifested":
        return "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white";
      case "shipped":
        return "bg-green-600 text-white dark:bg-green-600 dark:text-white";
      case "cancelled":
        return "bg-destructive text-white dark:bg-red-600 dark:text-white";
      default:
        return "bg-foreground text-background dark:bg-foreground dark:text-white";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="text-right font-semibold text-emerald-600 pr-2">
          Total New Orders Value: $
          {newOrdersValue.toLocaleString("en-US", {
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
                "border rounded-xs py-3 gap-0 overflow-hidden shadow-sm hover:shadow-md transition",
                !isOwnOrder && "opacity-75",
                isSample
                  ? "bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800"
                  : "",
                getStatusStyle(order.status, isSample)
              )}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-3 py-1 bg-card gap-2 rounded-xs">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isSample ? (
                      <button
                        onClick={() => handleOpenDialog(order)}
                        className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative group after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      >
                        {order.store?.name || "N/A"}
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-primary uppercase tracking-wide">
                        {order.store?.name || "N/A"}
                      </span>
                    )}
                    <span>{getStatusBadge(order.status)}</span>
                    {isSample && (
                      <span className="px-3 py-1 rounded-xs text-xs font-bold bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-md">
                        SAMPLE REQUEST
                      </span>
                    )}
                    {!isOwnOrder && (
                      <span className="px-2 py-1 rounded-xs text-xs font-semibold bg-muted text-muted-foreground">
                        Other Rep's Order
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.store?.address || "No address available"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1 md:mt-0">
                  {isSample ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-xs border-none",
                            "bg-accent text-accent-foreground hover:bg-primary hover:text-white",
                            "dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white",
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
                      <TooltipContent>Schedule delivery</TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs border-none",
                              "bg-accent text-accent-foreground hover:bg-primary hover:text-white",
                              "dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white",
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
                        <TooltipContent>Schedule delivery</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs border-none",
                              "bg-accent text-accent-foreground hover:bg-primary hover:text-white",
                              "dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white",
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
                        <TooltipContent>Generate invoice</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => {
                              if (isOwnOrder) {
                                onEdit(order);
                              } else {
                                handleUnauthorizedAction();
                              }
                            }}
                            className={cn(
                              "h-8 w-8 rounded-xs border-none",
                              "bg-secondary text-secondary-foreground hover:bg-primary hover:text-white",
                              "dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-primary dark:hover:text-white",
                              !isOwnOrder && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={!isOwnOrder}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit order</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xs border-none",
                              "bg-accent text-accent-foreground hover:bg-primary hover:text-white",
                              "dark:bg-accent dark:text-accent-foreground dark:hover:bg-primary dark:hover:text-white",
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
                        <TooltipContent>View packing list</TooltipContent>
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
                        "w-24 h-8! text-xs font-semibold border-none focus:ring-0 rounded-xs capitalize px-2 gap-1 [&>svg]:ml-0",
                        isOwnOrder
                          ? getStatusSelectBg(order.status)
                          : "bg-muted cursor-not-allowed text-muted-foreground"
                      )}
                    >
                      <SelectValue placeholder="Change status" />
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

              {/* Order Details */}
              <div className="bg-muted text-xs leading-relaxed rounded-xs mx-1 mb-1">
                {isSample ? (
                  // Sample-specific details
                  <div className="bg-card/80 rounded-xs px-3 py-1.5 border border-purple-200 dark:border-purple-700">
                    <div className="flex justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5">
                          <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">
                            Type:
                          </span>
                          <span className="text-purple-900 dark:text-purple-200 font-semibold text-xs">
                            Sample Request
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">
                            Request Date:
                          </span>
                          <span className="text-foreground text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">
                            Delivery Date:
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1.5 dark:hover:text-purple-400 bg-card text-foreground font-normal h-6 text-xs border-purple-300 dark:border-purple-600 px-2 rounded-xs"
                                disabled={!isOwnOrder}
                              >
                                <CalendarIcon className="h-3 w-3 text-purple-500 " />
                                {order.deliveryDate ? (
                                  format(
                                    new Date(order.deliveryDate),
                                    "MM/dd/yyyy"
                                  )
                                ) : (
                                  <span>Pick date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 rounded-xs"
                              align="start"
                            >
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
                                      toast.error(
                                        "Error updating delivery date"
                                      )
                                    );
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        {(order as any).description && (
                          <p className="text-xs text-foreground">
                            <span className="font-bold text-purple-700 dark:text-purple-400">
                              Description:
                            </span>{" "}
                            {(order as any).description}
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            Rep:
                          </span>
                          <span className="text-foreground">
                            {order.rep?.name || "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular order details
                  <div className="flex justify-between flex-wrap gap-2 px-3 py-1.5">
                    <div className="space-y-0.5">
                      <p className="text-foreground">
                        <span className="font-semibold text-primary">
                          Order#:
                        </span>{" "}
                        {order.orderNumber}
                      </p>
                      <p className="text-foreground">
                        <span className="font-semibold text-primary">
                          Order Date:
                        </span>{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
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
                              className="flex items-center gap-2 dark:hover:text-secondary bg-card text-foreground font-normal h-6 text-xs rounded-xs"
                              disabled={!isOwnOrder}
                            >
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              {order.deliveryDate ? (
                                format(
                                  new Date(order.deliveryDate),
                                  "MM/dd/yyyy"
                                )
                              ) : (
                                <span>Pick date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 rounded-xs"
                            align="start"
                          >
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
                            />
                          </PopoverContent>
                        </Popover>
                      </p>
                      <p className="text-foreground">
                        <span className="font-semibold text-primary">Rep:</span>{" "}
                        {order.rep?.name || "N/A"}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Amount: ${order.total?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-primary font-medium">
                        Rep: {order.rep?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
                {order.note && (
                  <div className="px-3 py-1 border-t border-border/50">
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

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsDialog order={selectedOrder} onClose={handleCloseDialog} />
      )}

      {packingOrder && (
        <PackingListDialog
          order={packingOrder}
          onClose={() => setPackingOrder(null)}
        />
      )}

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
          onClose={() => {
            setDeliveryModalOpen(false);
            setSelectedOrderForDelivery(null);
          }}
          onSuccess={() => {
            refetch();
            setDeliveryModalOpen(false);
            setSelectedOrderForDelivery(null);
          }}
        />
      )}
    </TooltipProvider>
  );
};
