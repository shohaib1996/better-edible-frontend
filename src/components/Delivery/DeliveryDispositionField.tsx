"use client";

import { Truck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const DISPOSITION_OPTIONS = [
  { value: "delivery", label: "Delivery" },
  { value: "sample_drop", label: "Sample Drop" },
  { value: "money_pickup", label: "Money Pickup" },
  { value: "sales_call", label: "Sales Call" },
  { value: "other", label: "Other" },
];

interface Props {
  disposition: string[];
  onToggle: (value: string) => void;
}

export function DeliveryDispositionField({ disposition, onToggle }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Truck className="h-3.5 w-3.5 text-primary" />
        Disposition
      </Label>
      <div className="border border-border rounded-xs bg-input p-3 grid grid-cols-2 gap-2">
        {DISPOSITION_OPTIONS.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <Checkbox
              id={`disposition-${item.value}`}
              checked={disposition.includes(item.value)}
              onCheckedChange={() => onToggle(item.value)}
              className="rounded-xs"
            />
            <label
              htmlFor={`disposition-${item.value}`}
              className="text-sm text-foreground cursor-pointer select-none"
            >
              {item.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
