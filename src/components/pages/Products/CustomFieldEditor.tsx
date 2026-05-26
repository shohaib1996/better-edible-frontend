"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Props {
  field: FieldConfig;
  index: number;
  onUpdate: (index: number, updates: Partial<FieldConfig>) => void;
  onRemove: (index: number) => void;
}

export function CustomFieldEditor({ field, index, onUpdate, onRemove }: Props) {
  return (
    <div className="p-4 border rounded-xs space-y-3 bg-secondary/10">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Field {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="rounded-xs"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Field Name</Label>
          <Input
            value={field.name}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
            placeholder="e.g., subProductLine"
            className="rounded-xs"
          />
        </div>
        <div>
          <Label>Field Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            placeholder="e.g., Sub Product Line"
            className="rounded-xs"
          />
        </div>
        <div>
          <Label>Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(value: any) => onUpdate(index, { type: value })}
          >
            <SelectTrigger className="rounded-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xs">
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder}
            onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
            placeholder="Optional placeholder text"
            className="rounded-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`required-${index}`}
          checked={field.required}
          onChange={(e) => onUpdate(index, { required: e.target.checked })}
          className="w-4 h-4 rounded-xs"
        />
        <Label htmlFor={`required-${index}`}>Required field</Label>
      </div>
    </div>
  );
}
