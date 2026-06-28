"use client";

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Package } from "lucide-react";
import { cn } from "@/lib/utils";

function getStatusStyle(status: string) {
  switch (status) {
    case "shipped":
      return "border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
    case "cancelled":
      return "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
    default:
      return "border-l-4 border-l-gray-300 dark:border-l-gray-600";
  }
}

function getStatusBadge(status: string) {
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
}

function getDropdownStyle(status: string, isOwn: boolean) {
  if (!isOwn) return "bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white";
  switch (status) {
    case "shipped":    return "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700";
    case "cancelled":  return "bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700";
    case "manifested": return "bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-600 dark:hover:bg-teal-700";
    case "accepted":   return "bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-500 dark:hover:bg-yellow-600";
    case "submitted":  return "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700";
    default:           return "bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-600 dark:hover:bg-gray-700";
  }
}

interface ShippedOrderCardProps {
  order: any;
  displayNumber: number;
  isSample: boolean;
  isOwnOrder: boolean;
  onOpenDialog: (order: any) => void;
  onEdit: (order: any) => void;
  onUnauthorized: () => void;
  onChangeStatus: (id: string, status: string) => void;
}

export function ShippedOrderCard({
  order,
  displayNumber,
  isSample,
  isOwnOrder,
  onOpenDialog,
  onEdit,
  onUnauthorized,
  onChangeStatus,
}: ShippedOrderCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card dark:bg-card py-3 gap-0",
        !isOwnOrder && "opacity-75",
        isSample
          ? "border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
          : getStatusStyle(order.status)
      )}
    >
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 px-3 py-0 border-b border-border/50">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-xs font-bold rounded-xs px-1.5 py-0.5 min-w-6 text-center",
                isSample ? "bg-purple-600 text-white" : "bg-primary text-white"
              )}
            >
              {displayNumber}
            </span>

            {!isSample ? (
              <button
                onClick={() => onOpenDialog(order)}
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
          <p className="text-xs text-muted-foreground">{order.store?.address}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {!isSample && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xs border border-border dark:border-gray-500 bg-primary text-white hover:bg-primary hover:text-white dark:hover:bg-primary"
                  onClick={() => (isOwnOrder ? onEdit(order) : onUnauthorized())}
                  disabled={!isOwnOrder}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Order</p></TooltipContent>
            </Tooltip>
          )}

          <Select
            value={order.status}
            onValueChange={(value) =>
              isOwnOrder ? onChangeStatus(order._id, value) : onUnauthorized()
            }
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
              {["shipped", "cancelled", "manifested", "submitted"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize font-medium rounded-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pt-2 text-xs bg-muted/50 dark:bg-muted/20">
        {isSample ? (
          <div className="flex justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">Type:</span>
                <span className="text-foreground font-medium">Sample Request</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">Request Date:</span>
                <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
              </p>
              {order.deliveryDate && (
                <p className="flex items-center gap-1.5">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">Shipped:</span>
                  <span className="text-muted-foreground">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                </p>
              )}
            </div>
            <div className="space-y-0.5 text-right">
              {order.description && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Note:</span>{" "}
                  {order.description}
                </p>
              )}
              <p>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">Rep:</span>{" "}
                <span className="text-primary font-medium">{order.rep?.name || "N/A"}</span>
              </p>
              <p>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">Created by:</span>{" "}
                <span className="text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-between flex-wrap gap-2 bg-accent/10 p-2 rounded-xs">
            <div className="space-y-0.5">
              <p>
                <span className="text-primary font-semibold">Order#:</span>{" "}
                <span className="text-foreground">{order.orderNumber}</span>
              </p>
              {order.deliveryDate && (
                <p>
                  <span className="text-primary font-semibold">Shipped:</span>{" "}
                  <span className="text-muted-foreground">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                </p>
              )}
              <p>
                <span className="text-primary font-semibold">Rep:</span>{" "}
                <span className="text-primary font-medium">{order.rep?.name || "N/A"}</span>
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                Amount: ${(Number(order.total) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p>
                <span className="text-primary font-semibold">Created by:</span>{" "}
                <span className="text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
