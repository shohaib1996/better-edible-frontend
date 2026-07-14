"use client";

import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_CANNABINOIDS, CANNABINOID_OPTIONS } from "@/lib/gummyPricing";
import type { CannabinoidName } from "@/types/privateLabel/gummyBuilder";

interface Props {
  cannabinoids: { name: CannabinoidName; mg: number }[];
  effectiveKey: string;
  selectedKey: string;
  onSelectKey: (key: string) => void;
  onAdd: () => void;
  onRemove: (name: CannabinoidName) => void;
}

export function CannabinoidEditor({ cannabinoids, effectiveKey, selectedKey, onSelectKey, onAdd, onRemove }: Props) {
  const usedNames = new Set(cannabinoids.map((c) => c.name));
  const availableGroups = ALL_CANNABINOIDS.filter((n) => !usedNames.has(n));
  const hasAvailable = availableGroups.length > 0;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Cannabinoids</p>

      {cannabinoids.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cannabinoids.map((c) => (
            <Badge key={c.name} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
              <span className="font-semibold">{c.name}</span>
              <span className="text-muted-foreground">{c.mg}mg</span>
              <button type="button" onClick={() => onRemove(c.name)} className="ml-0.5 hover:text-destructive transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {hasAvailable && (
        <div className="flex items-center gap-2">
          <Select value={effectiveKey} onValueChange={onSelectKey}>
            <SelectTrigger className="w-auto min-w-[130px] h-8 rounded-xs text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xs">
              {availableGroups.map((name) => (
                <SelectGroup key={name}>
                  <SelectLabel className="text-xs font-bold text-foreground px-2 py-1">{name}</SelectLabel>
                  {CANNABINOID_OPTIONS[name].map((mg) => (
                    <SelectItem key={`${name}-${mg}`} value={`${name}-${mg}`} className="rounded-xs pl-4 text-xs">
                      {name} {mg}mg
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" className="rounded-xs h-8 gap-1 text-xs" onClick={onAdd}>
            <Plus className="w-3 h-3" />
            {cannabinoids.length === 0 ? "Add" : "Add Another"}
          </Button>
        </div>
      )}

      {cannabinoids.length === 0 && !hasAvailable && (
        <p className="text-xs text-muted-foreground">No cannabinoids</p>
      )}
    </div>
  );
}
