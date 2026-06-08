"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  ShoppingCart,
  CheckCircle2,
  Layers,
  Sparkles,
  User,
  Clock,
  Truck,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUser } from "@/lib/storeUser";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { useGetMyOrdersQuery } from "@/redux/api/PrivateLabel/storeOrderApi";
import { LABEL_STAGES, type LabelStage } from "@/types/privateLabel/label";
import { STAGE_META } from "@/lib/labelStageMeta";
import type { IStoreDraftLabel, IStoreOrder } from "@/types/privateLabel/gummyBuilder";

const APPROVED_STAGES: LabelStage[] = [
  "olcc_approved",
  "print_order_submitted",
  "ready_for_production",
];
const COMPLETED_ORDER_STATUSES = ["shipped", "delivered"];

const STAGE_TEXT_COLOR: Record<LabelStage, string> = {
  design_in_progress:      "text-blue-600 dark:text-blue-400",
  awaiting_store_approval: "text-amber-600 dark:text-amber-400",
  store_approved:          "text-green-600 dark:text-green-400",
  submitted_to_olcc:       "text-purple-600 dark:text-purple-400",
  olcc_approved:           "text-green-700 dark:text-green-400",
  print_order_submitted:   "text-indigo-600 dark:text-indigo-400",
  ready_for_production:    "text-emerald-700 dark:text-emerald-400",
};

const ORDER_META: Record<
  string,
  { label: string; icon: React.ReactNode; badge: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    badge: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  in_production: {
    label: "In Production",
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    badge: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className="w-3.5 h-3.5" />,
    badge: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    badge: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
  },
};

