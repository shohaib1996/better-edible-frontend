"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Search, CalendarIcon } from "lucide-react";
import { useDebounced } from "@/redux/hooks/hooks";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreatePromotionMutation, useUpdatePromotionMutation } from "@/redux/api/Promotions/promotionsApi";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import type { IPromotion } from "@/types/promotions/promotions";
import { emptyForm } from "@/utils/promotionHelpers";

interface Props {
  editing: IPromotion | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function PromotionForm({ editing, onCancel, onSaved }: Props) {
  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name,
          code: editing.code ?? "",
          description: editing.description ?? "",
          type: editing.type,
          value: String(editing.value),
          minOrderAmount: editing.minOrderAmount != null ? String(editing.minOrderAmount) : "",
          maxUses: editing.maxUses != null ? String(editing.maxUses) : "",
          maxUsesPerStore: editing.maxUsesPerStore != null ? String(editing.maxUsesPerStore) : "",
          startDate: editing.startDate ? editing.startDate.slice(0, 10) : "",
          endDate: editing.endDate ? editing.endDate.slice(0, 10) : "",
          status: editing.status,
          isPublic: editing.isPublic,
          autoApply: editing.autoApply,
        }
      : emptyForm
  );

  const [startDate, setStartDate] = useState<Date | undefined>(
    editing?.startDate ? parseISO(editing.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editing?.endDate ? parseISO(editing.endDate) : undefined
  );
  const [targetStoreIds, setTargetStoreIds] = useState<string[]>(editing?.storeIds ?? []);
  const [storeSearch, setStoreSearch] = useState("");
  const debouncedSearch = useDebounced({ searchQuery: storeSearch, delay: 400 });

  const { data: clientsData } = useGetAllPrivateLabelClientsQuery({ search: debouncedSearch, limit: 10 });
  const filteredStores: { _id: string; name: string }[] = (clientsData?.clients ?? []).map((c) => ({
    _id: c.store._id,
    name: c.store.name,
  }));

  // Cache store names so chips still show names when a store scrolls out of search results
  const [storeNamesMap, setStoreNamesMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (filteredStores.length > 0) {
      setStoreNamesMap((prev) => {
        const next = { ...prev };
        filteredStores.forEach((s) => { next[s._id] = s.name; });
        return next;
      });
    }
  }, [filteredStores]);

  const [create, { isLoading: creating }] = useCreatePromotionMutation();
  const [update, { isLoading: updating }] = useUpdatePromotionMutation();
  const saving = creating || updating;

  function set(key: keyof typeof emptyForm, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStore(storeId: string) {
    setTargetStoreIds((prev) => {
      const next = prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId];
      // Auto-manage isPublic: uncheck when stores are targeted, restore when cleared
      if (next.length > 0) set("isPublic", false);
      else set("isPublic", true);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(form.value);
    if (isNaN(value) || value <= 0) { toast.error("Value must be greater than 0"); return; }
    if (form.type === "percentage" && value > 100) { toast.error("Percentage cannot exceed 100"); return; }

    const payload: Partial<IPromotion> = {
      name: form.name,
      code: form.code || undefined,
      description: form.description || undefined,
      type: form.type,
      value,
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
      maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
      maxUsesPerStore: form.maxUsesPerStore ? parseInt(form.maxUsesPerStore) : undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      status: form.status,
      isPublic: form.isPublic,
      autoApply: form.autoApply,
      storeIds: targetStoreIds,
    };

    try {
      if (editing) {
        await update({ id: editing._id, ...payload }).unwrap();
        toast.success("Promotion updated");
      } else {
        await create(payload).unwrap();
        toast.success("Promotion created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save");
    }
  }

  const inputCls = "rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="rounded-xs border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">{editing ? "Edit Promotion" : "New Promotion"}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Promotion Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required
            placeholder="e.g. Summer Sale" className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Promo Code</label>
          <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER20 (leave blank if no code needed)"
            className={`${inputCls} font-mono`} />
          <p className="text-xs text-muted-foreground">Leave blank for threshold-only / auto-apply promos</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Discount Type *</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)} required className={inputCls}>
            <option value="flat">Flat amount ($)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">
            {form.type === "flat" ? "Discount Amount ($) *" : "Discount Percentage (%) *"}
          </label>
          <input
            type="number"
            min={form.type === "flat" ? 0.01 : 1}
            step={form.type === "flat" ? 0.01 : 1}
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            required
            placeholder={form.type === "flat" ? "e.g. 50" : "e.g. 10"}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Min Order Amount ($)</label>
          <input type="number" min={0} step={0.01} value={form.minOrderAmount}
            onChange={(e) => set("minOrderAmount", e.target.value)}
            placeholder="e.g. 500 (optional)" className={inputCls} />
          <p className="text-xs text-muted-foreground">Order must be at least this amount to qualify</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Max Total Uses</label>
          <input type="number" min={1} step={1} value={form.maxUses}
            onChange={(e) => set("maxUses", e.target.value)}
            placeholder="Leave blank for unlimited" className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Max Uses Per Store</label>
          <input type="number" min={1} step={1} value={form.maxUsesPerStore}
            onChange={(e) => set("maxUsesPerStore", e.target.value)}
            placeholder="Leave blank for unlimited" className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value as IPromotion["status"])} className={inputCls}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start font-normal rounded-xs", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xs" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  setStartDate(d);
                  if (endDate && d && d > endDate) setEndDate(undefined);
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start font-normal rounded-xs", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick an end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xs" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(d) => !!startDate && d < startDate}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Optional description shown to stores"
            rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* ── Target stores ── */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Target Stores</label>
            {targetStoreIds.length > 0 && (
              <button
                type="button"
                onClick={() => { setTargetStoreIds([]); set("isPublic", true); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Selected store chips */}
          {targetStoreIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {targetStoreIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-xs bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-700 px-2 py-0.5 text-xs font-medium"
                  >
                    {storeNamesMap[id] ?? id}
                    <button type="button" onClick={() => toggleStore(id)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
              ))}
            </div>
          )}

          {/* Store search + list */}
          <div className="rounded-xs border border-input bg-background">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-input">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Search stores…"
                className="flex-1 text-xs bg-transparent focus:outline-none"
              />
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-border">
              {filteredStores.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">No stores found</p>
              ) : (
                filteredStores.map((store) => {
                  const checked = targetStoreIds.includes(store._id);
                  return (
                    <label
                      key={store._id}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStore(store._id)}
                        className="rounded-xs shrink-0"
                      />
                      <span className="text-xs truncate">{store.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {targetStoreIds.length === 0
              ? "Leave empty to make this promotion available to all stores."
              : `Only ${targetStoreIds.length} selected store${targetStoreIds.length > 1 ? "s" : ""} will see and can use this promotion.`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isPublic} onChange={(e) => set("isPublic", e.target.checked)} className="rounded-xs" />
              Visible to stores
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.autoApply} onChange={(e) => set("autoApply", e.target.checked)} className="rounded-xs" />
              Auto-apply when threshold met (no code needed)
            </label>
          </div>
          {targetStoreIds.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xs px-3 py-1.5">
              ⚠ "Visible to stores" is automatically unchecked — this promotion will only be visible to the {targetStoreIds.length} targeted store{targetStoreIds.length > 1 ? "s" : ""}.
            </p>
          )}
        </div>

        <div className="flex gap-2 sm:col-span-2 pt-1">
          <Button type="button" variant="outline" size="sm" className="rounded-xs" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" className="rounded-xs" disabled={saving}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {editing ? "Save Changes" : "Create Promotion"}
          </Button>
        </div>
      </form>
    </div>
  );
}
