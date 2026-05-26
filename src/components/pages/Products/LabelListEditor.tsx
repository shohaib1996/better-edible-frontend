"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  title: string;
  addLabel: string;
  placeholder: string;
  emptyText: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

export function LabelListEditor({
  title,
  addLabel,
  placeholder,
  emptyText,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="rounded-xs"
        >
          <Plus className="w-4 h-4 mr-1" /> {addLabel}
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => onUpdate(index, e.target.value)}
            placeholder={placeholder}
            className="rounded-xs"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => onRemove(index)}
            className="rounded-xs"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}
