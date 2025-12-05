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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { IOrder, IRep } from "@/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { generateInvoice } from "@/utils/invoiceGenerator";
import { PackingListDialog } from "./PackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { useUpdateSampleMutation } from "@/redux/api/Samples/samplesApi ";

(pdfMake as any).vfs = (pdfFonts as any).vfs;

interface NewOrdersTabProps {
  orders: IOrder[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
  currentRep?: Partial<IRep> | null;
}

export const NewOrdersTab: React.FC<NewOrdersTabProps> = ({
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

  const newOrdersValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (!orders.length) {
    return <p className="text-gray-500 mt-4">No new orders found.</p>;
  }

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

  const getStatusDropdownColor = (status: string) => {
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

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      accepted: "bg-yellow-100 text-yellow-800",
      manifested: "bg-emerald-100 text-emerald-800",
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

  return (
    <>
      <div className="space-y-3">
        <div className="text-right font-semibold text-emerald-600 pr-2">
          Total Orders Value: ${newOrdersValue.toFixed(2)}
        </div>

        {orders.map((order) => {
          const isSample = (order as any).isSample === true;

          return (
            <Card
              key={order._id}
              className={cn(
                "border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition p-3",
                isSample
                  ? "bg-linear-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500 border-purple-200"
                  : getStatusStyle(order.status)
              )}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 bg-white gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {!isSample ? (
                      <button
                        onClick={() => handleOpenDialog(order)}
                        className="
text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer
relative after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-blue-700
after:transition-all after:duration-300 hover:after:w-full
"
                      >
                        {order.store?.name || "N/A"}
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                        {order.store?.name || "N/A"}
                      </span>
                    )}
                    <span>{getStatusBadge(order.status)}</span>
                    {isSample && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-md">
                        📦 SAMPLE REQUEST
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {order.store?.address || "No address available"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  {isSample ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-purple-500 text-purple-700 hover:bg-purple-400 cursor-pointer"
                      onClick={() => {
                        setSelectedOrderForDelivery(order);
                        setDeliveryModalOpen(true);
                      }}
                    >
                      Delivery
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => {
                          setSelectedOrderForDelivery(order);
                          setDeliveryModalOpen(true);
                        }}
                      >
                        Delivery
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => generateInvoice(order)}
                      >
                        Generate Invoice
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(order)}
                        className="text-xs h-8"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setPackingOrder(order)}
                      >
                        Packing List
                      </Button>
                    </>
                  )}

                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      handleChangeStatus(order._id, value)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-[120px] h-8 text-xs font-semibold border-none focus:ring-0",
                        getStatusDropdownColor(order.status)
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
              <div className="bg-gray-50 p-3 text-xs leading-relaxed rounded-md">
                {isSample ? (
                  // Sample-specific details
                  <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between flex-wrap gap-4">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <span className="text-purple-700 font-bold text-sm">
                            📋 Type:
                          </span>
                          <span className="text-purple-900 font-semibold">
                            Sample Request
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-purple-700 font-bold text-sm">
                            📅 Request Date:
                          </span>
                          <span className="text-gray-700">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-purple-700 font-bold text-sm">
                            🚚 Delivery Date:
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 bg-white text-gray-700 font-normal h-7 text-xs border-purple-300"
                              >
                                <CalendarIcon className="h-3.5 w-3.5 text-purple-500" />
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
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={
                                  order.deliveryDate
                                    ? new Date(order.deliveryDate)
                                    : undefined
                                }
                                onSelect={(date) => {
                                  if (!date) return;
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
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-purple-700 font-bold text-sm">
                            👤 Rep:
                          </span>
                          <span className="text-gray-700">
                            {order.rep?.name || "N/A"}
                          </span>
                        </p>
                      </div>
                      <div className="bg-linear-to-br from-purple-100 to-pink-100 rounded-lg p-3 border border-purple-300">
                        <p className="font-bold mb-2 text-purple-800 flex items-center gap-1">
                          <span>📦</span> Samples Requested:
                        </p>
                        <div className="flex flex-col gap-2">
                          {Object.entries((order as any).samples || {}).map(
                            ([key, value]) => {
                              if (!value) return null;
                              return (
                                <div
                                  key={key}
                                  className="bg-white/70 rounded px-3 py-1.5 border border-purple-200"
                                >
                                  <span className="font-bold text-purple-700 capitalize text-xs">
                                    {key}:
                                  </span>{" "}
                                  <span className="text-gray-800 font-medium">
                                    {value as string}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular order details
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <p>
                        <span className="font-semibold">Order#:</span>{" "}
                        {order.orderNumber}
                      </p>
                      <p>
                        <span className="font-semibold">Order Date:</span>{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>

                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Delivery Date:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 bg-white text-gray-700 font-normal h-7 text-xs"
                            >
                              <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
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
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                order.deliveryDate
                                  ? new Date(order.deliveryDate)
                                  : undefined
                              }
                              onSelect={(date) => {
                                if (!date) return;
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
                    </div>

                    <div>
                      <p>
                        <span className="font-semibold">Amount:</span>{" "}
                        <span className="font-bold text-gray-800">
                          ${order.total.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Rep:</span>{" "}
                        {order.rep?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {order.note && (
                  <div className="mt-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">Note:</span> {order.note}
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
      />
    </>
  );
};
