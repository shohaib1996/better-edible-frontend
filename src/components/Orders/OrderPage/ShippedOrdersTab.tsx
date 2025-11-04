"use client";

import React from "react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Calendar, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ShippedOrdersTabProps {
  orders: any[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void; // ✅ ADDED
}

export const ShippedOrdersTab: React.FC<ShippedOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit, // ✅ receive
}) => {
  if (!orders.length)
    return <p className="text-gray-500 mt-4">No shipped orders found.</p>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card
          key={order._id}
          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white py-0"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4">
            <div>
              <h2 className="text-lg font-bold text-blue-700 uppercase tracking-wide">
                {order.store?.name || "N/A"}
              </h2>
              <p className="text-sm text-gray-600">{order.store?.address}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ Allow editing */}
              <Button variant="secondary" size="sm" onClick={() => onEdit(order)}>
                Edit
              </Button>

              <Select
                value={order.status}
                onValueChange={(value) =>
                  handleChangeStatus(order._id, value)
                }
              >
                <SelectTrigger className="w-[130px] h-9 bg-green-700 text-white font-semibold border-none">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {["shipped", "cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gray-100 p-4 text-sm">
            <p>
              <span className="font-semibold">Order#:</span> {order.orderNumber}
            </p>
            <p>
              <span className="font-semibold">Order Date:</span>{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              ${order.total.toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Rep:</span>{" "}
              {order.rep?.name || "N/A"}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
