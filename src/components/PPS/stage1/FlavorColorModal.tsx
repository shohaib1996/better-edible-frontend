"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2, FlaskConical, Palette, ChevronsUpDown, Check, Search } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { useGetColorsQuery } from "@/redux/api/color/colorsApi";
import {
  useSetFlavorColorMutation,
  useEditFlavorColorMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { getPPSUser } from "@/lib/ppsUser";
import type { ICookItem, IFlavorAmount, IColorAmount } from "@/types/privateLabel/pps";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlavorRow { flavorId: string; amountGrams: string; }
interface ColorRow  { colorId: string;  amountGrams: string; }

interface FlavorColorModalProps {
  open: boolean;
  onClose: () => void;
  cookItem: ICookItem;
  compact?: boolean;
}

// ─── Searchable Combobox ──────────────────────────────────────────────────────

interface ComboboxOption { value: string; label: string; sub?: string; }

function SearchableCombobox({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: ComboboxOption[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setTimeout(() => inputRef.current?.focus(), 50); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center justify-between gap-1 h-9 px-3 rounded-xs border border-primary bg-input text-sm text-left truncate hover:bg-input/80 transition-colors"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 rounded-xs w-(--radix-popover-trigger-width)"
        align="start"
        side="bottom"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Options list */}
        <div className="max-h-48 overflow-y-auto scrollbar-hidden">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No results</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                  value === o.value && "bg-muted"
                )}
              >
                <span className="truncate">{o.label}</span>
                {value === o.value && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlavorColorModal({
  open,
  onClose,
  cookItem,
  compact,
}: FlavorColorModalProps) {
  const isEdit = (cookItem.flavorIds?.length ?? 0) > 0;

  const { data: flavorsData } = useGetFlavorsQuery({ isActive: true });
  const { data: colorsData } = useGetColorsQuery({ isActive: true });
  const activeFlavors = flavorsData?.flavors ?? [];
  const activeColors = colorsData?.colors ?? [];

  const [setFlavorColor, { isLoading: isSetting }] = useSetFlavorColorMutation();
  const [editFlavorColor, { isLoading: isEditing }] = useEditFlavorColorMutation();
  const isLoading = isSetting || isEditing;

  const [flavorRows, setFlavorRows] = useState<FlavorRow[]>([]);
  const [colorRows, setColorRows] = useState<ColorRow[]>([]);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit && cookItem.flavorAmounts?.length) {
      setFlavorRows(cookItem.flavorAmounts.map((fa) => ({ flavorId: fa.flavorId, amountGrams: String(fa.amountGrams) })));
      setColorRows((cookItem.colorAmounts ?? []).map((ca) => ({ colorId: ca.colorId, amountGrams: String(ca.amountGrams) })));
    } else {
      setFlavorRows([{ flavorId: "", amountGrams: "" }]);
      setColorRows([]);
    }
    setEditNote("");
  }, [open]);

  const setFlavorRow = (i: number, patch: Partial<FlavorRow>) =>
    setFlavorRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addFlavorRow = () =>
    setFlavorRows((prev) => [...prev, { flavorId: "", amountGrams: "" }]);

  const removeFlavorRow = (i: number) =>
    setFlavorRows((prev) => prev.filter((_, idx) => idx !== i));

  const setColorRow = (i: number, patch: Partial<ColorRow>) =>
    setColorRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addColorRow = () =>
    setColorRows((prev) => [...prev, { colorId: "", amountGrams: "" }]);

  const removeColorRow = (i: number) =>
    setColorRows((prev) => prev.filter((_, idx) => idx !== i));

  const canSave =
    flavorRows.some((r) => r.flavorId && r.amountGrams !== "") &&
    flavorRows.every((r) => !r.flavorId || (r.flavorId && r.amountGrams !== "")) &&
    colorRows.every((r) => !r.colorId || (r.colorId && r.amountGrams !== ""));

  const handleSave = async () => {
    const flavorAmounts: IFlavorAmount[] = flavorRows
      .filter((r) => r.flavorId && r.amountGrams !== "")
      .map((r) => ({ flavorId: r.flavorId, amountGrams: Number(r.amountGrams) }));

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

  // Build option lists
  const flavorOptions: ComboboxOption[] = activeFlavors.map((f) => ({
    value: f.flavorId,
    label: f.name + (f.isBlend ? " (blend)" : ""),
  }));

  const colorOptions: ComboboxOption[] = activeColors.map((c) => ({
    value: c.colorId,
    label: c.name,
  }));

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

        <div className="max-h-[60vh] overflow-y-auto scrollbar-hidden">

          {/* ── Flavor section ──────────────────────────────────────── */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm font-semibold text-foreground">Flavors</p>
            </div>

            <div className="space-y-2">
              {flavorRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <SearchableCombobox
                    value={row.flavorId}
                    options={flavorOptions}
                    placeholder="Select flavor…"
                    onChange={(v) => {
                      const def = activeFlavors.find((f) => f.flavorId === v)?.defaultAmount;
                      setFlavorRow(i, {
                        flavorId: v,
                        ...(row.amountGrams === "" && def !== undefined && { amountGrams: String(def) }),
                      });
                    }}
                  />

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

          {/* ── Divider ─────────────────────────────────────────────── */}
          <div className="border-t" />

          {/* ── Color section ───────────────────────────────────────── */}
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
                    <SearchableCombobox
                      value={row.colorId}
                      options={colorOptions}
                      placeholder="Select color…"
                      onChange={(v) => {
                        const def = activeColors.find((col) => col.colorId === v)?.defaultAmount;
                        setColorRow(i, {
                          colorId: v,
                          ...(row.amountGrams === "" && def !== undefined && { amountGrams: String(def) }),
                        });
                      }}
                    />

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

          {/* ── Edit note ───────────────────────────────────────────── */}
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

        {/* ── Actions ─────────────────────────────────────────────────── */}
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
