"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  totalCases: number;
  totalPrice: number;
  discountAmount: number;
  finalTotal: number;
  discountType: "flat" | "percent" | undefined;
  discountValue: number;
  note: string;
  onDiscountTypeChange: (type: "flat" | "percent") => void;
  onDiscountValueChange: (value: number) => void;
  onNoteChange: (note: string) => void;
}

export function OrderSummaryCard({
  totalCases,
  totalPrice,
  discountAmount,
  finalTotal,
  discountType,
  discountValue,
  note,
  onDiscountTypeChange,
  onDiscountValueChange,
  onNoteChange,
}: Props) {
  return (
    <Card className="p-3 bg-card border-border rounded-xs shadow-md">
      <div className="bg-linear-to-r from-primary/10 to-secondary/10 px-2 py-1.5 rounded-xs mb-3 border-l-4 border-primary">
        <h3 className="font-bold text-sm text-foreground">ORDER SUMMARY</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs sm:text-sm px-2 py-1 bg-muted/20 rounded-xs">
          <span className="text-muted-foreground font-medium">Total Cases:</span>
          <span className="font-bold text-foreground">{totalCases}</span>
        </div>

        <div className="flex justify-between items-center text-xs sm:text-sm px-2 py-1 bg-muted/20 rounded-xs">
          <span className="text-muted-foreground font-medium">Subtotal:</span>
          <span className="font-bold text-foreground">
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="bg-muted/30 p-2 rounded-xs border border-border">
          <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 block">
            Apply Discount
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <select
              value={discountType}
              onChange={(e) =>
                onDiscountTypeChange(e.target.value as "flat" | "percent")
              }
              className="bg-input border border-border rounded-xs px-2 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="flat">Flat ($)</option>
              <option value="percent">Percent (%)</option>
            </select>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => onDiscountValueChange(Number(e.target.value) || 0)}
              placeholder="0.00"
              className="flex-1 sm:flex-initial h-8 text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs px-2"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs sm:text-sm px-2 py-1 bg-accent/10 rounded-xs border border-accent/30">
          <span className="text-muted-foreground font-medium">Discount:</span>
          <span className="font-bold text-accent">
            - ${discountAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm sm:text-base px-3 py-2 bg-linear-to-r from-primary/20 to-secondary/20 rounded-xs border-2 border-primary">
          <span className="font-bold text-foreground">FINAL TOTAL:</span>
          <span className="font-bold text-xl text-primary">
            ${finalTotal.toFixed(2)}
          </span>
        </div>

        <div className="pt-2">
          <Label
            htmlFor="order-note"
            className="text-xs text-muted-foreground font-medium mb-1 block"
          >
            Order Notes
          </Label>
          <Textarea
            id="order-note"
            placeholder="Add special notes or instructions..."
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={3}
            className="text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs resize-none bg-input"
          />
        </div>
      </div>
    </Card>
  );
}
