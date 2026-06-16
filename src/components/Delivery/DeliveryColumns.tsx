"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Column } from "@/components/ReUsableComponents/DataTable";
import type { Delivery } from "@/types/delivery/delivery";
import { PaymentCollectedCell, DeliveryNoteCell } from "./DeliveryCells";

function getStatusStyles(status: string) {
  switch (status) {
    case "pending":     return "bg-yellow-500 text-white dark:bg-yellow-600";
    case "assigned":    return "bg-blue-500 text-white dark:bg-blue-600";
    case "in_transit":  return "bg-purple-500 text-white dark:bg-purple-600";
    case "completed":   return "bg-emerald-500 text-white dark:bg-emerald-600";
    case "cancelled":   return "bg-red-500 text-white dark:bg-red-600";
    default:            return "bg-gray-500 text-white dark:bg-gray-600";
  }
}

export function buildDeliveryColumns(
  currentPage: number,
  itemsPerPage: number,
  stopOrderMap?: Map<string, number>
): Column<Delivery>[] {
  return [
    {
      key: "index",
      header: "#",
      className: "w-[50px] text-center",
      render: (delivery, index) => {
        const stopNum = stopOrderMap?.get(delivery._id);
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-sm font-medium">
              {(currentPage - 1) * itemsPerPage + index + 1}
            </span>
            {stopNum != null && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded px-1 leading-tight">
                Stop {stopNum}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "storeId",
      header: "Store",
      className: "min-w-[200px]",
      render: (delivery) => (
        <div className="flex flex-col">
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer">
                    <div className="font-semibold text-foreground truncate max-w-[200px]">
                      {delivery.storeId?.name || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {delivery.storeId?.address}
                      {delivery.storeId?.city && `, ${delivery.storeId.city}`}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xs max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{delivery.storeId?.name || "N/A"}</p>
                    <p className="text-xs">
                      {delivery.storeId?.address}
                      {delivery.storeId?.city && `, ${delivery.storeId.city}`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="md:hidden">
            <div className="font-semibold text-foreground wrap-break-word whitespace-normal max-w-[250px]">
              {delivery.storeId?.name || "N/A"}
            </div>
            <div className="text-sm text-muted-foreground whitespace-normal max-w-[250px]">
              {delivery.storeId?.address}
              {delivery.storeId?.city && `, ${delivery.storeId.city}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned Rep",
      render: (delivery) => (
        <div className="text-primary font-medium">
          {delivery.assignedTo?.name || "Unassigned"}
        </div>
      ),
    },
    {
      key: "disposition",
      header: "Details",
      render: (delivery) => (
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="capitalize text-foreground font-medium">
            {(Array.isArray(delivery.disposition)
              ? delivery.disposition
              : [delivery.disposition]
            )
              .map((d: string) => d.replace(/_/g, " "))
              .join(", ")}
          </span>
          <span className="text-muted-foreground capitalize">
            {delivery.paymentAction.replace(/_/g, " ")}
          </span>
          <span className="text-primary font-semibold">
            ${delivery.amount.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Payment Collected",
      render: (delivery) => <PaymentCollectedCell deliveryId={delivery._id} />,
    },
    {
      key: "notes",
      header: "Admin Note",
      render: (delivery) => (
        <div className="text-sm text-foreground max-w-[200px] whitespace-normal">
          {delivery.notes || <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: "repNote",
      header: "Rep Note",
      render: (delivery) => <DeliveryNoteCell deliveryId={delivery._id} />,
    },
    {
      key: "status",
      header: "Status",
      render: (delivery) => (
        <span
          className={cn(
            "inline-flex items-center rounded-xs px-2.5 py-1 text-xs font-medium capitalize",
            getStatusStyles(delivery.status)
          )}
        >
          {delivery.status.replace(/_/g, " ")}
        </span>
      ),
    },
  ];
}
