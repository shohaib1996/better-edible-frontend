"use client";

import { Package, FlaskConical, ShoppingCart, Clock, CheckCircle2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IStoreDraftLabel, IStoreOrder } from "@/types/privateLabel/gummyBuilder";

interface Props {
  labels: IStoreDraftLabel[];
  orders: IStoreOrder[];
  isLoadingLabels: boolean;
  isLoadingOrders: boolean;
}

const LABEL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
};

const ORDER_STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  in_production: {
    label: "In Production",
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className="w-3.5 h-3.5" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  },
};

function SkeletonCard() {
  return <div className="rounded-xs border border-border bg-card p-4 h-24 animate-pulse" />;
}

export function ActiveDashboard({ labels, orders, isLoadingLabels, isLoadingOrders }: Props) {
  const submittedLabels = labels.filter((l) => l.labelStatus === "submitted");

  return (
    <div className="space-y-8">
      {/* Submitted Labels */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">My Labels</h2>
          {!isLoadingLabels && (
            <span className="text-xs text-muted-foreground ml-auto">
              {submittedLabels.length} submitted
            </span>
          )}
        </div>

        {isLoadingLabels ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : submittedLabels.length === 0 ? (
          <div className="rounded-xs border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
            No labels submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {submittedLabels.map((label) => {
              const status = LABEL_STATUS_MAP[label.labelStatus] ?? LABEL_STATUS_MAP.submitted;
              return (
                <div
                  key={label._id}
                  className="rounded-xs border border-border bg-card p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="font-medium text-sm truncate">{label.flavorName}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="rounded-xs text-xs">
                        {label.oilType === "rosin" ? "Rosin" : "BioMax"}
                      </Badge>
                      <Badge variant="outline" className="rounded-xs text-xs">
                        {label.size === "xl" ? "XL" : "Standard"}
                      </Badge>
                      <Badge variant="outline" className="rounded-xs text-xs">
                        {label.effect.charAt(0).toUpperCase() + label.effect.slice(1)}
                      </Badge>
                      {label.cannabinoids.map((c) => (
                        <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">
                          {c.name} {c.mg}mg
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {label.unitsOrdered.toLocaleString()} units · ${label.unitCost.toFixed(4)}/ea · ${label.totalCost.toFixed(2)} total
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded-xs ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Orders */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">My Orders</h2>
          {!isLoadingOrders && (
            <span className="text-xs text-muted-foreground ml-auto">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoadingOrders ? (
          <div className="space-y-3">
            <SkeletonCard />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xs border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
            No orders placed yet.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusMeta = ORDER_STATUS_MAP[order.status] ?? ORDER_STATUS_MAP.pending;
              return (
                <div
                  key={order._id}
                  className="rounded-xs border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-xs ${statusMeta.color}`}
                    >
                      {statusMeta.icon}
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="divide-y divide-border">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 text-sm">
                        <span className="text-muted-foreground truncate">
                          {item.label?.flavorName ?? "—"}
                        </span>
                        <span className="shrink-0 ml-4">
                          {item.quantity.toLocaleString()} units · ${item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm border-t border-border pt-2">
                    <span className="text-muted-foreground text-xs">
                      {order.productionStartDate
                        ? `Production starts ${new Date(order.productionStartDate).toLocaleDateString()}`
                        : "Production date TBD"}
                    </span>
                    <span className="font-bold">${order.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
