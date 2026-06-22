"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLogPromotionSalesMutation } from "@/redux/api/Promotions/promotionsApi";
import type { IStorePromotion } from "@/types/promotions/promotions";

interface Props {
  storeId: string;
  storePromotion: IStorePromotion;
  creditRatePerUnit: number;
  onDone: () => void;
  onCancel: () => void;
}

export default function SalesLogForm({ storeId, storePromotion, creditRatePerUnit, onDone, onCancel }: Props) {
  const [unitsSold, setUnitsSold] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [logSales, { isLoading }] = useLogPromotionSalesMutation();

  const units = parseInt(unitsSold) || 0;
  const preview = parseFloat((units * creditRatePerUnit).toFixed(2));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (units < 1) {
      toast.error("Units sold must be at least 1");
      return;
    }
    try {
      const result = await logSales({
        storePromotionId: storePromotion._id,
        storeId,
        unitsSold: units,
        date,
      }).unwrap();
      toast.success(`Sales logged — $${result.creditsEarned.toFixed(2)} credits earned`);
      onDone();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to log sales");
    }
  }

  const promotionName = storePromotion.name ?? storePromotion.productName ?? "Promotion";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Promotion</p>
        <p className="text-sm font-semibold">{promotionName}</p>
        <p className="text-xs text-muted-foreground">${creditRatePerUnit.toFixed(2)} credit per unit sold</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Units Sold</label>
        <input
          type="number"
          min={1}
          value={unitsSold}
          onChange={(e) => setUnitsSold(e.target.value)}
          placeholder="e.g. 24"
          className="rounded-xs border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
          required
          autoFocus
        />
      </div>

      {units > 0 && (
        <div className="rounded-xs bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-800">
          <span className="font-medium">{units} units</span> × ${creditRatePerUnit.toFixed(2)} ={" "}
          <span className="font-bold">${preview.toFixed(2)} credits</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" className="rounded-xs flex-1" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="rounded-xs flex-1" disabled={isLoading || units < 1}>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Submit Sales
        </Button>
      </div>
    </form>
  );
}
