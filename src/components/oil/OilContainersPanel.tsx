"use client";

import { useState } from "react";
import { Plus, RefreshCw, Trash2, Loader2, AlertCircle, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetOilContainersQuery,
  useCreateOilContainerMutation,
  useRefillOilContainerMutation,
  useCleanOilContainerMutation,
} from "@/redux/api/oil/oilApi";
import type { IOilContainer, CannabisType } from "@/types/privateLabel/pps";

// ─── Status badge ────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  empty: "bg-gray-100 text-gray-600 border-gray-200",
  cleaning: "bg-amber-100 text-amber-800 border-amber-200",
};

// ─── New Batch Dialog ────────────────────────────────────
function NewBatchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    containerId: "",
    name: "",
    cannabisType: "BioMax" as CannabisType,
    potency: "",
    totalAmount: "",
  });

  const [createContainer, { isLoading }] = useCreateOilContainerMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContainer({
        containerId: form.containerId.trim(),
        name: form.name.trim(),
        cannabisType: form.cannabisType,
        potency: Number(form.potency),
        totalAmount: Number(form.totalAmount),
      }).unwrap();
      toast.success("Container created");
      setForm({ containerId: "", name: "", cannabisType: "BioMax", potency: "", totalAmount: "" });
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create container");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xs">
        <DialogHeader>
          <DialogTitle>New Batch — Create Container</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Container ID</Label>
            <Input
              placeholder="e.g. OIL-001"
              value={form.containerId}
              onChange={(e) => setForm((f) => ({ ...f, containerId: e.target.value }))}
              required
              className="rounded-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Display Name</Label>
            <Input
              placeholder="e.g. BioMax Batch #12"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="rounded-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cannabis Type</Label>
            <div className="flex gap-2">
              {(["BioMax", "Rosin"] as CannabisType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cannabisType: type }))}
                  className={`flex-1 py-2 rounded-xs border text-sm font-medium transition-colors ${
                    form.cannabisType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Potency (%)</Label>
              <Input
                type="number"
                placeholder="e.g. 85"
                min={0.1}
                max={100}
                step={0.1}
                value={form.potency}
                onChange={(e) => setForm((f) => ({ ...f, potency: e.target.value }))}
                required
                className="rounded-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Total Amount (g)</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                min={0.1}
                step={0.1}
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                required
                className="rounded-xs"
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="rounded-xs mt-1">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Container
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Refill Dialog ───────────────────────────────────────
function RefillDialog({
  container,
  onClose,
}: {
  container: IOilContainer | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [refill, { isLoading }] = useRefillOilContainerMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!container) return;
    try {
      await refill({ containerId: container.containerId, amount: Number(amount) }).unwrap();
      toast.success(`Refilled ${container.name} with ${amount}g`);
      setAmount("");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Refill failed");
    }
  };

  return (
    <Dialog open={!!container} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-xs">
        <DialogHeader>
          <DialogTitle>Refill — {container?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Amount to add (g)</Label>
            <Input
              type="number"
              placeholder="e.g. 200"
              min={0.1}
              step={0.1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-xs"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="rounded-xs">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm Refill
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Clean Dialog ────────────────────────────────────────
function CleanDialog({
  container,
  onClose,
}: {
  container: IOilContainer | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [clean, { isLoading }] = useCleanOilContainerMutation();

  const handleConfirm = async () => {
    if (!container) return;
    try {
      await clean({ containerId: container.containerId, notes: notes || undefined }).unwrap();
      toast.success(`${container.name} cleaned — ${container.remainingAmount}g logged as waste`);
      setNotes("");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Clean failed");
    }
  };

  return (
    <Dialog open={!!container} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-xs">
        <DialogHeader>
          <DialogTitle>Clean Container — {container?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="rounded-xs border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            This will zero out the remaining balance ({container?.remainingAmount}g) and log it as waste. This cannot be undone.
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="e.g. End of batch clean"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 rounded-xs"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Zero Out & Log Waste
            </Button>
            <Button variant="outline" onClick={onClose} className="rounded-xs">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Panel ──────────────────────────────────────────
export default function OilContainersPanel() {
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [refillTarget, setRefillTarget] = useState<IOilContainer | null>(null);
  const [cleanTarget, setCleanTarget] = useState<IOilContainer | null>(null);

  const { data, isLoading, isError } = useGetOilContainersQuery();
  const containers = data?.containers ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /><span>Loading containers…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive py-12 justify-center">
        <AlertCircle className="w-5 h-5" /><span>Failed to load containers.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {containers.length} container{containers.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setShowNewBatch(true)}
            className="gap-1.5 rounded-xs"
          >
            <Plus className="w-4 h-4" />
            New Batch
          </Button>
        </div>

        {/* Empty state */}
        {containers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <FlaskConical className="w-10 h-10 opacity-40" />
            <p className="text-sm">No containers yet. Create one to get started.</p>
          </div>
        )}

        {/* Container cards */}
        {containers.map((container: IOilContainer) => {
          const pct = container.totalAmount > 0
            ? Math.round((container.remainingAmount / container.totalAmount) * 100)
            : 0;

          return (
            <div key={container.containerId} className="rounded-xs border bg-card flex flex-col gap-0">
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold leading-tight">{container.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{container.containerId}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[container.status]}`}>
                    {container.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {container.cannabisType}
                  </Badge>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
                {([
                  ["Remaining", `${container.remainingAmount}g`, pct < 20 ? "text-destructive" : "text-green-600"],
                  ["Total", `${container.totalAmount}g`, ""],
                  ["Balance", `${pct}%`, pct < 20 ? "text-destructive" : ""],
                ] as const).map(([label, value, color]) => (
                  <div key={label} className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mx-5 mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct < 20 ? "bg-destructive" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-5 py-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRefillTarget(container)}
                  disabled={container.status === "cleaning"}
                  className="gap-1.5 rounded-xs text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refill
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCleanTarget(container)}
                  disabled={container.status === "cleaning" || container.remainingAmount === 0}
                  className="gap-1.5 rounded-xs text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clean / Zero Out
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <NewBatchDialog open={showNewBatch} onClose={() => setShowNewBatch(false)} />
      <RefillDialog container={refillTarget} onClose={() => setRefillTarget(null)} />
      <CleanDialog container={cleanTarget} onClose={() => setCleanTarget(null)} />
    </>
  );
}
