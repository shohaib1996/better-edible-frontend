"use client";

import { Controller, Control, UseFormSetValue } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { INote } from "@/types/note/note";

export const noteSchema = z.object({
  disposition: z.string().optional(),
  visitType: z.string().optional(),
  content: z.string().optional(),
  sample: z.boolean().default(false),
  delivery: z.boolean().default(false),
  deliveryStatus: z.enum(["completed", "cancelled"]).optional(),
  payment: z
    .object({
      cash: z.boolean().default(false),
      check: z.boolean().default(false),
      noPay: z.boolean().default(false),
      amount: z.string().optional(),
    })
    .optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;

export const prewrittenTexts = [
  "Called, Manager is not available",
  "Called, No answer",
  "stopped by no one was available",
  "Stopped by No manager",
];

interface Props {
  control: Control<NoteFormData>;
  setValue: UseFormSetValue<NoteFormData>;
  deliveryId?: string;
  note?: INote | null;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

export function NoteForm({ control, setValue, deliveryId, note, isLoading, onCancel, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto scrollbar-hidden p-0.5 flex-1 min-h-0">
      <div className="space-y-1.5">
        <Label htmlFor="disposition" className="text-xs font-semibold text-foreground">
          Disposition
        </Label>
        <Controller
          name="disposition"
          control={control}
          render={({ field }) => (
            <Input
              id="disposition"
              {...field}
              className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
              placeholder="Enter disposition"
            />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="visitType" className="text-xs font-semibold text-foreground">
          Visit Type
        </Label>
        <Controller
          name="visitType"
          control={control}
          render={({ field }) => (
            <Input
              id="visitType"
              {...field}
              className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
              placeholder="Enter visit type"
            />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground">Pre-written Text</Label>
        <Select onValueChange={(value) => setValue("content", value)}>
          <SelectTrigger className="border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
            <SelectValue placeholder="Select a pre-written message" />
          </SelectTrigger>
          <SelectContent className="rounded-xs">
            {prewrittenTexts.map((text) => (
              <SelectItem key={text} value={text} className="rounded-xs">
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content" className="text-xs font-semibold text-foreground">
          Content
        </Label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Textarea
              id="content"
              {...field}
              className="border border-border rounded-xs bg-input text-foreground resize-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary min-h-[100px]"
              placeholder="Enter note content"
              rows={4}
            />
          )}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Controller
            name="sample"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="sample"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="border-accent"
              />
            )}
          />
          <Label htmlFor="sample" className="text-sm font-medium text-foreground cursor-pointer">
            Sample
          </Label>
        </div>
        {!deliveryId && (
          <div className="flex items-center space-x-2">
            <Controller
              name="delivery"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="delivery"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-accent"
                />
              )}
            />
            <Label htmlFor="delivery" className="text-sm font-medium text-foreground cursor-pointer">
              Delivery
            </Label>
          </div>
        )}
      </div>

      {deliveryId && (
        <div className="space-y-2 border border-border rounded-xs p-3 bg-secondary/20">
          <Label className="text-xs font-semibold text-foreground">Delivery Status</Label>
          <Controller
            name="deliveryStatus"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deliveryStatus-completed"
                    checked={field.value === "completed"}
                    onCheckedChange={(checked) => field.onChange(checked ? "completed" : undefined)}
                    className="border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <Label htmlFor="deliveryStatus-completed" className="text-sm font-medium text-foreground cursor-pointer">
                    Delivered
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deliveryStatus-cancelled"
                    checked={field.value === "cancelled"}
                    onCheckedChange={(checked) => field.onChange(checked ? "cancelled" : undefined)}
                    className="border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <Label htmlFor="deliveryStatus-cancelled" className="text-sm font-medium text-foreground cursor-pointer">
                    Cancelled
                  </Label>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <div className="space-y-3 border-t border-border pt-4">
        <h4 className="text-base font-semibold text-foreground">Payment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["cash", "check", "noPay"] as const).map((key) => (
            <div key={key} className="flex items-center space-x-2">
              <Controller
                name={`payment.${key}`}
                control={control}
                render={({ field: f }) => (
                  <Checkbox
                    id={key}
                    checked={!!f.value}
                    onCheckedChange={f.onChange}
                    className="border-accent"
                  />
                )}
              />
              <Label htmlFor={key} className="text-sm font-medium text-foreground cursor-pointer">
                {key === "noPay" ? "No Pay" : key.charAt(0).toUpperCase() + key.slice(1)}
              </Label>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs font-semibold text-foreground">
            Amount
          </Label>
          <Controller
            name="payment.amount"
            control={control}
            render={({ field }) => (
              <Input
                id="amount"
                {...field}
                type="number"
                placeholder="0.00"
                className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
              />
            )}
          />
        </div>
      </div>

      <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-border pt-3 shrink-0">
        <Button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto rounded-xs bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto rounded-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {note ? "Update Note" : "Create Note"}
        </Button>
      </DialogFooter>
    </form>
  );
}
