"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { PhoneInput } from "@/components/ui/phone-input";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select" | "phone";
  placeholder?: string;
  options?: { label: string; value: string }[];
  render?: (
    value: any,
    onChange: (value: any) => void,
    initialData?: any,
    setFieldValue?: (field: string, value: any) => void
  ) => React.ReactNode;
}

interface EntityModalProps<T> {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<T>) => void;
  title: string;
  fields: Field[];
  initialData?: Partial<T> | null; // Allow null
  isSubmitting?: boolean;
  children?: React.ReactNode;
}

export function EntityModal<T>({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  isSubmitting,
  children,
}: EntityModalProps<T>) {
  // ✅ Always initialize with an object, never null
  const [formData, setFormData] = useState<Record<string, any>>({});

  // ✅ Sync form data when modal opens or data changes
  useEffect(() => {
    if (open) {
      setFormData(initialData || {}); // Ensure fallback
    } else {
      // Reset form data when modal closes to prevent stale data
      setFormData({});
    }
  }, [open, initialData]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData as Partial<T>);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label htmlFor={field.name}>{field.label}</Label>

              {field.render ? (
                field.render(
                  formData?.[field.name],
                  (value) => handleChange(field.name, value),
                  initialData,
                  handleChange
                )
              ) : field.type === "select" && field.options ? (
                <Select
                  value={formData?.[field.name] ?? ""}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger
                    id={field.name}
                    className={cn(
                      "w-full border border-primary dark:border-border rounded-xs bg-secondary/20 dark:bg-background text-foreground h-9 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    )}
                  >
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "phone" ? (
                <PhoneInput
                  value={formData?.[field.name] ?? ""}
                  onChange={(value) => handleChange(field.name, value)}
                  className="rounded-xs border border-primary dark:border-border bg-secondary/20 dark:bg-background text-foreground focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500"
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder || ""}
                  value={formData?.[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="rounded-xs border border-primary dark:border-border bg-secondary/20 dark:bg-background text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          ))}
        </div>

        {children}

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xs bg-accent dark:bg-accent text-white dark:text-white dark:hover:bg-accent/90 hover:bg-accent/90 border-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xs"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
