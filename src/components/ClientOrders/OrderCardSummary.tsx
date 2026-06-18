"use client";

import { IClientOrder } from "@/types";

interface Props {
  order: IClientOrder;
}

export function OrderCardSummary({ order }: Props) {
  const productTypeTotals = order.items.reduce<Record<string, number>>((acc, item) => {
    const pt = (item.productType || "UNKNOWN").toUpperCase();
    acc[pt] = (acc[pt] || 0) + item.quantity;
    return acc;
  }, {});

  return (
    <div className="bg-primary/20 dark:bg-primary/10 px-3 py-2">
      {/* Product type unit totals */}
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {Object.entries(productTypeTotals).map(([type, total]) => (
          <span
            key={type}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-primary/15 dark:bg-primary/20 text-xs font-semibold text-primary"
          >
            {type} &mdash; {total.toLocaleString()} units
          </span>
        ))}
      </div>
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
