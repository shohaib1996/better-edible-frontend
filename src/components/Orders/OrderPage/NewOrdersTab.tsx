"use client";

import React from "react";
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

interface NewOrdersTabProps {
  orders: any[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void; // ✅ ADDED THIS
}

export const NewOrdersTab: React.FC<NewOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit, // ✅ RECEIVE HERE
}) => {
  const newOrdersValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (!orders.length) {
    return <p className="text-gray-500 mt-4">No new orders found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-right font-semibold text-emerald-600 pr-2">
        Total Orders Value: ${newOrdersValue.toFixed(2)}
      </div>

      {orders.map((order) => (
        <Card
          key={order._id}
          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white py-0"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white">
            <div>
              <h2 className="text-lg font-bold text-blue-700 uppercase tracking-wide">
                {order.store?.name || "N/A"}
              </h2>
              <p className="text-sm text-gray-600">
                {order.store?.address || "No address available"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
              <Button variant="outline" size="sm" className="text-sm">
                Generate Invoice
              </Button>

              {/* ✅ EDIT BUTTON NOW WORKS */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(order)} // call the passed prop
              >
                Edit
              </Button>

              <Button variant="outline" size="sm" className="text-sm">
                Packing List
              </Button>

              <Select
                value={order.status}
                onValueChange={(value) => handleChangeStatus(order._id, value)}
              >
                <SelectTrigger className="w-[130px] h-9 bg-blue-700 text-white font-semibold border-none">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "submitted",
                    "accepted",
                    "manifested",
                    "shipped",
                    "cancelled",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-100 p-4 text-sm gap-y-2">
            <div className="flex justify-between">
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
                        className="flex items-center gap-2 bg-white text-gray-700 font-normal"
                      >
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
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
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Rep:</span>
                  <span>{order.rep?.name}</span>
                </p>
              </div>
            </div>

            {order.note && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Note:</span> {order.note}
                </p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
