"use client";

import React, { useState } from "react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { IOrder, IRep } from "@/src/types";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { generateInvoice } from "@/src/utils/invoiceGenerator";
import { PackingListDialog } from "./PackingListDialog";
import { DeliveryModal } from "@/src/components/Delivery/DeliveryModal";

(pdfMake as any).vfs = (pdfFonts as any).vfs;

interface NewOrdersTabProps {
  orders: IOrder[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
  currentRep?: Partial<IRep> | null
}

export const NewOrdersTab: React.FC<NewOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit,
  currentRep,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [packingOrder, setPackingOrder] = useState<IOrder | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<IOrder | null>(null);

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

        {orders.map((order) => (
          <Card
            key={order._id}
            className={cn(
              "border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition p-3",
              getStatusStyle(order.status)
            )}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 bg-white gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDialog(order)}
                    className="text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer hover:underline"
                  >
                    {order.store?.name || "N/A"}
                  </button>
                  <span>{getStatusBadge(order.status)}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {order.store?.address || "No address available"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
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
                            format(new Date(order.deliveryDate), "MM/dd/yyyy")
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

              {order.note && (
                <div className="mt-2">
                  <p className="text-gray-700">
                    <span className="font-semibold">Note:</span> {order.note}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <OrderDetailsDialog order={selectedOrder} onClose={handleCloseDialog} />
      <PackingListDialog order={packingOrder} onClose={() => setPackingOrder(null)} />
      <DeliveryModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        store={selectedOrderForDelivery?.store || null}
        rep={currentRep}
      />
    </>
  );
};
