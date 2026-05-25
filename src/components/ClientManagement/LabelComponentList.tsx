"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ComponentEntry {
  name: string;
  percentage: string;
}

interface Props {
  label: string;
  items: ComponentEntry[];
  onChange: (items: ComponentEntry[]) => void;
}

export function LabelComponentList({ label, items, onChange }: Props) {
  const add = () => onChange([...items, { name: "", percentage: "" }]);

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const update = (idx: number, field: keyof ComponentEntry, value: string) => {
    const updated = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xs border-border dark:border-white/20 h-7 text-xs"
          onClick={add}
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 mt-2">
          {items.map((comp, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                placeholder="Name"
                value={comp.name}
                onChange={(e) => update(idx, "name", e.target.value)}
                className="flex-1 rounded-xs border-border dark:border-white/20 bg-card h-9"
              />
              <Input
                type="number"
                placeholder="%"
                value={comp.percentage}
                onChange={(e) => update(idx, "percentage", e.target.value)}
                className="w-20 rounded-xs border-border dark:border-white/20 bg-card h-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                onClick={() => remove(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
