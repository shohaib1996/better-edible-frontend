"use client";

import { useState } from "react";
import { Plus, Loader2, AlertCircle, Trash2 } from "lucide-react";
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
import { useGetWasteLogsQuery, useCreateWasteLogMutation, useGetOilContainersQuery } from "@/redux/api/oil/oilApi";
import type { IWasteLog, CannabisType, WasteReason } from "@/types/privateLabel/pps";

const REASON_LABELS: Record<WasteReason, string> = {
  cleaning: "Cleaning",
  spillage: "Spillage",
  other: "Other",
};

const REASON_COLORS: Record<WasteReason, string> = {
  cleaning: "bg-amber-100 text-amber-800 border-amber-200",
  spillage: "bg-red-100 text-red-700 border-red-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Manual Entry Dialog ─────────────────────────────────
function ManualWasteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    material: "BioMax" as CannabisType,
    amount: "",
    reason: "spillage" as WasteReason,
    sourceContainerId: "",
    notes: "",
  });

  const { data: containersData } = useGetOilContainersQuery();
  const containers = containersData?.containers ?? [];
  const [createWasteLog, { isLoading }] = useCreateWasteLogMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWasteLog({
        date: new Date(form.date).toISOString(),
        material: form.material,
        amount: Number(form.amount),
        reason: form.reason,
        sourceContainerId: form.sourceContainerId,
        notes: form.notes || undefined,
      }).unwrap();
      toast.success("Waste entry logged");
      setForm({ date: new Date().toISOString().slice(0, 10), material: "BioMax", amount: "", reason: "spillage", sourceContainerId: "", notes: "" });
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to log waste");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xs">
        <DialogHeader>
          <DialogTitle>Manual Waste Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className="rounded-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Amount (g)</Label>
              <Input
                type="number"
                placeholder="e.g. 12.5"
                min={0.01}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                className="rounded-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Material</Label>
            <div className="flex gap-2">
              {(["BioMax", "Rosin"] as CannabisType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, material: type }))}
                  className={`flex-1 py-2 rounded-xs border text-sm font-medium transition-colors ${
                    form.material === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <div className="flex gap-2">
              {(["spillage", "cleaning", "other"] as WasteReason[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, reason: r }))}
                  className={`flex-1 py-2 rounded-xs border text-sm font-medium transition-colors ${
                    form.reason === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {REASON_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Source Container</Label>
            <select
              value={form.sourceContainerId}
              onChange={(e) => setForm((f) => ({ ...f, sourceContainerId: e.target.value }))}
              required
              className="flex h-9 w-full rounded-xs border border-input bg-background px-3 py-1 text-sm shadow-xs"
            >
              <option value="">Select container…</option>
              {containers.map((c) => (
                <option key={c.containerId} value={c.containerId}>
                  {c.name} ({c.containerId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="e.g. Dropped during transfer"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="rounded-xs"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="rounded-xs mt-1">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Log Waste Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Panel ──────────────────────────────────────────
export default function WasteLogPanel() {
  const [showManual, setShowManual] = useState(false);

  const { data, isLoading, isError } = useGetWasteLogsQuery();
  const wasteLogs = data?.wasteLogs ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /><span>Loading waste log…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive py-12 justify-center">
        <AlertCircle className="w-5 h-5" /><span>Failed to load waste log.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {wasteLogs.length} entr{wasteLogs.length !== 1 ? "ies" : "y"}
          </p>
          <Button
            size="sm"
            onClick={() => setShowManual(true)}
            className="gap-1.5 rounded-xs"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </Button>
        </div>

        {/* Empty state */}
        {wasteLogs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Trash2 className="w-10 h-10 opacity-40" />
            <p className="text-sm">No waste entries yet.</p>
          </div>
        )}

        {/* Log entries */}
        {wasteLogs.map((entry: IWasteLog) => (
          <div key={entry._id} className="rounded-xs border bg-card px-5 py-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-base font-semibold">
                  {entry.amount}g — {entry.material}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {entry.sourceContainerId}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-xs ${REASON_COLORS[entry.reason]}`}>
                  {REASON_LABELS[entry.reason]}
                </Badge>
                {entry.isAutomatic && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Auto
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(entry.date).toLocaleDateString()}</span>
              {entry.notes && <span className="italic">{entry.notes}</span>}
              <span>by {entry.loggedBy.userName}</span>
            </div>
          </div>
        ))}
      </div>

      <ManualWasteDialog open={showManual} onClose={() => setShowManual(false)} />
    </>
  );
}
