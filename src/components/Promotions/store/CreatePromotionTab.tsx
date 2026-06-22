"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetAllProductsQuery } from "@/redux/api/Products/productsApi";
import { useCreateCustomPromotionMutation } from "@/redux/api/Promotions/promotionsApi";

interface Props {
  storeId: string;
}

const emptyForm = {
  name: "",
  productId: "",
  productName: "",
  creditRatePerUnit: "",
  startDate: "",
  endDate: "",
};

export default function CreatePromotionTab({ storeId }: Props) {
  const [form, setForm] = useState(emptyForm);

  const { data: productsData } = useGetAllProductsQuery(undefined);
  const [createCustomPromotion, { isLoading }] = useCreateCustomPromotionMutation();

  const products: any[] = productsData?.products ?? productsData ?? [];

  function set(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleProductChange(productId: string) {
    const product = products.find((p: any) => p._id === productId);
    set("productId", productId);
    set("productName", product?.name ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(form.creditRatePerUnit);
    if (!form.productId) { toast.error("Select a product"); return; }
    if (isNaN(rate) || rate <= 0) { toast.error("Credit rate must be greater than 0"); return; }
    if (!form.startDate || !form.endDate) { toast.error("Start and end dates are required"); return; }
    if (form.endDate <= form.startDate) { toast.error("End date must be after start date"); return; }

    try {
      await createCustomPromotion({
        storeId,
        name: form.name || form.productName,
        productId: form.productId,
        productName: form.productName,
        creditRatePerUnit: rate,
        startDate: form.startDate,
        endDate: form.endDate,
      }).unwrap();
      toast.success("Promotion created");
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create promotion");
    }
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Product <span className="text-destructive">*</span></label>
          <select
            value={form.productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
            required
          >
            <option value="">Select a branded product…</option>
            {products.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Promotion Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Summer Gummy Sale"
            className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Leave blank to use the product name</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Start Date <span className="text-destructive">*</span></label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">End Date <span className="text-destructive">*</span></label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => set("endDate", e.target.value)}
              className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Credits Per Unit Sold ($) <span className="text-destructive">*</span></label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={form.creditRatePerUnit}
            onChange={(e) => set("creditRatePerUnit", e.target.value)}
            placeholder="e.g. 0.50"
            className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
            required
          />
          <p className="text-xs text-muted-foreground">Amount credited to your account for each unit sold during this promotion</p>
        </div>

        <Button type="submit" className="rounded-xs w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Submit Promotion
        </Button>
      </form>
    </div>
  );
}
