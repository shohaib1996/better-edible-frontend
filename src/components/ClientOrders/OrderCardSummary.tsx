"use client";

import { IClientOrder } from "@/types";

interface Props {
  order: IClientOrder;
}

export function OrderCardSummary({ order }: Props) {
  return (
    <div className="bg-primary/20 dark:bg-primary/10 px-3 py-2">
      <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-2 lg:flex lg:flex-row justify-between gap-y-2 gap-x-4 text-xs sm:text-sm">
        <div className="flex-1 min-w-0">
          {order.items.map((item, idx) => (
            <span key={idx} className="inline-block">
              {item.flavorName} ({item.quantity})
              {idx < order.items.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 shrink-0 text-right">
          <span className="whitespace-nowrap">Sub: ${order.subtotal.toFixed(2)}</span>
          {order.discountAmount > 0 && (
            <span className="text-green-600 whitespace-nowrap">
              Disc: -${order.discountAmount.toFixed(2)}
            </span>
          )}
          <span className="font-bold whitespace-nowrap">Total: ${order.total.toFixed(2)}</span>
        </div>
      </div>
      {order.note && (
        <p className="text-sm text-muted-foreground mt-1 italic">Note: {order.note}</p>
      )}
    </div>
  );
}
