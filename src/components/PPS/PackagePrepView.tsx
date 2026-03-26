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
import type { ILabelOrder, ILabelInventory } from "@/types/privateLabel/packagePrep";

type Tab = "on_order" | "unprocessed" | "apply_label" | "printed";

const TABS: { id: Tab; label: string }[] = [
  { id: "on_order", label: "On Order" },
  { id: "unprocessed", label: "Unprocessed" },
  { id: "apply_label", label: "Apply Label" },
  { id: "printed", label: "Printed" },
];

// ─── On Order Tab ─────────────────────────────────────────────────────────────

function OnOrderTab({ compact }: { compact?: boolean }) {
  const { data, isLoading, isError } = useGetActiveLabelOrdersQuery();
  const [receiveOrder, { isLoading: receiving }] = useReceiveLabelOrderMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load orders." />;

  const orders = data?.orders ?? [];

  if (orders.length === 0) {
    return <EmptyState msg="No labels on order." />;
  }

  async function handleReceive(order: ILabelOrder) {
    const qty = parseInt(quantities[order._id] ?? String(order.quantityOrdered), 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    try {
      await receiveOrder({ orderId: order._id, quantityReceived: qty }).unwrap();
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
          <div key={order._id} className="rounded-xs border bg-card">
            <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-200 font-medium">On Order</span>
                </div>
                <p className={`${compact ? "text-base" : "text-xl"} font-bold truncate`}>{order.storeName}</p>
                <p className={`${compact ? "text-sm" : "text-lg"} font-medium text-foreground mt-0.5`}>{order.labelName}{order.itemId ? ` · ${order.itemId}` : ""}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ordered: <span className="font-semibold text-foreground">{order.quantityOrdered.toLocaleString()}</span>
                  {" · "}{new Date(order.orderedAt).toLocaleDateString()}
                </p>
                {order.notes && <p className="text-xs text-muted-foreground mt-1 italic">{order.notes}</p>}
              </div>
              {!isExpanded && (
                <button
                  onClick={() => {
                    setExpandedId(order._id);
                    setQuantities((q) => ({ ...q, [order._id]: String(order.quantityOrdered) }));
                  }}
                  className="shrink-0 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Receive
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="border-t px-5 py-4 bg-amber-400/10 border-amber-400/30 flex flex-col gap-3">
                <p className="text-sm text-amber-800 font-medium">Enter actual quantity received (may differ slightly from ordered):</p>
                <input
                  type="number"
                  min={1}
                  value={quantities[order._id] ?? order.quantityOrdered}
                  onChange={(e) => setQuantities((q) => ({ ...q, [order._id]: e.target.value }))}
                  className="rounded-xs border bg-background px-3 py-2 text-sm w-48"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReceive(order)}
                    disabled={receiving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {receiving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Receipt
                  </button>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="px-4 py-2 rounded-xs bg-muted text-muted-foreground text-sm font-medium"
                  >
                    Cancel
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

function UnprocessedTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [applyLabels, { isLoading: applying }] = useApplyLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyQty, setApplyQty] = useState<Record<string, string>>({});

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? []).filter((i) => i.unprocessed > 0);

  if (items.length === 0) return <EmptyState msg="No unprocessed labels." />;

  async function handleApply(inv: ILabelInventory) {
    const qty = parseInt(applyQty[inv._id] ?? "", 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    if (qty > inv.unprocessed) { toast.error(`Only ${inv.unprocessed} available`); return; }
    try {
      await applyLabels({ storeId: inv.storeId, labelId: inv.labelId, quantity: qty }).unwrap();
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
        const totalStock = (inv.unprocessed + inv.labeled + inv.printed);
        const belowThreshold = inv.reorderThreshold > 0 && totalStock < inv.reorderThreshold;
        return (
          <div key={inv._id} className="rounded-xs border bg-card">
            <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {belowThreshold && (
                  <div className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xs px-2 py-1 mb-2 w-fit">
                    <AlertTriangle className="w-3 h-3" /> Below reorder threshold
                  </div>
                )}
                <p className={`${compact ? "text-base" : "text-xl"} font-bold truncate`}>{inv.storeName}</p>
                <p className={`${compact ? "text-sm" : "text-lg"} font-medium text-foreground mt-0.5`}>{inv.labelName}{inv.itemId ? ` · ${inv.itemId}` : ""}</p>
                {isAdmin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reorder threshold: <span className="font-semibold">{inv.reorderThreshold > 0 ? inv.reorderThreshold.toLocaleString() : "not set"}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className={`${compact ? "text-xl" : "text-3xl"} font-bold tabular-nums`}>{inv.unprocessed.toLocaleString()}</p>
                {!isExpanded && (
                  <button
                    onClick={() => { setExpandedId(inv._id); setApplyQty((q) => ({ ...q, [inv._id]: String(inv.unprocessed) })); }}
                    className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t px-5 py-4 bg-amber-400/10 border-amber-400/30 flex flex-col gap-3">
                <p className="text-sm text-amber-800 font-medium">How many labels to apply to bags now?</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={inv.unprocessed}
                    value={applyQty[inv._id] ?? ""}
                    onChange={(e) => setApplyQty((q) => ({ ...q, [inv._id]: e.target.value }))}
                    className="rounded-xs border bg-background px-3 py-2 text-sm w-36"
                    autoFocus
                  />
                  <button
                    onClick={() => setApplyQty((q) => ({ ...q, [inv._id]: String(inv.unprocessed) }))}
                    className="px-3 py-2 rounded-xs bg-muted text-sm font-medium"
                  >
                    Apply All
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApply(inv)}
                    disabled={applying}
                    className="flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Apply
                  </button>
                  <button onClick={() => setExpandedId(null)} className="px-4 py-2 rounded-xs bg-muted text-muted-foreground text-sm font-medium">Cancel</button>
                </div>
              </div>
            )}

            {isAdmin && <ReorderThresholdInline inv={inv} compact={compact} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Apply Label Tab (labeled → printed) ─────────────────────────────────────

function ApplyLabelTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [printLabels, { isLoading: printing }] = usePrintLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, { qty: string; lotNumber: string; thcPercent: string; testDate: string }>>({});

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? []).filter((i) => i.labeled > 0);

  if (items.length === 0) return <EmptyState msg="No labeled bags awaiting printing." />;

  function getForm(id: string, labeled: number) {
    return forms[id] ?? { qty: String(labeled), lotNumber: "", thcPercent: "", testDate: "" };
  }

  function setForm(id: string, patch: Partial<typeof forms[string]>) {
    setForms((f) => ({ ...f, [id]: { ...getForm(id, 0), ...patch } }));
  }

  async function handlePrint(inv: ILabelInventory) {
    const form = getForm(inv._id, inv.labeled);
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    if (qty > inv.labeled) { toast.error(`Only ${inv.labeled} labeled bags available`); return; }
    if (!form.lotNumber || !form.thcPercent || !form.testDate) { toast.error("Fill in all batch data fields"); return; }
    try {
      await printLabels({
        storeId: inv.storeId, labelId: inv.labelId, quantity: qty,
        lotNumber: form.lotNumber, thcPercent: form.thcPercent, testDate: form.testDate,
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
        return (
          <div key={inv._id} className="rounded-xs border bg-card">
            <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className={`${compact ? "text-base" : "text-xl"} font-bold truncate`}>{inv.storeName}</p>
                <p className={`${compact ? "text-sm" : "text-lg"} font-medium text-foreground mt-0.5`}>{inv.labelName}{inv.itemId ? ` · ${inv.itemId}` : ""}</p>
                <p className="text-sm text-muted-foreground mt-1">Awaiting batch data print</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className={`${compact ? "text-xl" : "text-3xl"} font-bold tabular-nums`}>{inv.labeled.toLocaleString()}</p>
                {!isExpanded && (
                  <button
                    onClick={() => { setExpandedId(inv._id); setForm(inv._id, { qty: String(inv.labeled) }); }}
                    className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Print Results
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t px-5 py-4 bg-amber-400/10 border-amber-400/30 flex flex-col gap-3">
                <p className="text-sm text-amber-800 font-medium">Enter batch test data and quantity printed:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Quantity Printed</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={1} max={inv.labeled}
                        value={form.qty}
                        onChange={(e) => setForm(inv._id, { qty: e.target.value })}
                        className="rounded-xs border bg-background px-3 py-2 text-sm w-28"
                        autoFocus
                      />
                      <button onClick={() => setForm(inv._id, { qty: String(inv.labeled) })} className="px-3 py-2 rounded-xs bg-muted text-sm">All</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Lot Number</label>
                    <input
                      type="text" placeholder="e.g. LOT-2024-001"
                      value={form.lotNumber}
                      onChange={(e) => setForm(inv._id, { lotNumber: e.target.value })}
                      className="rounded-xs border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">THC %</label>
                    <input
                      type="text" placeholder="e.g. 18.4%"
                      value={form.thcPercent}
                      onChange={(e) => setForm(inv._id, { thcPercent: e.target.value })}
                      className="rounded-xs border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Test Date</label>
                    <input
                      type="date"
                      value={form.testDate}
                      onChange={(e) => setForm(inv._id, { testDate: e.target.value })}
                      className="rounded-xs border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handlePrint(inv)}
                    disabled={printing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {printing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Print
                  </button>
                  <button onClick={() => setExpandedId(null)} className="px-4 py-2 rounded-xs bg-muted text-muted-foreground text-sm font-medium">Cancel</button>
                </div>
              </div>
            )}

            {isAdmin && <ReorderThresholdInline inv={inv} compact={compact} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Printed Tab ──────────────────────────────────────────────────────────────

function PrintedTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? []).filter((i) => i.printed > 0);

  if (items.length === 0) return <EmptyState msg="No printed bags in stock." />;

  const total = items.reduce((s, i) => s + i.printed, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xs px-4 py-2">
        {total.toLocaleString()} total finished bags ready for gummies
      </p>
      {items.map((inv) => (
        <div key={inv._id} className="rounded-xs border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className={`${compact ? "text-base" : "text-xl"} font-bold truncate`}>{inv.storeName}</p>
              <p className={`${compact ? "text-sm" : "text-lg"} font-medium text-foreground mt-0.5`}>{inv.labelName}{inv.itemId ? ` · ${inv.itemId}` : ""}</p>
              {inv.lastPrintData && (
                <p className="text-xs text-muted-foreground mt-1">
                  Lot: {inv.lastPrintData.lotNumber} · THC: {inv.lastPrintData.thcPercent} · {inv.lastPrintData.testDate}
                </p>
              )}
            </div>
            <p className={`${compact ? "text-xl" : "text-3xl"} font-bold tabular-nums text-green-700 shrink-0`}>
              {inv.printed.toLocaleString()}
            </p>
          </div>
          {isAdmin && <ReorderThresholdInline inv={inv} compact={compact} />}
        </div>
      ))}
    </div>
  );
}

// ─── Reorder Threshold Inline (admin only) ────────────────────────────────────

function ReorderThresholdInline({ inv, compact }: { inv: ILabelInventory; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(inv.reorderThreshold));
  const [setThreshold, { isLoading }] = useSetReorderThresholdMutation();

  async function handleSave() {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid threshold"); return; }
    try {
      await setThreshold({ inventoryId: inv._id, reorderThreshold: n }).unwrap();
      toast.success("Reorder threshold updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update threshold");
    }
  }

  return (
    <div className="border-t mx-5 py-3 flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Reorder threshold:</span>
      {editing ? (
        <>
          <input
            type="number" min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-xs border bg-background px-2 py-1 text-xs w-24"
            autoFocus
          />
          <button onClick={handleSave} disabled={isLoading} className="p-1 rounded-xs text-green-700 hover:bg-green-50">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button onClick={() => { setEditing(false); setValue(String(inv.reorderThreshold)); }} className="p-1 rounded-xs text-muted-foreground hover:bg-muted">
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <span className="text-xs font-semibold">{inv.reorderThreshold > 0 ? inv.reorderThreshold.toLocaleString() : "not set"}</span>
          <button onClick={() => { setEditing(true); setValue(String(inv.reorderThreshold)); }} className="p-1 rounded-xs text-muted-foreground hover:bg-muted">
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
  return <p className="text-muted-foreground text-sm py-10 text-center">{msg}</p>;
}

// ─── Main PackagePrepView ─────────────────────────────────────────────────────

export default function PackagePrepView({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const [active, setActive] = useState<Tab>("on_order");

  // Below-threshold alert banner
  const { data: inventoryData } = useGetLabelInventoryQuery();
  const belowCount = (inventoryData?.inventory ?? []).filter(
    (i) => i.reorderThreshold > 0 && (i.unprocessed + i.labeled + i.printed) < i.reorderThreshold
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && <PackagePrepAdminOrder />}

      {isAdmin && belowCount > 0 && (
        <div className="flex items-center gap-2 rounded-xs bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {belowCount} SKU{belowCount !== 1 ? "s are" : " is"} below reorder threshold
        </div>
      )}

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xs transition-colors",
              active === id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {active === "on_order" && <OnOrderTab compact={compact} />}
      {active === "unprocessed" && <UnprocessedTab isAdmin={isAdmin} compact={compact} />}
      {active === "apply_label" && <ApplyLabelTab isAdmin={isAdmin} compact={compact} />}
      {active === "printed" && <PrintedTab isAdmin={isAdmin} compact={compact} />}
    </div>
  );
}
