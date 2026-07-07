"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  FileText,
  ShoppingCart,
  Truck,
  Calendar,
  FilePlus,
  Package,
  Building2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { IStore } from "@/types";
import {
  useGetStoreCreditLedgerQuery,
  useAddStoreCreditMutation,
  type ICreditTransaction,
} from "@/redux/api/StoreCredit/storeCreditApi";
import { useAssignStoreToChainMutation } from "@/redux/api/Chains/chainsApi";

function getAdminName(): string {
  try {
    const user = JSON.parse(localStorage.getItem("better-user") || "{}");
    return user?.name || "Admin";
  } catch {
    return "Admin";
  }
}

interface StoreCardProps {
  store: any;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (store: any) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (store: any) => void;
  onOpenOrders: (storeId: string) => void;
  onOpenDelivery: (store: any) => void;
  onOpenFollowup: (store: IStore) => void;
  onOpenCreateOrder: (store: IStore) => void;
  onOpenSample: (store: IStore) => void;
  onAddNote: (store: IStore) => void;
  chains?: { id: string; name: string }[];
  currentChainId?: string;
}

export const StoreCard = ({
  store,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onOpenNotes,
  onOpenOrders,
  onOpenDelivery,
  onOpenFollowup,
  onOpenCreateOrder,
  onOpenSample,
  onAddNote,
  chains = [],
  currentChainId,
}: StoreCardProps) => {
  const hasDue = store.dueAmount > 0;
  const paymentColor =
    store.paymentStatus === "red"
      ? "text-red-500 dark:text-red-400"
      : store.paymentStatus === "yellow"
      ? "text-yellow-600 dark:text-yellow-500"
      : store.paymentStatus === "green"
      ? "text-green-600 dark:text-green-500"
      : "text-muted-foreground";

  const [assignChain, { isLoading: assigningChain }] = useAssignStoreToChainMutation();
  const NONE = "__none__";
  const [chainValue, setChainValue] = useState(currentChainId ?? NONE);
  useEffect(() => { setChainValue(currentChainId ?? NONE); }, [currentChainId]);

  async function handleChainChange(newId: string) {
    setChainValue(newId);
    const chainId = newId === NONE ? undefined : newId;
    const result = await assignChain({ storeId: store._id, chainId });
    if ("error" in result) {
      toast.error("Failed to update chain");
      setChainValue(currentChainId ?? NONE);
    } else {
      const label = chainId ? (chains.find((c) => c.id === chainId)?.name ?? "chain") : "No chain";
      toast.success(`${store.name} → ${label}`);
    }
  }

  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const { data: ledger, isLoading: ledgerLoading } = useGetStoreCreditLedgerQuery(store._id, {
    skip: !ledgerOpen,
  });

  const [addCredit, { isLoading: addSaving }] = useAddStoreCreditMutation();

  function toggleLedger() {
    setLedgerOpen((v) => !v);
    if (ledgerOpen) setFormOpen(false);
  }

  function openForm(e: React.MouseEvent) {
    e.stopPropagation();
    setFormOpen(true);
    setFormAmount("");
    setFormNote("");
    setTimeout(() => amountRef.current?.focus(), 50);
  }

  async function saveCredit() {
    const amount = parseFloat(formAmount);
    if (!formNote.trim() || isNaN(amount) || amount === 0) return;
    const result = await addCredit({ storeId: store._id, amount, note: formNote.trim(), addedBy: getAdminName() });
    if (!("error" in result)) {
      setFormOpen(false);
    }
  }

  // Compute running balance per transaction for display
  const txWithBalance = (ledger?.transactions ?? []).reduce<
    Array<{ tx: ICreditTransaction; runningBalance: number }>
  >((acc, tx) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].runningBalance : 0;
    acc.push({ tx, runningBalance: parseFloat((prev + tx.amount).toFixed(2)) });
    return acc;
  }, []);

  return (
    <Card
      className={`p-4 shadow-sm hover:shadow-md transition-all rounded-xs gap-0 ${
        store.blocked ? "opacity-70 border-destructive/30" : ""
      }`}
    >
      {/* TOP: Store Info + Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2">
        <div className="flex items-start gap-4 flex-1">
          <Checkbox
            className="border-accent"
            checked={selected}
            onCheckedChange={() => onSelect(store._id)}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="text-lg text-foreground font-bold relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
                onClick={() => onAddNote(store)}
              >
                {store.name}
              </h3>
              {store.storeId && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-xs">
                  {store.storeId}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{store.address || "No address"}</p>
            {chains.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Select value={chainValue} onValueChange={handleChainChange} disabled={assigningChain}>
                  <SelectTrigger className="h-7 text-xs rounded-xs border-border bg-white dark:bg-card w-auto min-w-[120px] max-w-[200px] px-2 gap-1">
                    <SelectValue placeholder="No chain" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs">
                    <SelectItem value="__none__" className="text-xs">No chain</SelectItem>
                    {chains.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assigningChain && (
                  <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent shrink-0" />
                )}
              </div>
            )}
          </div>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-xs cursor-pointer" onClick={() => onOpenNotes(store)}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Notes</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-xs cursor-pointer" onClick={() => onOpenCreateOrder(store)}>
                  <FilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Create Order</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-xs cursor-pointer" onClick={() => onOpenSample(store)}>
                  <Package className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Sample</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-xs cursor-pointer" onClick={() => onOpenOrders(store._id)}>
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Orders</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-xs cursor-pointer" onClick={() => onOpenDelivery(store)}>
                  <Truck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Delivery</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer" onClick={() => onOpenFollowup(store)}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Follow Up</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xs bg-card border-2 border-foreground/20 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-foreground/30 transition-all cursor-pointer" onClick={() => onEdit(store)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit</p></TooltipContent>
            </Tooltip>

            <ConfirmDialog
              triggerText="Delete"
              onConfirm={() => onDelete(store._id)}
              title={`Delete ${store.name}?`}
              description="This action cannot be undone."
              confirmText="Yes, delete"
            />
          </div>
        </TooltipProvider>
      </div>

      {/* CREDIT LEDGER */}
      <div className="mb-3 border border-amber-200 dark:border-amber-800 rounded-xs overflow-hidden">
        {/* Header — click to toggle */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-950/30 cursor-pointer select-none"
          onClick={toggleLedger}
        >
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <span className="text-amber-700 dark:text-amber-400">⊟</span> Store Credit Ledger
          </span>
          <div className="flex items-center gap-3">
            {ledger && (
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                Balance: ${ledger.balance.toFixed(2)}
              </span>
            )}
            {ledgerOpen && (
              <button
                className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
                onClick={formOpen ? (e) => { e.stopPropagation(); setFormOpen(false); } : openForm}
              >
                {formOpen ? "Cancel" : "+ Add / Adjust"}
              </button>
            )}
          </div>
        </div>

        {ledgerOpen && (
          <div className="bg-amber-50/60 dark:bg-amber-950/10 px-3 pb-3">
            {ledgerLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Inline form */}
                {formOpen && (
                  <div className="pt-2 pb-1">
                    <div className="flex gap-2 items-center">
                      <input
                        ref={amountRef}
                        type="number"
                        step="0.01"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="Amount (use - to deduct)"
                        className="w-44 border border-amber-300 dark:border-amber-700 rounded-xs px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <input
                        type="text"
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        placeholder="Reason (required)"
                        className="flex-1 border border-amber-300 dark:border-amber-700 rounded-xs px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400"
                        onKeyDown={(e) => e.key === "Enter" && saveCredit()}
                      />
                      <button
                        onClick={saveCredit}
                        disabled={addSaving || !formNote.trim() || !formAmount}
                        className="px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xs transition-colors"
                      >
                        {addSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Will be recorded as {getAdminName()} ·{" "}
                      {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                )}

                {/* Transactions */}
                {txWithBalance.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No transactions yet.</p>
                ) : (
                  <div className="pt-1">
                    {[...txWithBalance].reverse().map(({ tx, runningBalance }, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between py-1.5 border-t border-amber-100 dark:border-amber-900 first:border-t-0"
                      >
                        <div>
                          <p className="text-sm text-foreground">{tx.note || tx.ref || tx.type}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            · {tx.type}
                            {tx.addedBy ? ` · ${tx.addedBy}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p
                            className={`text-sm font-semibold ${
                              tx.amount >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-500 dark:text-red-400"
                            }`}
                          >
                            {tx.amount >= 0 ? "+" : ""}${tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">bal ${runningBalance.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM: Contacts & Due Info */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 text-sm bg-muted/30 dark:bg-muted p-2 rounded-xs">
          {Array.isArray(store?.contacts) && store.contacts.length > 0 ? (
            <div className="mb-2">
              <p className="font-semibold text-foreground mb-1">Contacts:</p>
              {store.contacts.map((c: any, idx: number) => (
                <div key={idx} className="pl-2 border-l-2 border-primary mb-1">
                  <div className="flex flex-wrap gap-2 text-foreground">
                    <span>
                      <strong className="text-primary">{c?.name}</strong>{" "}
                      {c?.role && <span className="text-muted-foreground">({c.role})</span>}
                    </span>
                    {c?.email && <span className="text-muted-foreground">| {c.email}</span>}
                    {c?.phone && <span className="text-muted-foreground">| {c.phone}</span>}
                  </div>
                  {c?.importantToKnow && (
                    <div className="text-sm text-green-700 dark:text-green-400">
                      <strong>Important:</strong> {c.importantToKnow}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {store.rep && (
            <div className="mb-2">
              <strong className="text-foreground">Rep:</strong>{" "}
              <span className="text-primary font-medium">{store.rep.name || store.rep}</span>
            </div>
          )}

          <div>
            <strong className="text-foreground">Status:</strong>{" "}
            {store.blocked ? (
              <span className="text-red-600 dark:text-red-400 font-medium">Paused</span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
            )}
          </div>
        </div>

        {hasDue && (
          <div className="md:w-1/3">
            <div className="bg-muted/30 dark:bg-muted/20 p-3 rounded-xs">
              <div className={`text-sm font-medium ${paymentColor} text-right`}>
                Due: ${store.dueAmount.toLocaleString()}
                {store.lastPaidAt && (
                  <span className="block text-muted-foreground text-xs">
                    Last paid: {new Date(store.lastPaidAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
