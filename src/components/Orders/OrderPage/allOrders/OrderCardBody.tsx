"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { IOrder } from "@/types";

interface OrderCardBodyProps {
  order: IOrder;
  isOwnOrder: boolean;
  updateOrder: any;
  updateSample: any;
  refetch: () => void;
}

function DeliveryDatePicker({
  order,
  isOwnOrder,
  onSelect,
  variant,
}: {
  order: IOrder;
  isOwnOrder: boolean;
  onSelect: (date: Date) => void;
  variant: "sample" | "order";
}) {
  const isSample = variant === "sample";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            isSample
              ? "flex items-center gap-1.5 bg-card text-foreground font-normal dark:hover:text-purple-600 h-6 text-xs border-purple-300 dark:border-purple-700 px-2 rounded-xs"
              : "flex items-center gap-1.5 bg-card text-foreground font-normal dark:hover:text-secondary h-6 text-xs rounded-xs"
          }
          disabled={!isOwnOrder}
        >
          <CalendarIcon
            className={`h-3 w-3 ${isSample ? "text-purple-500 dark:text-purple-400" : "text-muted-foreground"}`}
          />
          {order.deliveryDate
            ? format(new Date(order.deliveryDate), "MM/dd/yyyy")
            : "Pick date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={order.deliveryDate ? new Date(order.deliveryDate) : undefined}
          onSelect={(date) => { if (date && isOwnOrder) onSelect(date); }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function SampleCardBody({ order, isOwnOrder, updateSample, refetch }: Omit<OrderCardBodyProps, "updateOrder">) {
  const handleDateSelect = (date: Date) => {
    updateSample({ id: order._id, deliveryDate: format(date, "yyyy-MM-dd") })
      .unwrap()
      .then(() => { toast.success("Delivery date updated"); refetch(); })
      .catch(() => toast.error("Error updating delivery date"));
  };

  return (
    <div className="flex justify-between flex-wrap gap-3">
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5">
          <span className="text-purple-700 dark:text-purple-400 font-semibold">Type:</span>
          <span className="text-foreground font-medium">Sample Request</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-purple-700 dark:text-purple-400 font-semibold">Request Date:</span>
          <span className="text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="text-purple-700 dark:text-purple-400 font-semibold">Delivery Date:</span>
          <DeliveryDatePicker order={order} isOwnOrder={isOwnOrder} onSelect={handleDateSelect} variant="sample" />
        </p>
      </div>
      <div className="space-y-0.5 text-right">
        {(order as any).description && (
          <p className="text-foreground">
            <span className="font-semibold text-purple-700 dark:text-purple-400">Description:</span>{" "}
            {(order as any).description}
          </p>
        )}
        <p>
          <span className="font-semibold text-purple-700 dark:text-purple-400">Rep:</span>{" "}
          <span className="text-primary font-medium">{order.rep?.name || "N/A"}</span>
        </p>
        <p>
          <span className="font-semibold text-purple-700 dark:text-purple-400">Created by:</span>{" "}
          <span className="text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
        </p>
      </div>
    </div>
  );
}

export function RegularOrderCardBody({ order, isOwnOrder, updateOrder, refetch }: Omit<OrderCardBodyProps, "updateSample">) {
  const handleDateSelect = (date: Date) => {
    updateOrder({ id: order._id, deliveryDate: format(date, "yyyy-MM-dd") })
      .unwrap()
      .then(() => { toast.success("Delivery date updated"); refetch(); })
      .catch(() => toast.error("Error updating delivery date"));
  };

  return (
    <div className="flex justify-between flex-wrap gap-2">
      <div className="space-y-0.5">
        <p>
          <span className="font-semibold text-primary">Order#:</span>{" "}
          <span className="text-foreground">{order.orderNumber}</span>
        </p>
        <p>
          <span className="font-semibold text-primary">Order Date:</span>{" "}
          <span className="text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="font-semibold text-primary">Delivery Date:</span>
          <DeliveryDatePicker order={order} isOwnOrder={isOwnOrder} onSelect={handleDateSelect} variant="order" />
        </p>
        <p>
          <span className="font-semibold text-primary">Rep:</span>{" "}
          <span className="text-primary font-medium">{order.rep?.name || "N/A"}</span>
        </p>
      </div>
      <div className="space-y-0.5 text-right">
        <p>
          <span className="font-semibold text-primary">Total Items:</span>{" "}
          <span className="text-foreground">{order.items?.length || 0}</span>
        </p>
        <p>
          <span className="font-semibold text-primary">Amount:</span>{" "}
          <span className="font-bold text-primary">
            ${order.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
        <p>
          <span className="font-semibold text-primary">Created by:</span>{" "}
          <span className="text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
        </p>
      </div>
    </div>
  );
}
