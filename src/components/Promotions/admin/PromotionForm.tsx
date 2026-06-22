"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCreatePromotionMutation, useUpdatePromotionMutation } from "@/redux/api/Promotions/promotionsApi";
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

  const [create, { isLoading: creating }] = useCreatePromotionMutation();
  const [update, { isLoading: updating }] = useUpdatePromotionMutation();
  const saving = creating || updating;

  function set(key: keyof typeof emptyForm, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
      isPublic: form.isPublic,
      autoApply: form.autoApply,
      storeIds: [],
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
          <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">End Date</label>
          <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Optional description shown to stores"
            rows={2} className={`${inputCls} resize-none`} />
        </div>

        <div className="flex items-center gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => set("isPublic", e.target.checked)} className="rounded-xs" />
            Visible to stores
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.autoApply} onChange={(e) => set("autoApply", e.target.checked)} className="rounded-xs" />
            Auto-apply when threshold met (no code needed)
          </label>
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
