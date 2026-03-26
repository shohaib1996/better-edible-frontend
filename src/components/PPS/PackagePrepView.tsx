"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useGetActiveLabelOrdersQuery,
  useReceiveLabelOrderMutation,
  useGetLabelInventoryQuery,
  useApplyLabelsMutation,
  usePrintLabelsMutation,
  useSetReorderThresholdMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import PackagePrepAdminOrder from "./PackagePrepAdminOrder";
import type {
  ILabelOrder,
  ILabelInventory,
} from "@/types/privateLabel/packagePrep";

type Tab = "on_order" | "unprocessed" | "apply_label" | "printed";

const TABS: { id: Tab; label: string }[] = [
  { id: "on_order", label: "On Order" },
  { id: "unprocessed", label: "Unprocessed" },
  { id: "apply_label", label: "Apply Label" },
  { id: "printed", label: "Printed" },
];

const fieldClass =
  "w-full rounded-xs border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

// ─── On Order Tab ─────────────────────────────────────────────────────────────

function OnOrderTab({ compact }: { compact?: boolean }) {
  const { data, isLoading, isError } = useGetActiveLabelOrdersQuery();
  const [receiveOrder, { isLoading: receiving }] =
    useReceiveLabelOrderMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load orders." />;

  const orders = data?.orders ?? [];
  if (orders.length === 0) return <EmptyState msg="No labels on order." />;

  async function handleReceive(order: ILabelOrder) {
    const qty = parseInt(
      quantities[order._id] ?? String(order.quantityOrdered),
      10,
    );
    if (isNaN(qty) || qty < 1) {
      toast.error("Enter a valid quantity");
      return;
    }
    try {
      await receiveOrder({
        orderId: order._id,
        quantityReceived: qty,
      }).unwrap();
      toast.success(`Received ${qty} labels for ${order.labelName}`);
      setExpandedId(null);
    } catch {
      toast.error("Failed to record receipt");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const isExpanded = expandedId === order._id;
        return (
          <div
            key={order._id}
            className="rounded-xs border border-border bg-card overflow-hidden"
          >
            {/* Card header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-200 font-medium dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                      On Order
                    </span>
                  </div>
                  <p
                    className={cn(
                      "font-bold truncate",
                      compact ? "text-base" : "text-lg",
                    )}
                  >
                    {order.storeName}
                  </p>
                  <p
                    className={cn(
                      "font-medium text-foreground mt-0.5",
                      compact ? "text-sm" : "text-base",
                    )}
                  >
                    {order.labelName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ordered:{" "}
                    <span className="font-semibold text-foreground">
                      {order.quantityOrdered.toLocaleString()}
                    </span>
                    <span className="mx-1.5 text-border">·</span>
                    {new Date(order.orderedAt).toLocaleDateString()}
                  </p>
                  {order.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {order.notes}
                    </p>
                  )}
                </div>
                {!isExpanded && (
                  <button
                    onClick={() => {
                      setExpandedId(order._id);
                      setQuantities((q) => ({
                        ...q,
                        [order._id]: String(order.quantityOrdered),
                      }));
                    }}
                    className="shrink-0 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Receive
                  </button>
                )}
              </div>
            </div>

            {/* Expanded receive form */}
            {isExpanded && (
              <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Enter actual quantity received:
                </p>
                <input
                  type="number"
                  min={1}
                  value={quantities[order._id] ?? order.quantityOrdered}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      [order._id]: e.target.value,
                    }))
                  }
                  className={fieldClass}
                  autoFocus
                />
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReceive(order)}
                    disabled={receiving}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {receiving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Unprocessed Tab ──────────────────────────────────────────────────────────

function UnprocessedTab({
  isAdmin,
  compact,
}: {
  isAdmin: boolean;
  compact?: boolean;
}) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [applyLabels, { isLoading: applying }] = useApplyLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyQty, setApplyQty] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? [])
    .filter((i) => i.unprocessed > 0)
    .sort((a, b) => {
      const aBelow = a.reorderThreshold > 0 && (a.unprocessed + a.labeled + a.printed) < a.reorderThreshold;
      const bBelow = b.reorderThreshold > 0 && (b.unprocessed + b.labeled + b.printed) < b.reorderThreshold;
      return Number(bBelow) - Number(aBelow);
    });
  if (items.length === 0) return <EmptyState msg="No unprocessed labels." />;

  async function handleApply(inv: ILabelInventory) {
    const qty = parseInt(applyQty[inv._id] ?? "", 10);
    if (isNaN(qty) || qty < 1) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (qty > inv.unprocessed) {
      toast.error(`Only ${inv.unprocessed} available`);
      return;
    }
    try {
      await applyLabels({
        storeId: inv.storeId,
        labelId: inv.labelId,
        quantity: qty,
      }).unwrap();
      toast.success(`${qty} labels moved to labeled`);
      setExpandedId(null);
    } catch {
      toast.error("Failed to apply labels");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((inv) => {
        const isExpanded = expandedId === inv._id;
        const totalStock = inv.unprocessed + inv.labeled + inv.printed;
        const belowThreshold =
          inv.reorderThreshold > 0 && totalStock < inv.reorderThreshold;
        return (
          <div
            key={inv._id}
            className={cn(
              "rounded-xs border bg-card overflow-hidden",
              belowThreshold
                ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500"
                : "border-border"
            )}
          >
            <div className="px-4 pt-4 pb-3">
              {belowThreshold && (
                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xs px-2.5 py-1.5 mb-3 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Below reorder threshold
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-bold truncate",
                      compact ? "text-base" : "text-lg",
                    )}
                  >
                    {inv.storeName}
                  </p>
                  <p
                    className={cn(
                      "font-medium text-foreground mt-0.5",
                      compact ? "text-sm" : "text-base",
                    )}
                  >
                    {inv.labelName}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reorder threshold:{" "}
                      <span className="font-semibold">
                        {inv.reorderThreshold > 0
                          ? inv.reorderThreshold.toLocaleString()
                          : "not set"}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      compact ? "text-xl" : "text-2xl",
                    )}
                  >
                    {inv.unprocessed.toLocaleString()}
                  </p>
                  {!isExpanded && (
                    <button
                      onClick={() => {
                        setExpandedId(inv._id);
                        setApplyQty((q) => ({
                          ...q,
                          [inv._id]: String(inv.unprocessed),
                        }));
                      }}
                      className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  How many labels to apply to bags now?
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={inv.unprocessed}
                    value={applyQty[inv._id] ?? ""}
                    onChange={(e) =>
                      setApplyQty((q) => ({ ...q, [inv._id]: e.target.value }))
                    }
                    className={cn(fieldClass, "flex-1")}
                    autoFocus
                  />
                  <button
                    onClick={() =>
                      setApplyQty((q) => ({
                        ...q,
                        [inv._id]: String(inv.unprocessed),
                      }))
                    }
                    className="shrink-0 px-3 py-2 rounded-xs border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                  >
                    All
                  </button>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApply(inv)}
                    disabled={applying}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Apply
                  </button>
                </div>
              </div>
            )}

            {isAdmin && <ReorderThresholdInline inv={inv} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Apply Label Tab (labeled → printed) ─────────────────────────────────────

function ApplyLabelTab({
  isAdmin,
  compact,
}: {
  isAdmin: boolean;
  compact?: boolean;
}) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [printLabels, { isLoading: printing }] = usePrintLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forms, setForms] = useState<
    Record<
      string,
      { qty: string; lotNumber: string; thcPercent: string; testDate: string }
    >
  >({});

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? [])
    .filter((i) => i.labeled > 0)
    .sort((a, b) => {
      const aBelow = a.reorderThreshold > 0 && (a.unprocessed + a.labeled + a.printed) < a.reorderThreshold;
      const bBelow = b.reorderThreshold > 0 && (b.unprocessed + b.labeled + b.printed) < b.reorderThreshold;
      return Number(bBelow) - Number(aBelow);
    });
  if (items.length === 0)
    return <EmptyState msg="No labeled bags awaiting printing." />;

  function getForm(id: string, labeled: number) {
    return (
      forms[id] ?? {
        qty: String(labeled),
        lotNumber: "",
        thcPercent: "",
        testDate: "",
      }
    );
  }

  function setForm(id: string, patch: Partial<(typeof forms)[string]>) {
    setForms((f) => ({ ...f, [id]: { ...getForm(id, 0), ...patch } }));
  }

  async function handlePrint(inv: ILabelInventory) {
    const form = getForm(inv._id, inv.labeled);
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (qty > inv.labeled) {
      toast.error(`Only ${inv.labeled} labeled bags available`);
      return;
    }
    if (!form.lotNumber || !form.thcPercent || !form.testDate) {
      toast.error("Fill in all batch data fields");
      return;
    }
    try {
      await printLabels({
        storeId: inv.storeId,
        labelId: inv.labelId,
        quantity: qty,
        lotNumber: form.lotNumber,
        thcPercent: form.thcPercent,
        testDate: form.testDate,
      }).unwrap();
      toast.success(`${qty} bags marked as printed`);
      setExpandedId(null);
    } catch {
      toast.error("Failed to record print");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((inv) => {
        const isExpanded = expandedId === inv._id;
        const form = getForm(inv._id, inv.labeled);
        const belowThreshold = inv.reorderThreshold > 0 && (inv.unprocessed + inv.labeled + inv.printed) < inv.reorderThreshold;
        return (
          <div
            key={inv._id}
            className={cn(
              "rounded-xs border bg-card overflow-hidden",
              belowThreshold
                ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500"
                : "border-border"
            )}
          >
            <div className="px-4 pt-4 pb-3">
              {belowThreshold && (
                <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xs px-2.5 py-1.5 mb-3 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Below reorder threshold
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-bold truncate",
                      compact ? "text-base" : "text-lg",
                    )}
                  >
                    {inv.storeName}
                  </p>
                  <p
                    className={cn(
                      "font-medium text-foreground mt-0.5",
                      compact ? "text-sm" : "text-base",
                    )}
                  >
                    {inv.labelName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Awaiting batch data print
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      compact ? "text-xl" : "text-2xl",
                    )}
                  >
                    {inv.labeled.toLocaleString()}
                  </p>
                  {!isExpanded && (
                    <button
                      onClick={() => {
                        setExpandedId(inv._id);
                        setForm(inv._id, { qty: String(inv.labeled) });
                      }}
                      className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Print Results
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Enter batch test data and quantity printed:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Quantity Printed
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={inv.labeled}
                        value={form.qty}
                        onChange={(e) =>
                          setForm(inv._id, { qty: e.target.value })
                        }
                        className={cn(fieldClass, "flex-1")}
                        autoFocus
                      />
                      <button
                        onClick={() =>
                          setForm(inv._id, { qty: String(inv.labeled) })
                        }
                        className="shrink-0 px-3 py-2 rounded-xs border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                      >
                        All
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Lot Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LOT-2024-001"
                      value={form.lotNumber}
                      onChange={(e) =>
                        setForm(inv._id, { lotNumber: e.target.value })
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      THC %
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 18.4%"
                      value={form.thcPercent}
                      onChange={(e) =>
                        setForm(inv._id, { thcPercent: e.target.value })
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Test Date
                    </label>
                    <input
                      type="date"
                      value={form.testDate}
                      onChange={(e) =>
                        setForm(inv._id, { testDate: e.target.value })
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 mt-1">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePrint(inv)}
                    disabled={printing}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {printing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Print
                  </button>
                </div>
              </div>
            )}

            {isAdmin && <ReorderThresholdInline inv={inv} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Printed Tab ──────────────────────────────────────────────────────────────

function PrintedTab({
  isAdmin,
  compact,
}: {
  isAdmin: boolean;
  compact?: boolean;
}) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? [])
    .filter((i) => i.printed > 0)
    .sort((a, b) => {
      const aBelow = a.reorderThreshold > 0 && (a.unprocessed + a.labeled + a.printed) < a.reorderThreshold;
      const bBelow = b.reorderThreshold > 0 && (b.unprocessed + b.labeled + b.printed) < b.reorderThreshold;
      return Number(bBelow) - Number(aBelow);
    });
  if (items.length === 0) return <EmptyState msg="No printed bags in stock." />;

  const total = items.reduce((s, i) => s + i.printed, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xs px-4 py-2.5 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
        {total.toLocaleString()} total finished bags ready for gummies
      </p>
      {items.map((inv) => {
        const belowThreshold = inv.reorderThreshold > 0 && (inv.unprocessed + inv.labeled + inv.printed) < inv.reorderThreshold;
        return (
        <div
          key={inv._id}
          className={cn(
            "rounded-xs border bg-card overflow-hidden",
            belowThreshold
              ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500"
              : "border-border"
          )}
        >
          <div className="px-4 py-4">
            {belowThreshold && (
              <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xs px-2.5 py-1.5 mb-3 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Below reorder threshold
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-bold truncate",
                    compact ? "text-base" : "text-lg",
                  )}
                >
                  {inv.storeName}
                </p>
                <p
                  className={cn(
                    "font-medium text-foreground mt-0.5",
                    compact ? "text-sm" : "text-base",
                  )}
                >
                  {inv.labelName}
                </p>
                {inv.lastPrintData && (
                  <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                    <span>Lot: {inv.lastPrintData.lotNumber}</span>
                    <span>THC: {inv.lastPrintData.thcPercent}</span>
                    <span>{inv.lastPrintData.testDate}</span>
                  </p>
                )}
              </div>
              <p
                className={cn(
                  "font-bold tabular-nums text-green-700 shrink-0 dark:text-green-400",
                  compact ? "text-xl" : "text-2xl",
                )}
              >
                {inv.printed.toLocaleString()}
              </p>
            </div>
          </div>
          {isAdmin && <ReorderThresholdInline inv={inv} />}
        </div>
        );
      })}
    </div>
  );
}

// ─── Reorder Threshold Inline (admin only) ────────────────────────────────────

function ReorderThresholdInline({ inv }: { inv: ILabelInventory }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(inv.reorderThreshold));
  const [setThreshold, { isLoading }] = useSetReorderThresholdMutation();

  async function handleSave() {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) {
      toast.error("Enter a valid threshold");
      return;
    }
    try {
      await setThreshold({
        inventoryId: inv._id,
        reorderThreshold: n,
      }).unwrap();
      toast.success("Reorder threshold updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update threshold");
    }
  }

  return (
    <div className="border-t border-border mx-4 py-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Reorder threshold:</span>
      {editing ? (
        <>
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-xs border border-input bg-background px-2 py-1 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="p-1 rounded-xs text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setValue(String(inv.reorderThreshold));
            }}
            className="p-1 rounded-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <span className="text-xs font-semibold">
            {inv.reorderThreshold > 0
              ? inv.reorderThreshold.toLocaleString()
              : "not set"}
          </span>
          <button
            onClick={() => {
              setEditing(true);
              setValue(String(inv.reorderThreshold));
            }}
            className="p-1 rounded-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return <p className="text-destructive text-sm py-10 text-center">{msg}</p>;
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <p className="text-muted-foreground text-sm py-10 text-center">{msg}</p>
  );
}

// ─── Main PackagePrepView ─────────────────────────────────────────────────────

export default function PackagePrepView({
  isAdmin,
  compact,
}: {
  isAdmin: boolean;
  compact?: boolean;
}) {
  const [active, setActive] = useState<Tab>("on_order");

  const { data: inventoryData } = useGetLabelInventoryQuery();
  const belowCount = (inventoryData?.inventory ?? []).filter(
    (i) =>
      i.reorderThreshold > 0 &&
      i.unprocessed + i.labeled + i.printed < i.reorderThreshold,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && <PackagePrepAdminOrder />}

      {isAdmin && belowCount > 0 && (
        <div className="flex items-center gap-2 rounded-xs bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {belowCount} SKU{belowCount !== 1 ? "s are" : " is"} below reorder
          threshold
        </div>
      )}

      {/* Tab bar — equal-width grid on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-xs transition-colors text-center",
              active === id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {active === "on_order" && <OnOrderTab compact={compact} />}
      {active === "unprocessed" && (
        <UnprocessedTab isAdmin={isAdmin} compact={compact} />
      )}
      {active === "apply_label" && (
        <ApplyLabelTab isAdmin={isAdmin} compact={compact} />
      )}
      {active === "printed" && (
        <PrintedTab isAdmin={isAdmin} compact={compact} />
      )}
    </div>
  );
}
