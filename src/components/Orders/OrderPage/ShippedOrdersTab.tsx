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
import { cn } from "@/src/lib/utils";

interface ShippedOrdersTabProps {
  orders: any[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  refetch: () => void;
  onEdit: (order: any) => void;
}

export const ShippedOrdersTab: React.FC<ShippedOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  updateOrder,
  refetch,
  onEdit,
}) => {
  if (!orders.length)
    return <p className="text-gray-500 mt-4">No shipped orders found.</p>;

  // ✅ Show ONLY shipped value (exclude cancelled and all others)
  const shippedTotal = orders.reduce(
    (sum, o) => (o?.status === "shipped" ? sum + (Number(o?.total) || 0) : sum),
    0
  );

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
  const getDropdownStyle = (status: string) => {
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
      {/* ✅ Shipped-only total */}
      <div className="text-right font-semibold text-green-700 pr-1">
        Shipped Orders Value: ${shippedTotal.toFixed(2)}
      </div>

      {orders.map((order) => (
        <Card
          key={order._id}
          className={cn(
            "border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition p-3",
            getStatusStyle(order.status)
          )}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            {/* Store Info */}
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                {order.store?.name || "N/A"}
              </h2>
              <p className="text-xs text-gray-600">{order.store?.address}</p>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onEdit(order)}
              >
                Edit
              </Button>

              <Select
                value={order.status}
                onValueChange={(value) => handleChangeStatus(order._id, value)}
              >
                <SelectTrigger
                  className={cn(
                    "w-[120px] h-8 text-xs font-semibold border-none focus:ring-0",
                    getDropdownStyle(order.status)
                  )}
                >
                  <SelectValue placeholder="Change" />
                </SelectTrigger>
                <SelectContent className="text-sm">
                  {["shipped", "cancelled", "manifested", "accepted", "submitted"].map(
                    (s) => (
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
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 p-3 rounded-md mt-2 text-xs leading-relaxed">
            <p>
              <span className="font-semibold">Order#:</span> {order.orderNumber}
            </p>
            <p>
              <span className="font-semibold">Shipped Date:</span>{" "}
              {new Date(order.deliveryDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Amount:</span> $
              {(Number(order.total) || 0).toFixed(2)}
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