// ─── Stage stepper ─────────────────────────────────────────────────────────
function StageStepper({ currentStage }: { currentStage?: LabelStage }) {
  const stage = currentStage ?? "design_in_progress";
  const currentIdx = LABEL_STAGES.indexOf(stage);
  const meta = STAGE_META[stage];
  const textColor = STAGE_TEXT_COLOR[stage];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${meta.color}`} />
        <span className={`text-xs font-semibold ${textColor}`}>{meta.full}</span>
        <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
          {currentIdx + 1} / {LABEL_STAGES.length}
        </span>
      </div>
      <div className="flex gap-0.5">
        {LABEL_STAGES.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              idx < currentIdx
                ? "bg-green-500"
                : idx === currentIdx
                ? meta.color
                : "bg-muted-foreground/15"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">Design</span>
        <span className="text-[10px] text-muted-foreground">Ready</span>
      </div>
    </div>
  );
}

// ─── Label card ────────────────────────────────────────────────────────────
function LabelCard({ label }: { label: IStoreDraftLabel }) {
  const isApproved = APPROVED_STAGES.includes(label.currentStage as LabelStage);
  return (
    <div
      className={`rounded-xs border bg-card p-4 space-y-3 ${
        isApproved ? "border-emerald-200 dark:border-emerald-900/60" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">{label.flavorName}</span>
        </div>
        {label.submittedAt && (
          <span className="text-[11px] text-muted-foreground shrink-0">
            {new Date(label.submittedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
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
      <StageStepper currentStage={label.currentStage} />
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {label.unitsOrdered.toLocaleString()} units
        </span>
        <span className="text-sm font-bold text-primary tabular-nums">
          ${(label.totalCost ?? 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ─── Order card ────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: IStoreOrder }) {
  const meta = ORDER_META[order.status] ?? ORDER_META.pending;
  const isCompleted = COMPLETED_ORDER_STATUSES.includes(order.status);
  return (
    <div
      className={`rounded-xs border bg-card p-4 space-y-3 ${
        isCompleted ? "border-green-200 dark:border-green-900/60" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-bold text-sm">Order #{order._id.slice(-6).toUpperCase()}</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs ${meta.badge}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>
      <div className="rounded-xs border border-border divide-y divide-border overflow-hidden">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
            <span className="text-muted-foreground truncate">{item.label?.flavorName ?? "—"}</span>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="tabular-nums">{item.quantity.toLocaleString()} units</span>
              <span className="font-semibold tabular-nums">${(item.lineTotal ?? 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xs bg-muted/40 px-3 py-2 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ordered</p>
          <p className="text-xs font-medium">
            {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="rounded-xs bg-muted/40 px-3 py-2 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {order.productionStartDate ? "Production" : "ETA"}
          </p>
          <p className="text-xs font-medium">
            {order.expectedDeliveryDate
              ? new Date(order.expectedDeliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : order.productionStartDate
              ? new Date(order.productionStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "TBD"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {order.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} total units
        </span>
        <span className="text-base font-bold text-primary tabular-nums">
          ${(order.totalCost ?? 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <div className={`rounded-xs border border-border animate-pulse bg-muted/50 ${tall ? "h-56" : "h-44"}`} />
  );
}

// ─── Inner (needs useSearchParams) ─────────────────────────────────────────
type Section = "label" | "orders";
type LabelTab = "in_progress" | "approved";
type OrderTab = "ongoing" | "completed";

function AccountPageInner() {
  const searchParams = useSearchParams();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [labelTab, setLabelTab] = useState<LabelTab>("in_progress");
  const [orderTab, setOrderTab] = useState<OrderTab>("ongoing");

  const section: Section =
    searchParams.get("myacc") === "orders" ? "orders" : "label";

  useEffect(() => {
    const user = getStoreUser();
    if (user) { setStoreId(user.storeId); setStoreName(user.storeName); }
  }, []);

  const { data: labelsData, isLoading: isLoadingLabels } = useGetMyLabelsQuery(
    { storeId: storeId ?? "", status: "submitted" },
    { skip: !storeId }
  );
  const { data: ordersData, isLoading: isLoadingOrders } = useGetMyOrdersQuery(
    { storeId: storeId ?? "" },
    { skip: !storeId }
  );

  const allLabels = labelsData?.labels ?? [];
  const allOrders = ordersData?.orders ?? [];

  const inProgressLabels = allLabels.filter(
    (l) => !APPROVED_STAGES.includes(l.currentStage as LabelStage)
  );
  const approvedLabels = allLabels.filter((l) =>
    APPROVED_STAGES.includes(l.currentStage as LabelStage)
  );
  const ongoingOrders = allOrders.filter(
    (o) => !COMPLETED_ORDER_STATUSES.includes(o.status)
  );
  const completedOrders = allOrders.filter((o) =>
    COMPLETED_ORDER_STATUSES.includes(o.status)
  );

  const activeLabelList = labelTab === "in_progress" ? inProgressLabels : approvedLabels;
  const activeOrderList = orderTab === "ongoing" ? ongoingOrders : completedOrders;

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }} />
        <div className="relative flex-1 min-w-0">
          <Link href="/store/private-label" className="inline-flex items-center gap-1.5 text-white/65 dark:text-muted-foreground hover:text-white dark:hover:text-foreground text-xs font-medium mb-2.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Builder
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Private Label
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            My Account
          </h1>
          <p className="text-sm text-white/70 dark:text-muted-foreground mt-0.5">
            {storeName ?? "Your store"}
          </p>
        </div>
        <div className="relative shrink-0 hidden sm:flex items-center justify-center w-12 h-12 rounded-xs bg-white/15 dark:bg-white/5 border border-white/20 dark:border-white/10">
          <User className="w-6 h-6 text-white/60 dark:text-primary/50" />
        </div>
      </div>

      {/* ── Main section switcher (?myacc=label | ?myacc=orders) ── */}
      <div className="rounded-xs border border-border bg-card p-1 flex gap-1">
        <Link
          href="?myacc=label"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xs text-sm font-semibold transition-all ${
            section === "label"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          My Labels
        </Link>
        <Link
          href="?myacc=orders"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xs text-sm font-semibold transition-all ${
            section === "orders"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          My Orders
        </Link>
      </div>

      {/* ── Labels view ── */}
      {section === "label" && (
        <div className="rounded-xs border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border px-2 pt-1">
            {(
              [
                { id: "in_progress" as LabelTab, icon: <Layers className="w-3.5 h-3.5" />, label: "In Progress", count: inProgressLabels.length },
                { id: "approved" as LabelTab, icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Approved", count: approvedLabels.length },
              ]
            ).map(({ id, icon, label, count }) => (
              <button
                key={id}
                onClick={() => setLabelTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  labelTab === id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={labelTab === id ? "text-primary" : "text-muted-foreground"}>
                  {icon}
                </span>
                {label}
                {!isLoadingLabels && (
                  <span className={`text-[11px] font-bold rounded-full px-1.5 min-w-5 text-center tabular-nums ${
                    labelTab === id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4">
            {isLoadingLabels ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : activeLabelList.length === 0 ? (
              <div className="rounded-xs border border-dashed border-border py-14 flex flex-col items-center gap-3">
                <FlaskConical className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {labelTab === "in_progress"
                    ? "No labels currently in progress."
                    : "Labels appear here once OLCC approved."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeLabelList.map((label) => <LabelCard key={label._id} label={label} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Orders view ── */}
      {section === "orders" && (
        <div className="rounded-xs border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border px-2 pt-1">
            {(
              [
                { id: "ongoing" as OrderTab, icon: <Clock className="w-3.5 h-3.5" />, label: "Ongoing", count: ongoingOrders.length },
                { id: "completed" as OrderTab, icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Completed", count: completedOrders.length },
              ]
            ).map(({ id, icon, label, count }) => (
              <button
                key={id}
                onClick={() => setOrderTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  orderTab === id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={orderTab === id ? "text-primary" : "text-muted-foreground"}>
                  {icon}
                </span>
                {label}
                {!isLoadingOrders && (
                  <span className={`text-[11px] font-bold rounded-full px-1.5 min-w-5 text-center tabular-nums ${
                    orderTab === id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4">
            {isLoadingOrders ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} tall />)}
              </div>
            ) : activeOrderList.length === 0 ? (
              <div className="rounded-xs border border-dashed border-border py-14 flex flex-col items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {orderTab === "ongoing"
                    ? "No active orders at the moment."
                    : "No completed orders yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeOrderList.map((order) => <OrderCard key={order._id} order={order} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Loading…
      </div>
    }>
      <AccountPageInner />
    </Suspense>
  );
}
