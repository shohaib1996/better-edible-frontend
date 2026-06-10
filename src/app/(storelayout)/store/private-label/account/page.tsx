"use client";

import { useEffect, useState, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Plus,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getStoreUser } from "@/lib/storeUser";
import { hexToHueRotation } from "@/lib/useGummyBuilder";
import { GummyVisual } from "@/components/PrivateLabel/GummyVisual";
import { StoreCreateOrderModal } from "@/components/PrivateLabel/StoreCreateOrderModal";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { useGetMyOrdersQuery } from "@/redux/api/PrivateLabel/storeOrderApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { LABEL_STAGES, type LabelStage } from "@/types/privateLabel/label";
import { STAGE_META } from "@/lib/labelStageMeta";
import type { IStoreDraftLabel, IStoreOrder } from "@/types/privateLabel/gummyBuilder";
import { RecipeDataModal } from "@/components/PrivateLabel/RecipeDataModal";

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

const ORDER_META: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
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
              idx < currentIdx ? "bg-green-500" : idx === currentIdx ? meta.color : "bg-muted-foreground/15"
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
function LabelCard({ label, onUpdate }: { label: IStoreDraftLabel; onUpdate: () => void }) {
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const isApproved = APPROVED_STAGES.includes(label.currentStage as LabelStage);
  const gummyHue = label.gummyColorHex ? hexToHueRotation(label.gummyColorHex) : 0;
  const missingRecipeData = !label.gummyColorHex || !(label.selectedFlavors ?? []).length;
  return (
    <Card className={cn(
      "rounded-xs shadow-none gap-3 p-4 py-4",
      isApproved && "border-emerald-200 dark:border-emerald-900/60"
    )}>
      {/* Header: gummy visual + flavor name + date */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <GummyVisual size={label.size} hue={gummyHue} compact />
          {label.gummyColorHex && (
            <span
              className="w-3 h-3 rounded-full border border-border"
              style={{ backgroundColor: label.gummyColorHex }}
              title={label.gummyColorName ?? label.gummyColorHex}
            />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-semibold text-sm truncate">{label.flavorName}</span>
            </div>
            {label.submittedAt && (
              <span className="text-[11px] text-muted-foreground shrink-0">
                {new Date(label.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          {/* Color info */}
          {label.gummyColorHex && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] bg-muted border border-border rounded-xs px-1.5 py-0.5">
                {label.gummyColorHex.toUpperCase()}
              </span>
              {label.gummyColorName && (
                <span className="text-[11px] text-muted-foreground">{label.gummyColorName}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
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
        {(label.selectedFlavors ?? []).map((f) => (
          <Badge key={f} className="rounded-xs text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
            {f}
          </Badge>
        ))}
      </div>

      <StageStepper currentStage={label.currentStage} />
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label.unitsOrdered.toLocaleString()} units</span>
        <span className="text-sm font-bold text-primary tabular-nums">${(label.totalCost ?? 0).toFixed(2)}</span>
      </div>

      {/* Missing AI recipe data warning */}
      {missingRecipeData && (
        <div className="flex items-center justify-between gap-2 rounded-xs bg-amber-400/10 border border-amber-400/30 px-3 py-2">
          <span className="text-xs text-amber-800 dark:text-amber-400">
            AI recipe data missing — flavor / color not set
          </span>
          <button
            type="button"
            onClick={() => setShowRecipeModal(true)}
            className="shrink-0 text-xs font-semibold text-amber-800 dark:text-amber-400 underline underline-offset-2 hover:opacity-70"
          >
            Add Now
          </button>
        </div>
      )}

      {showRecipeModal && (
        <RecipeDataModal
          open={showRecipeModal}
          onClose={() => setShowRecipeModal(false)}
          labelId={label._id}
          flavorName={label.flavorName}
          initialFlavors={label.selectedFlavors}
          initialColorHex={label.gummyColorHex}
          initialColorName={label.gummyColorName}
          onSuccess={onUpdate}
        />
      )}
    </Card>
  );
}

// ─── Order card ────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: IStoreOrder }) {
  const [open, setOpen] = useState(false);
  const meta = ORDER_META[order.status] ?? ORDER_META.pending;
  const isCompleted = COMPLETED_ORDER_STATUSES.includes(order.status);
  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Card className={cn(
      "rounded-xs shadow-none gap-0 p-0 overflow-hidden",
      isCompleted && "border-green-200 dark:border-green-900/60"
    )}>
      {/* ── Fixed header ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-bold text-sm">Order #{order._id.slice(-6).toUpperCase()}</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs shrink-0 ${meta.badge}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* ── Collapsible items toggle ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors border-t border-b border-border text-xs"
      >
        <span className="text-muted-foreground font-medium">
          {order.items.length} {order.items.length === 1 ? "item" : "items"} · {totalUnits.toLocaleString()} units
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* ── Items list (collapsible) ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="items"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="divide-y divide-border border-b border-border">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-xs bg-card">
                  <span className="text-muted-foreground truncate">{item.label?.flavorName ?? "—"}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="tabular-nums">{item.quantity.toLocaleString()} units</span>
                    <span className="font-semibold tabular-nums">${(item.lineTotal ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed footer ── */}
      <div className="px-4 py-3 space-y-3">
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
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{totalUnits.toLocaleString()} total units</span>
          <span className="text-base font-bold text-primary tabular-nums">${(order.totalCost ?? 0).toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <Card className="rounded-xs shadow-none border-dashed py-14 gap-3 items-center justify-center">
      <div className="text-muted-foreground/30">{icon}</div>
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </Card>
  );
}

// ─── Tab count badge ────────────────────────────────────────────────────────
function TabCount({ count }: { count: number }) {
  return (
    <span className="ml-1 text-[10px] font-bold rounded-full bg-current/15 px-1.5 py-0.5 tabular-nums min-w-5 text-center">
      {count}
    </span>
  );
}

// ─── Inner page (needs useSearchParams) ────────────────────────────────────
type Section = "label" | "orders";

function AccountPageInner() {
  const searchParams = useSearchParams();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [labelTab, setLabelTab] = useState("in_progress");
  const [orderTab, setOrderTab] = useState("ongoing");
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  // Pagination state — one pair per sub-tab
  const [ipPage, setIpPage] = useState(1);
  const [ipLimit, setIpLimit] = useState(12);
  const [apPage, setApPage] = useState(1);
  const [apLimit, setApLimit] = useState(12);
  const [ogPage, setOgPage] = useState(1);
  const [ogLimit, setOgLimit] = useState(10);
  const [cpPage, setCpPage] = useState(1);
  const [cpLimit, setCpLimit] = useState(10);

  const section: Section = searchParams.get("myacc") === "orders" ? "orders" : "label";

  useEffect(() => {
    const user = getStoreUser();
    if (user) { setStoreId(user.storeId); setStoreName(user.storeName); }
  }, []);

  const { data: ipData, isLoading: isLoadingIp, refetch: refetchIp } = useGetMyLabelsQuery(
    { storeId: storeId ?? "", status: "submitted", stageGroup: "in_progress", page: ipPage, limit: ipLimit },
    { skip: !storeId }
  );
  const { data: apData, isLoading: isLoadingAp, refetch: refetchAp } = useGetMyLabelsQuery(
    { storeId: storeId ?? "", stageGroup: "approved", page: apPage, limit: apLimit },
    { skip: !storeId }
  );
  const { data: ogData, isLoading: isLoadingOg } = useGetMyOrdersQuery(
    { storeId: storeId ?? "", statusGroup: "ongoing", page: ogPage, limit: ogLimit },
    { skip: !storeId }
  );
  const { data: cpData, isLoading: isLoadingCp } = useGetMyOrdersQuery(
    { storeId: storeId ?? "", statusGroup: "completed", page: cpPage, limit: cpLimit },
    { skip: !storeId }
  );

  const inProgressLabels = ipData?.labels ?? [];
  const approvedLabels   = apData?.labels ?? [];
  const ongoingOrders    = ogData?.orders ?? [];
  const completedOrders  = cpData?.orders ?? [];

  const inProgressTotal = ipData?.pagination?.totalItems ?? inProgressLabels.length;
  const approvedTotal   = apData?.pagination?.totalItems ?? approvedLabels.length;
  const ongoingTotal    = ogData?.pagination?.totalItems ?? ongoingOrders.length;
  const completedTotal  = cpData?.pagination?.totalItems ?? completedOrders.length;

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
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">My Account</h1>
          <p className="text-sm text-white/70 dark:text-muted-foreground mt-0.5">{storeName ?? "Your store"}</p>
        </div>
        <div className="relative shrink-0 hidden sm:flex items-center justify-center w-12 h-12 rounded-xs bg-white/15 dark:bg-white/5 border border-white/20 dark:border-white/10">
          <User className="w-6 h-6 text-white/60 dark:text-primary/50" />
        </div>
      </div>

      {/* ── Section switcher (?myacc=label | ?myacc=orders) ── */}
      <Card className="rounded-xs shadow-none p-1 flex-row gap-1 py-1">
        <Button
          asChild
          variant={section === "label" ? "default" : "ghost"}
          className="flex-1 rounded-xs"
        >
          <Link href="?myacc=label">
            <FlaskConical className="w-4 h-4" />
            My Labels
          </Link>
        </Button>
        <Button
          asChild
          variant={section === "orders" ? "default" : "ghost"}
          className="flex-1 rounded-xs"
        >
          <Link href="?myacc=orders">
            <ShoppingCart className="w-4 h-4" />
            My Orders
          </Link>
        </Button>
      </Card>

      {/* ── Labels section ── */}
      {section === "label" && (
        <Card className="rounded-xs shadow-none p-0 gap-0">
          <Tabs value={labelTab} onValueChange={setLabelTab} className="gap-0">
            <div className="px-4 pt-3 pb-0">
              <TabsList className="w-full h-10">
                <TabsTrigger value="in_progress" className="flex-1 gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  In Progress
                  {!isLoadingIp && <TabCount count={inProgressTotal} />}
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex-1 gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved
                  {!isLoadingAp && <TabCount count={approvedTotal} />}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="in_progress" className="p-4 pt-3 mt-0">
              {isLoadingIp ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="rounded-xs h-44 bg-muted" />)}
                </div>
              ) : inProgressLabels.length === 0 ? (
                <EmptyState icon={<FlaskConical className="w-8 h-8" />} message="No labels currently in progress." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inProgressLabels.map((label) => <LabelCard key={label._id} label={label} onUpdate={refetchIp} />)}
                  </div>
                  {ipData?.pagination && ipData.pagination.totalItems > 0 && (
                    <GlobalPagination
                      currentPage={ipPage}
                      totalPages={ipData.pagination.totalPages}
                      totalItems={ipData.pagination.totalItems}
                      itemsPerPage={ipLimit}
                      onPageChange={setIpPage}
                      onLimitChange={(l) => { setIpPage(1); setIpLimit(l); }}
                      limitOptions={[6, 12, 24, 48]}
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="approved" className="p-4 pt-3 mt-0">
              {isLoadingAp ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="rounded-xs h-44 bg-muted" />)}
                </div>
              ) : approvedLabels.length === 0 ? (
                <EmptyState icon={<FlaskConical className="w-8 h-8" />} message="Labels appear here once OLCC approved." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {approvedLabels.map((label) => <LabelCard key={label._id} label={label} onUpdate={refetchAp} />)}
                  </div>
                  {apData?.pagination && apData.pagination.totalItems > 0 && (
                    <GlobalPagination
                      currentPage={apPage}
                      totalPages={apData.pagination.totalPages}
                      totalItems={apData.pagination.totalItems}
                      itemsPerPage={apLimit}
                      onPageChange={setApPage}
                      onLimitChange={(l) => { setApPage(1); setApLimit(l); }}
                      limitOptions={[6, 12, 24, 48]}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* ── Orders section ── */}
      {section === "orders" && storeId && (
        <StoreCreateOrderModal
          open={showCreateOrder}
          onClose={() => setShowCreateOrder(false)}
          onSuccess={() => setShowCreateOrder(false)}
          storeId={storeId}
        />
      )}
      {section === "orders" && (
        <Card className="rounded-xs shadow-none p-0 gap-0">
          <Tabs value={orderTab} onValueChange={setOrderTab} className="gap-0">
            <div className="px-4 pt-3 pb-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">My Orders</span>
                <Button
                  size="sm"
                  className="rounded-xs h-8 gap-1.5 text-xs"
                  onClick={() => setShowCreateOrder(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Place Order
                </Button>
              </div>
              <TabsList className="w-full h-10">
                <TabsTrigger value="ongoing" className="flex-1 gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Ongoing
                  {!isLoadingOg && <TabCount count={ongoingTotal} />}
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                  {!isLoadingCp && <TabCount count={completedTotal} />}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="ongoing" className="p-4 pt-3 mt-0">
              {isLoadingOg ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="rounded-xs h-56 bg-muted" />)}
                </div>
              ) : ongoingOrders.length === 0 ? (
                <EmptyState icon={<ShoppingCart className="w-8 h-8" />} message="No active orders at the moment." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ongoingOrders.map((order) => <OrderCard key={order._id} order={order} />)}
                  </div>
                  {ogData?.pagination && ogData.pagination.totalItems > 0 && (
                    <GlobalPagination
                      currentPage={ogPage}
                      totalPages={ogData.pagination.totalPages}
                      totalItems={ogData.pagination.totalItems}
                      itemsPerPage={ogLimit}
                      onPageChange={setOgPage}
                      onLimitChange={(l) => { setOgPage(1); setOgLimit(l); }}
                      limitOptions={[5, 10, 20, 50]}
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="completed" className="p-4 pt-3 mt-0">
              {isLoadingCp ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="rounded-xs h-56 bg-muted" />)}
                </div>
              ) : completedOrders.length === 0 ? (
                <EmptyState icon={<ShoppingCart className="w-8 h-8" />} message="No completed orders yet." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {completedOrders.map((order) => <OrderCard key={order._id} order={order} />)}
                  </div>
                  {cpData?.pagination && cpData.pagination.totalItems > 0 && (
                    <GlobalPagination
                      currentPage={cpPage}
                      totalPages={cpData.pagination.totalPages}
                      totalItems={cpData.pagination.totalItems}
                      itemsPerPage={cpLimit}
                      onPageChange={setCpPage}
                      onLimitChange={(l) => { setCpPage(1); setCpLimit(l); }}
                      limitOptions={[5, 10, 20, 50]}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading…</div>
    }>
      <AccountPageInner />
    </Suspense>
  );
}
