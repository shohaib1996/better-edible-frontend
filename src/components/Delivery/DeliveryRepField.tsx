"use client";

import { Loader2, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { IRep } from "@/types";

interface Props {
  repProp?: Partial<IRep> | null;
  assignedTo: string;
  reps: any[];
  repsLoading: boolean;
  onChange: (val: string) => void;
}

export function DeliveryRepField({ repProp, assignedTo, reps, repsLoading, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <User className="h-3.5 w-3.5 text-primary" />
        Delivery Rep
      </Label>
      {repProp?.name ? (
        <div className="p-2 border border-border rounded-xs bg-muted/30">
          <p className="font-semibold text-sm text-foreground">{repProp.name}</p>
        </div>
      ) : (
        <Select value={assignedTo} onValueChange={onChange}>
          <SelectTrigger className="w-full border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
            <SelectValue placeholder="Select Rep" />
          </SelectTrigger>
          <SelectContent className="rounded-xs">
            {repsLoading ? (
              <div className="p-2 text-muted-foreground text-center text-xs">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              reps.map((rep: any) => (
                <SelectItem key={rep._id} value={rep._id} className="rounded-xs">
                  {rep.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
