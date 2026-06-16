"use client";

import { cn } from "@/lib/utils";
import type { Delivery } from "@/types/delivery/delivery";
import { PaymentCollectedCell, DeliveryNoteCell } from "./DeliveryCells";

function getStatusStyles(status: string) {
  switch (status) {
    case "pending":    return "bg-yellow-500 text-white";
    case "assigned":   return "bg-blue-500 text-white";
    case "in_transit": return "bg-purple-500 text-white";
    case "completed":  return "bg-emerald-500 text-white";
    case "cancelled":  return "bg-red-500 text-white";
    default:           return "bg-gray-500 text-white";
  }
}

interface DeliveryMobileCardProps {
  delivery: Delivery;
  index: number;
}

export function DeliveryMobileCard({ delivery, index }: DeliveryMobileCardProps) {
  const disposition = (
    Array.isArray(delivery.disposition) ? delivery.disposition : [delivery.disposition]
  )
    .map((d: string) => d.replace(/_/g, " "))
    .join(", ");

  return (
    <div className="bg-card border border-border rounded-md p-4 space-y-3">
      {/* Header row: number + store name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-xs text-muted-foreground font-medium mt-0.5 shrink-0">
            #{index}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground leading-tight">
              {delivery.storeId?.name || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {delivery.storeId?.address}
              {delivery.storeId?.city && `, ${delivery.storeId.city}`}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize",
            getStatusStyles(delivery.status)
          )}
        >
          {delivery.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Details row */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Rep</p>
          <p className="text-primary font-medium">
            {delivery.assignedTo?.name || "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
          <p className="text-foreground font-semibold">${delivery.amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Type</p>
          <p className="text-foreground capitalize">{disposition}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
          <p className="text-foreground capitalize">
            {delivery.paymentAction.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Payment collected */}
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Payment Collected</p>
        <PaymentCollectedCell deliveryId={delivery._id} />
      </div>

      {/* Admin note */}
      {delivery.notes && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Admin Note</p>
          <p className="text-sm text-foreground">{delivery.notes}</p>
        </div>
      )}

      {/* Rep note */}
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Rep Note</p>
        <DeliveryNoteCell deliveryId={delivery._id} />
      </div>
    </div>
  );
}
