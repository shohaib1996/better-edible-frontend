"use client";

import { Package, FlaskConical, ShoppingCart, Clock, CheckCircle2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import type { IStoreDraftLabel, IStoreOrder } from "@/types/privateLabel/gummyBuilder";
import type { IPagination } from "@/redux/api/PrivateLabel/storeLabelApi";
import { LABEL_STAGES, type LabelStage } from "@/types/privateLabel/label";
import { STAGE_META } from "@/lib/labelStageMeta";

interface Props {
  view: "labels" | "orders";
  labels: IStoreDraftLabel[];
  orders: IStoreOrder[];
  isLoadingLabels: boolean;
  isLoadingOrders: boolean;
  labelsPagination?: IPagination;
  onLabelsPageChange: (page: number) => void;
  onLabelsLimitChange: (limit: number) => void;
  ordersPagination?: IPagination;
  onOrdersPageChange: (page: number) => void;
  onOrdersLimitChange: (limit: number) => void;
}

function StageDisplay({ currentStage }: { currentStage?: LabelStage }) {
  const stage = currentStage ?? "design_in_progress";
  const currentIdx = LABEL_STAGES.indexOf(stage);
  const meta = STAGE_META[stage];

  return (
    <div className="shrink-0 flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${meta.color}`} />
        <span className="text-xs font-medium text-foreground">{meta.full}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{currentIdx + 1} / {LABEL_STAGES.length}</span>
      <div className="flex items-center gap-0.5">
        {LABEL_STAGES.map((s, idx) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx < currentIdx
                ? "bg-green-500"
                : idx === currentIdx
                ? meta.color
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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

export function ActiveDashboard({
  view,
  labels,
  orders,
  isLoadingLabels,
  isLoadingOrders,
  labelsPagination,
  onLabelsPageChange,
  onLabelsLimitChange,
  ordersPagination,
  onOrdersPageChange,
  onOrdersLimitChange,
}: Props) {
  if (view === "orders") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">My Orders</h2>
          {!isLoadingOrders && ordersPagination && (
            <span className="text-xs text-muted-foreground ml-auto">
              {ordersPagination.totalItems} order{ordersPagination.totalItems !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoadingOrders ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xs border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
            No orders placed yet.
          </div>
        ) : (
          <>
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
                            {item.quantity.toLocaleString()} units · ${(item.lineTotal ?? 0).toFixed(2)}
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
                      <span className="font-bold">${(order.totalCost ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {ordersPagination && ordersPagination.totalPages > 1 && (
              <GlobalPagination
                currentPage={ordersPagination.page}
                totalPages={ordersPagination.totalPages}
                totalItems={ordersPagination.totalItems}
                itemsPerPage={ordersPagination.limit}
                onPageChange={onOrdersPageChange}
                onLimitChange={onOrdersLimitChange}
                limitOptions={[5, 10, 25]}
              />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm">My Labels</h2>
        {!isLoadingLabels && labelsPagination && (
          <span className="text-xs text-muted-foreground ml-auto">
            {labelsPagination.totalItems} submitted
          </span>
        )}
      </div>

      {isLoadingLabels ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : labels.length === 0 ? (
        <div className="rounded-xs border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
          No labels submitted yet.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {labels.map((label) => (
              <div
                key={label._id}
                className="rounded-xs border border-border bg-card p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
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
                    {label.unitsOrdered.toLocaleString()} units · ${(label.unitCost ?? 0).toFixed(4)}/ea · ${(label.totalCost ?? 0).toFixed(2)} total
                  </div>
                </div>
                <StageDisplay currentStage={label.currentStage} />
              </div>
            ))}
          </div>

          {labelsPagination && labelsPagination.totalPages > 1 && (
            <GlobalPagination
              currentPage={labelsPagination.page}
              totalPages={labelsPagination.totalPages}
              totalItems={labelsPagination.totalItems}
              itemsPerPage={labelsPagination.limit}
              onPageChange={onLabelsPageChange}
              onLimitChange={onLabelsLimitChange}
              limitOptions={[5, 10, 25]}
            />
          )}
        </>
      )}
    </div>
  );
}
