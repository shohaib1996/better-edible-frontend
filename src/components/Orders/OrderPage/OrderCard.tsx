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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarIcon, Truck, FileText, Pencil, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateInvoice } from "@/utils/invoiceGenerator";
import type { IOrder } from "@/types";
import { getStatusStyle, getStatusSelectBg } from "@/utils/newOrdersUtils";

interface OrderCardProps {
  order: IOrder;
  displayNumber: number;
  isOwnOrder: boolean;
  updateOrder: any;
  updateSample: any;
  refetch: () => void;
  onOpenDialog: (order: IOrder) => void;
  onEdit: (order: IOrder) => void;
  onOpenDelivery: (order: IOrder) => void;
  onOpenPackingList: (order: IOrder) => void;
  onStatusChange: (order: IOrder, newStatus: string) => void;
  onUnauthorized: () => void;
}

export function OrderCard({
  order,
  displayNumber,
  isOwnOrder,
  updateOrder,
  updateSample,
  refetch,
  onOpenDialog,
  onEdit,
  onOpenDelivery,
  onOpenPackingList,
  onStatusChange,
  onUnauthorized,
}: OrderCardProps) {
  const isSample = (order as any).isSample === true;

  return (
    <Card
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
            <span
              className={cn(
                "text-xs font-bold rounded-xs px-1.5 py-0.5 min-w-[24px] text-center",
                isSample ? "bg-purple-600 text-white" : "bg-primary text-white"
              )}
            >
              {displayNumber}
            </span>

            {!isSample ? (
              <button
                onClick={() => onOpenDialog(order)}
                className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2 text-left cursor-pointer relative group after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {order.store?.name || "N/A"}
              </button>
            ) : (
              <span className="text-sm font-bold text-primary uppercase tracking-wide">
                {order.store?.name || "N/A"}
              </span>
            )}

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
          {/* Delivery button (both sample and regular) */}
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
                  if (isOwnOrder) onOpenDelivery(order);
                  else onUnauthorized();
                }}
                disabled={!isOwnOrder}
              >
                <Truck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Schedule delivery</TooltipContent>
          </Tooltip>

          {/* Regular-order-only actions */}
          {!isSample && (
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
                      if (isOwnOrder) generateInvoice(order);
                      else onUnauthorized();
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
                      if (isOwnOrder) onEdit(order);
                      else onUnauthorized();
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
                      if (isOwnOrder) onOpenPackingList(order);
                      else onUnauthorized();
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

          {/* Status select */}
          <Select
            value={order.status}
            onValueChange={(value) => {
              if (isOwnOrder) onStatusChange(order, value);
              else onUnauthorized();
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
              {["submitted", "manifested", "shipped", "cancelled"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize font-medium rounded-xs">
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
          <SampleDetails
            order={order}
            isOwnOrder={isOwnOrder}
            updateSample={updateSample}
            refetch={refetch}
          />
        ) : (
          <RegularOrderDetails
            order={order}
            isOwnOrder={isOwnOrder}
            updateOrder={updateOrder}
            refetch={refetch}
          />
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
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DetailsProps {
  order: IOrder;
  isOwnOrder: boolean;
  refetch: () => void;
}

function SampleDetails({
  order,
  isOwnOrder,
  updateSample,
  refetch,
}: DetailsProps & { updateSample: any }) {
  return (
    <div className="bg-card/80 rounded-xs px-3 py-1.5 border border-purple-200 dark:border-purple-700">
      <div className="flex justify-between flex-wrap gap-2">
        <div className="space-y-0.5">
          <p className="flex items-center gap-1.5">
            <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">Type:</span>
            <span className="text-purple-900 dark:text-purple-200 font-semibold text-xs">Sample Request</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">Request Date:</span>
            <span className="text-foreground text-xs">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-purple-700 dark:text-purple-400 font-bold text-xs">Delivery Date:</span>
            <DeliveryDatePicker
              order={order}
              isOwnOrder={isOwnOrder}
              isSample
              updateFn={updateSample}
              refetch={refetch}
            />
          </p>
        </div>
        <div className="space-y-0.5">
          {(order as any).description && (
            <p className="text-xs text-foreground">
              <span className="font-bold text-purple-700 dark:text-purple-400">Description:</span>{" "}
              {(order as any).description}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-400">Rep:</span>
            <span className="text-foreground">{order.rep?.name || "N/A"}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-400">Created by:</span>
            <span className="text-foreground">{order.createdBy?.user?.name || "N/A"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegularOrderDetails({
  order,
  isOwnOrder,
  updateOrder,
  refetch,
}: DetailsProps & { updateOrder: any }) {
  return (
    <div className="flex justify-between flex-wrap gap-2 px-3 py-1.5">
      <div className="space-y-0.5">
        <p className="text-foreground">
          <span className="font-semibold text-primary">Order#:</span> {order.orderNumber}
        </p>
        <p className="text-foreground">
          <span className="font-semibold text-primary">Order Date:</span>{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
        <p className="flex items-center gap-2">
          <span className="font-semibold text-primary">Delivery Date:</span>
          <DeliveryDatePicker
            order={order}
            isOwnOrder={isOwnOrder}
            isSample={false}
            updateFn={updateOrder}
            refetch={refetch}
          />
        </p>
        <p className="text-foreground">
          <span className="font-semibold text-primary">Rep:</span>{" "}
          {order.rep?.name || "N/A"}
        </p>
      </div>
      <div className="text-right space-y-0.5">
        <p className="text-emerald-600 dark:text-emerald-400 font-bold">
          Amount: $
          {order.total?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"}
        </p>
        <p className="text-primary font-medium">Rep: {order.rep?.name || "N/A"}</p>
        <p className="text-foreground">
          <span className="font-semibold text-primary">Created by:</span>{" "}
          {order.createdBy?.user?.name || "N/A"}
        </p>
      </div>
    </div>
  );
}

interface DeliveryDatePickerProps {
  order: IOrder;
  isOwnOrder: boolean;
  isSample: boolean;
  updateFn: any;
  refetch: () => void;
}

function DeliveryDatePicker({
  order,
  isOwnOrder,
  isSample,
  updateFn,
  refetch,
}: DeliveryDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1.5 bg-card text-foreground font-normal h-6 text-xs rounded-xs",
            isSample
              ? "border-purple-300 dark:border-purple-600 dark:hover:text-purple-400"
              : "dark:hover:text-secondary"
          )}
          disabled={!isOwnOrder}
        >
          <CalendarIcon className={cn("h-3 w-3", isSample ? "text-purple-500" : "text-muted-foreground")} />
          {order.deliveryDate ? (
            format(new Date(order.deliveryDate), "MM/dd/yyyy")
          ) : (
            <span>Pick date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xs" align="start">
        <Calendar
          mode="single"
          selected={order.deliveryDate ? new Date(order.deliveryDate) : undefined}
          onSelect={(date) => {
            if (!date || !isOwnOrder) return;
            updateFn({ id: order._id, deliveryDate: format(date, "yyyy-MM-dd") })
              .unwrap()
              .then(() => { toast.success("Delivery date updated"); refetch(); })
              .catch(() => toast.error("Error updating delivery date"));
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
