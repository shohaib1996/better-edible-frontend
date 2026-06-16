"use client";
export const dynamic = 'force-dynamic';
import { useState, useCallback } from "react";
import {
  useGetRepFollowupsQuery,
  useRescheduleFollowupMutation,
  useResolveFollowupMutation,
  useDeleteFollowupMutation,
} from "@/redux/api/Followups/followupsApi";
import { useCreateOrderMutation } from "@/redux/api/orders/orders";
import { useUser } from "@/redux/hooks/useAuth";
import type { IFollowUp, IFollowupHistoryEntry } from "@/types";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { OrderModal } from "@/components/pages/TodayContact/OrderModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { Field } from "@/components/ReUsableComponents/EntityModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  CalendarIcon, CheckCircle2, ChevronDown, ChevronUp,
  History, Loader2, Repeat, ShoppingCart, Truck,
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";

function toLocalDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function daysOverdue(followupDate: string): number {
  const today = new Date();
  const target = toLocalDate(followupDate);
  if (!target) return 0;
  return differenceInCalendarDays(today, target);
}

// ── Action Modal (Reschedule / Resolve) ─────────────────────────────────────
interface ActionModalProps {
  open: boolean;
  mode: "reschedule" | "resolve";
  followup: IFollowUp | null;
  onClose: () => void;
}
const ActionModal = ({ open, mode, followup, onClose }: ActionModalProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [comments, setComments] = useState("");
  const [reschedule, { isLoading: rescheduling }] = useRescheduleFollowupMutation();
  const [resolve, { isLoading: resolving }] = useResolveFollowupMutation();
  const isLoading = rescheduling || resolving;

  const handleSubmit = async () => {
    if (!followup) return;
    try {
      if (mode === "reschedule") {
        if (!date) { toast.error("Please pick a new date"); return; }
        await reschedule({ id: followup._id, data: { followupDate: format(date, "yyyy-MM-dd"), comments } }).unwrap();
        toast.success("Follow-up rescheduled");
      } else {
        await resolve({ id: followup._id, data: { comments } }).unwrap();
        toast.success("Follow-up resolved ✓");
      }
      setComments("");
      setDate(undefined);
      onClose();
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border rounded-xs p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {mode === "reschedule"
              ? <><Repeat className="h-5 w-5 text-primary" /> Reschedule Follow-Up</>
              : <><CheckCircle2 className="h-5 w-5 text-green-500" /> Resolve Follow-Up</>}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          {followup && <p className="text-sm text-muted-foreground">Store: <span className="font-medium text-foreground">{followup.store.name}</span></p>}
          {mode === "reschedule" && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">New Follow-Up Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border rounded-xs bg-input", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-xs border-border">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-xs bg-background" />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">{mode === "reschedule" ? "Note (optional)" : "Resolution note (optional)"}</label>
            <Textarea placeholder={mode === "reschedule" ? "Why rescheduling?" : "What happened?"} value={comments}
              onChange={(e) => setComments(e.target.value)} className="min-h-[80px] border-border rounded-xs bg-input resize-none" />
          </div>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="rounded-xs border-border">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}
            className={cn("rounded-xs ml-2 shadow-sm", mode === "resolve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "reschedule" ? "Reschedule" : "Mark Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── History Panel ────────────────────────────────────────────────────────────
const HistoryPanel = ({ history }: { history: IFollowupHistoryEntry[] }) => {
  if (!history?.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <History className="h-3 w-3" /> Thread History
      </p>
      <div className="space-y-1.5">
        {[...history].reverse().map((entry, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <Badge variant="outline" className={cn("shrink-0 rounded-xs text-[10px] px-1.5 py-0",
              entry.action === "created" && "border-blue-400 text-blue-500",
              entry.action === "rescheduled" && "border-amber-400 text-amber-500",
              entry.action === "resolved" && "border-green-400 text-green-500")}>
              {entry.action}
            </Badge>
            <span className="text-muted-foreground">
              {format(new Date(entry.changedAt), "MMM d, yyyy")}
              {entry.comments && ` — ${entry.comments}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Follow-Up Card ───────────────────────────────────────────────────────────
interface FollowUpCardProps {
  followup: IFollowUp;
  onReschedule: (f: IFollowUp) => void;
  onResolve: (f: IFollowUp) => void;
  onDelivery: (f: IFollowUp) => void;
  onNewOrder: (f: IFollowUp) => void;
}
const FollowUpCard = ({ followup: f, onReschedule, onResolve, onDelivery, onNewOrder }: FollowUpCardProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [deleteFollowup] = useDeleteFollowupMutation();
  const overdueDays = daysOverdue(f.followupDate);
  const local = toLocalDate(f.followupDate);

  return (
    <Card className="rounded-xs border border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base text-foreground">{f.store.name}</h3>
              {overdueDays > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xs text-xs border-0">
                  {overdueDays} day{overdueDays > 1 ? "s" : ""} overdue
                </Badge>
              )}
              {overdueDays === 0 && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-xs text-xs border-0">
                  Due today
                </Badge>
              )}
              {f.setByDriver && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-xs text-xs border-0 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Set by {f.setByName || "driver"}
                </Badge>
              )}
            </div>
            {(f.store.city || f.store.address) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {f.store.city}{f.store.state ? `, ${f.store.state}` : ""}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>Target: {local ? format(local, "MMM d, yyyy") : "—"}</span>
            </div>
            {f.interestLevel && (
              <p className="text-xs text-muted-foreground mt-1">Interest: <span className="text-foreground">{f.interestLevel}</span></p>
            )}
            {f.comments && <p className="text-sm text-foreground mt-2">{f.comments}</p>}
          </div>
          <ConfirmDialog triggerText="Dismiss" title="Dismiss this follow-up?"
            description="This will permanently delete the follow-up and its history."
            onConfirm={async () => {
              try { await deleteFollowup(f._id).unwrap(); toast.success("Follow-up dismissed"); }
              catch { toast.error("Failed to dismiss follow-up"); }
            }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onResolve(f)} className="rounded-xs bg-green-600 hover:bg-green-700 text-white gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReschedule(f)} className="rounded-xs border-input gap-1">
            <Repeat className="h-3.5 w-3.5" /> Reschedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelivery(f)} className="rounded-xs border-input gap-1">
            <Truck className="h-3.5 w-3.5" /> Delivery
          </Button>
          <Button size="sm" variant="outline" onClick={() => onNewOrder(f)} className="rounded-xs border-input gap-1">
            <ShoppingCart className="h-3.5 w-3.5" /> Order
          </Button>
        </div>
        {f.history?.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <History className="h-3 w-3" />
            {showHistory ? "Hide" : "Show"} history ({f.history.length})
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
        {showHistory && <HistoryPanel history={f.history} />}
      </CardContent>
    </Card>
  );
};

// ── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className={cn("flex items-center gap-2 py-1.5 px-3 rounded-xs", color)}>
    <span className="font-semibold text-sm">{label}</span>
    <Badge variant="secondary" className="rounded-xs text-xs px-1.5 py-0">{count}</Badge>
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────
const FollowUps = () => {
  const user = useUser();
  const [actionModal, setActionModal] = useState<{ open: boolean; mode: "reschedule" | "resolve"; followup: IFollowUp | null }>
    ({ open: false, mode: "reschedule", followup: null });
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStoreForDelivery, setSelectedStoreForDelivery] = useState<IFollowUp["store"] | null>(null);
  const [selectedRepForDelivery, setSelectedRepForDelivery] = useState<IFollowUp["rep"] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotals, setOrderTotals] = useState({ totalCases: 0, totalPrice: 0, discount: 0, finalTotal: 0, discountType: "flat" as "flat" | "percent", discountValue: 0, note: "" });
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  const { data, isLoading } = useGetRepFollowupsQuery({ repId: user?.id || "" }, { skip: !user?.id });
  const overdue: IFollowUp[] = data?.overdue || [];
  const dueToday: IFollowUp[] = data?.dueToday || [];
  const upcoming: IFollowUp[] = data?.upcoming || [];
  const total = data?.total ?? 0;

  const openReschedule = (f: IFollowUp) => setActionModal({ open: true, mode: "reschedule", followup: f });
  const openResolve = (f: IFollowUp) => setActionModal({ open: true, mode: "resolve", followup: f });

  const handleDelivery = (f: IFollowUp) => {
    setSelectedStoreForDelivery(f.store);
    setSelectedRepForDelivery(f.rep);
    setDeliveryModalOpen(true);
  };

  const onOrderFormChange = useCallback((items: any[], totals: any) => {
    setOrderItems(items);
    setOrderTotals((prev) => ({ ...prev, ...totals }));
  }, []);

  const handleNewOrder = (f: IFollowUp) => {
    setEditingOrder({ storeId: f.store?._id || "", store: f.store, repId: user?.id || "", deliveryDate: new Date().toISOString().split("T")[0], items: [], note: "", discountType: "flat", discountValue: 0, subtotal: 0, total: 0 });
    setOrderItems([]);
    setOrderTotals({ totalCases: 0, totalPrice: 0, discount: 0, finalTotal: 0, discountType: "flat", discountValue: 0, note: "" });
    setModalOpen(true);
  };

  const handleCreateOrder = async (values: any) => {
    try {
      await createOrder({ ...values, items: orderItems, subtotal: orderTotals.totalPrice, discountType: orderTotals.discountType, discountValue: orderTotals.discountValue, total: orderTotals.finalTotal, note: orderTotals.note }).unwrap();
      toast.success("Order created successfully");
      setModalOpen(false);
    } catch { toast.error("Error saving order"); }
  };

  const orderFields: Field[] = [
    { name: "storeId", label: "Store", render: (_v, _o, initialData) => (<div className="p-2 border rounded-xs bg-muted"><p className="font-semibold">{initialData?.store?.name}</p><p className="text-sm text-muted-foreground">{initialData?.store?.address}</p></div>) },
    { name: "repId", label: "Rep", render: () => (<div className="p-2 border rounded-xs bg-muted"><p className="font-semibold">{user?.name}</p></div>) },
    {
      name: "deliveryDate", label: "Delivery Date",
      render: (value, onChange) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xs", !value && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(toLocalDate(value) as Date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xs">
            <Calendar mode="single" selected={value ? toLocalDate(value) || undefined : undefined}
              onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus className="rounded-xs" />
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-muted-foreground">Loading follow-ups...</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-6 w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Follow Ups</h1>
        </div>
        {total > 0 && <Badge variant="secondary" className="rounded-xs text-sm px-2">{total} open</Badge>}
      </div>

      {total === 0 ? (
        <Card className="p-10 rounded-xs text-center border-border">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-medium text-foreground">All caught up!</p>
            <p className="text-sm">No open follow-ups right now.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div className="space-y-3">
              <SectionHeader label="Overdue" count={overdue.length} color="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" />
              {overdue.map((f) => <FollowUpCard key={f._id} followup={f} onReschedule={openReschedule} onResolve={openResolve} onDelivery={handleDelivery} onNewOrder={handleNewOrder} />)}
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="space-y-3">
              <SectionHeader label="Due Today" count={dueToday.length} color="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" />
              {dueToday.map((f) => <FollowUpCard key={f._id} followup={f} onReschedule={openReschedule} onResolve={openResolve} onDelivery={handleDelivery} onNewOrder={handleNewOrder} />)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <SectionHeader label="Upcoming" count={upcoming.length} color="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" />
              {upcoming.map((f) => <FollowUpCard key={f._id} followup={f} onReschedule={openReschedule} onResolve={openResolve} onDelivery={handleDelivery} onNewOrder={handleNewOrder} />)}
            </div>
          )}
        </div>
      )}

      <ActionModal open={actionModal.open} mode={actionModal.mode} followup={actionModal.followup} onClose={() => setActionModal((s) => ({ ...s, open: false }))} />
      <DeliveryModal open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} store={selectedStoreForDelivery} rep={selectedRepForDelivery} />
      <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreateOrder} title="Create Order" fields={orderFields}
        initialData={editingOrder} isSubmitting={creating} initialItems={editingOrder?.items || []}
        initialDiscountType={editingOrder?.discountType || "flat"} initialDiscountValue={editingOrder?.discountValue ?? editingOrder?.discount}
        initialNote={editingOrder?.note || ""} onOrderFormChange={onOrderFormChange} />
    </div>
  );
};

export default FollowUps;
