"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, FlaskConical, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { useGetColorsQuery } from "@/redux/api/color/colorsApi";
import {
  useSetFlavorColorMutation,
  useEditFlavorColorMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { getPPSUser } from "@/lib/ppsUser";
import type { ICookItem, IFlavorAmount, IColorAmount } from "@/types/privateLabel/pps";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlavorRow {
  flavorId: string;
  amountGrams: string;
}

interface ColorRow {
  colorId: string;
  amountGrams: string;
}

interface FlavorColorModalProps {
  open: boolean;
  onClose: () => void;
  cookItem: ICookItem;
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlavorColorModal({
  open,
  onClose,
  cookItem,
  compact,
}: FlavorColorModalProps) {
  const isEdit = (cookItem.flavorIds?.length ?? 0) > 0;

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: flavorsData } = useGetFlavorsQuery({ isActive: true });
  const { data: colorsData } = useGetColorsQuery({ isActive: true });
  const activeFlavors = flavorsData?.flavors ?? [];
  const activeColors = colorsData?.colors ?? [];

  const [setFlavorColor, { isLoading: isSetting }] = useSetFlavorColorMutation();
  const [editFlavorColor, { isLoading: isEditing }] = useEditFlavorColorMutation();
  const isLoading = isSetting || isEditing;

  // ── Local state ───────────────────────────────────────────────────────────
  const [flavorRows, setFlavorRows] = useState<FlavorRow[]>([]);
  const [colorRows, setColorRows] = useState<ColorRow[]>([]);
  const [editNote, setEditNote] = useState("");

  // Pre-fill when editing
  useEffect(() => {
    if (!open) return;
    if (isEdit && cookItem.flavorAmounts?.length) {
      setFlavorRows(
        cookItem.flavorAmounts.map((fa) => ({
          flavorId: fa.flavorId,
          amountGrams: String(fa.amountGrams),
        }))
      );
      setColorRows(
        (cookItem.colorAmounts ?? []).map((ca) => ({
          colorId: ca.colorId,
          amountGrams: String(ca.amountGrams),
        }))
      );
    } else {
      setFlavorRows([{ flavorId: "", amountGrams: "" }]);
      setColorRows([]);
    }
    setEditNote("");
  }, [open]);

  // ── Flavor rows ──────────────────────────────────────────────────────────
  const setFlavorRow = (i: number, patch: Partial<FlavorRow>) =>
    setFlavorRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addFlavorRow = () =>
    setFlavorRows((prev) => [...prev, { flavorId: "", amountGrams: "" }]);

  const removeFlavorRow = (i: number) =>
    setFlavorRows((prev) => prev.filter((_, idx) => idx !== i));

  // ── Color rows ────────────────────────────────────────────────────────────
  const setColorRow = (i: number, patch: Partial<ColorRow>) =>
    setColorRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addColorRow = () =>
    setColorRows((prev) => [...prev, { colorId: "", amountGrams: "" }]);

  const removeColorRow = (i: number) =>
    setColorRows((prev) => prev.filter((_, idx) => idx !== i));

  // ── Validation ────────────────────────────────────────────────────────────
  const canSave =
    flavorRows.some((r) => r.flavorId && r.amountGrams !== "") &&
    flavorRows.every((r) => !r.flavorId || (r.flavorId && r.amountGrams !== "")) &&
    colorRows.every((r) => !r.colorId || (r.colorId && r.amountGrams !== ""));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validFlavorRows = flavorRows.filter((r) => r.flavorId && r.amountGrams !== "");

    const flavorAmounts: IFlavorAmount[] = validFlavorRows.map((r) => ({
      flavorId: r.flavorId,
      amountGrams: Number(r.amountGrams),
    }));

    const colorAmounts: IColorAmount[] = colorRows
      .filter((r) => r.colorId && r.amountGrams !== "")
      .map((r) => ({ colorId: r.colorId, amountGrams: Number(r.amountGrams) }));

    try {
      if (isEdit) {
        await editFlavorColor({
          cookItemId: cookItem.cookItemId,
          flavorAmounts,
          colorAmounts,
          note: editNote.trim() || undefined,
          performedBy: getPPSUser(),
        }).unwrap();
        toast.success("Flavor & color updated");
      } else {
        await setFlavorColor({
          cookItemId: cookItem.cookItemId,
          flavorAmounts,
          colorAmounts,
          performedBy: getPPSUser(),
        }).unwrap();
        toast.success("Flavor & color saved");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const c = compact;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-xs max-w-lg p-0 gap-0 overflow-hidden bg-card border shadow-xl">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b bg-card">
          <DialogTitle className={c ? "text-base font-semibold" : "text-lg font-semibold"}>
            {isEdit ? "Edit" : "Add"} Flavor & Color
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{cookItem.flavor}</p>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">

          {/* ── Flavor section ──────────────────────────────────────────── */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm font-semibold text-foreground">Flavors</p>
            </div>

            <div className="space-y-2">
              {flavorRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select
                    value={row.flavorId}
                    onValueChange={(v) => {
                      const def = activeFlavors.find((f) => f.flavorId === v)?.defaultAmount;
                      setFlavorRow(i, {
                        flavorId: v,
                        ...(row.amountGrams === "" && def !== undefined && { amountGrams: String(def) }),
                      });
                    }}
                  >
                    <SelectTrigger className="flex-1 rounded-xs h-9 text-sm w-0 bg-input border-primary">
                      <SelectValue placeholder="Select flavor…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xs">
                      {activeFlavors.map((f) => (
                        <SelectItem key={f.flavorId} value={f.flavorId} className="rounded-xs">
                          {f.name}{f.isBlend ? " (blend)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative w-24 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      value={row.amountGrams}
                      onChange={(e) => setFlavorRow(i, { amountGrams: e.target.value })}
                      placeholder="0"
                      className="rounded-xs h-9 pr-6 text-right"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">g</span>
                  </div>

                  {flavorRows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeFlavorRow(i)}
                      className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFlavorRow}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another flavor
            </button>

          </div>

          {/* ── Divider ─────────────────────────────────────────────────── */}
          <div className="border-t" />

          {/* ── Color section ──────────────────────────────────────────── */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500 shrink-0" />
              <p className="text-sm font-semibold text-foreground">Colors</p>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>

            {colorRows.length === 0 ? (
              <button
                type="button"
                onClick={addColorRow}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add a color
              </button>
            ) : (
              <div className="space-y-2">
                {colorRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={row.colorId}
                      onValueChange={(v) => {
                        const def = activeColors.find((c) => c.colorId === v)?.defaultAmount;
                        setColorRow(i, {
                          colorId: v,
                          ...(row.amountGrams === "" && def !== undefined && { amountGrams: String(def) }),
                        });
                      }}
                    >
                      <SelectTrigger className="flex-1 rounded-xs h-9 text-sm w-0 bg-input border-primary">
                        <SelectValue placeholder="Select color…" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xs">
                        {activeColors.map((col) => (
                          <SelectItem key={col.colorId} value={col.colorId} className="rounded-xs">
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative w-24 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        value={row.amountGrams}
                        onChange={(e) => setColorRow(i, { amountGrams: e.target.value })}
                        placeholder="0"
                        className="rounded-xs h-9 pr-6 text-right"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">g</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeColorRow(i)}
                      className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColorRow}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another color
                </button>
              </div>
            )}
          </div>

          {/* ── Edit note ─────────────────────────────────────────────── */}
          {isEdit && (
            <>
              <div className="border-t" />
              <div className="px-5 py-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Reason for edit (optional)</Label>
                <Input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. corrected amount"
                  className="rounded-xs"
                />
              </div>
            </>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-5 py-4 border-t bg-card">
          <Button
            className="flex-1 rounded-xs"
            onClick={handleSave}
            disabled={isLoading || !canSave}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEdit ? "Save Changes" : "Save"}
          </Button>
          <Button
            variant="outline"
            className="rounded-xs"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
