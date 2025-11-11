"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
  render?: (
    value: any,
    onChange: (value: any) => void,
    initialData?: any
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
      <DialogContent className="sm:max-w-3xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
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
                  initialData
                )
              ) : field.type === "select" && field.options ? (
                <Select
                  value={formData?.[field.name] ?? ""}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger
                    id={field.name}
                    className={cn(
                      "w-full border border-gray-300 rounded-md bg-white text-sm h-9 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              ) : (
                <Input
                  id={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder || ""}
                  value={formData?.[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          ))}
        </div>

        {children}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
