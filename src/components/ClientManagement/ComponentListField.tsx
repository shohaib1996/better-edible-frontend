import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponentEntry } from "./useAddLabelForm";

interface Props {
  label: string;
  components: ComponentEntry[];
  onChange: (components: ComponentEntry[]) => void;
}

export function ComponentListField({ label, components, onChange }: Props) {
  function addRow() {
    onChange([...components, { name: "", percentage: "" }]);
  }

  function updateRow(idx: number, field: keyof ComponentEntry, value: string) {
    const updated = [...components];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  }

  function removeRow(idx: number) {
    onChange(components.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xs border-border dark:border-white/20 h-7 text-xs"
          onClick={addRow}
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {components.length > 0 && (
        <div className="space-y-2 mt-2">
          {components.map((comp, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                placeholder="Name"
                value={comp.name}
                onChange={(e) => updateRow(idx, "name", e.target.value)}
                className="flex-1 rounded-xs border-border dark:border-white/20 bg-card h-9"
              />
              <Input
                type="number"
                placeholder="%"
                value={comp.percentage}
                onChange={(e) => updateRow(idx, "percentage", e.target.value)}
                className="w-20 rounded-xs border-border dark:border-white/20 bg-card h-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                onClick={() => removeRow(idx)}
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
