import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CANNABINOID_OPTIONS, ALL_CANNABINOIDS, CANNABINOID_PRICES } from "@/lib/gummyPricing";
import type { CannabinoidName } from "@/types/privateLabel/gummyBuilder";
import { SectionLabel } from "./SegmentGroup";

interface Props {
  cannabinoids: { name: CannabinoidName; mg: number }[];
  onAdd: (entry: { name: CannabinoidName; mg: number }) => void;
  onRemove: (name: CannabinoidName) => void;
}

export function CannabinoidSelector({ cannabinoids, onAdd, onRemove }: Props) {
  const [selectedKey, setSelectedKey] = useState("CBD-100");

  const usedNames = new Set(cannabinoids.map((c) => c.name));
  const availableOptions = ALL_CANNABINOIDS.filter((n) => !usedNames.has(n)).flatMap((n) =>
    CANNABINOID_OPTIONS[n].map((mg) => ({ key: `${n}-${mg}`, name: n as CannabinoidName, mg })),
  );
  const effectiveKey =
    availableOptions.some((o) => o.key === selectedKey) ? selectedKey : (availableOptions[0]?.key ?? "");
  const [selName, selMg] = effectiveKey.split("-") as [CannabinoidName, string];
  const selectedPriceAdd = CANNABINOID_PRICES[selName]?.[Number(selMg)] ?? 0;

  function handleAdd() {
    const opt = availableOptions.find((o) => o.key === effectiveKey);
    if (!opt) return;
    onAdd({ name: opt.name, mg: opt.mg });
    const next = availableOptions.find((o) => o.key !== effectiveKey);
    setSelectedKey(next?.key ?? "CBD-100");
  }

  return (
    <div>
      <SectionLabel>
        Cannabinoid Add-ons{" "}
        <span className="normal-case font-normal text-muted-foreground/60 tracking-normal">
          (optional)
        </span>
      </SectionLabel>

      {cannabinoids.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-2.5 rounded-xs bg-muted/30 border border-border">
          {cannabinoids.map((c) => (
            <Badge
              key={c.name}
              variant="secondary"
              className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1.5"
            >
              <span className="font-semibold text-xs">{c.name}</span>
              <span className="text-muted-foreground text-xs">{c.mg}mg</span>
              <button
                type="button"
                onClick={() => onRemove(c.name)}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {availableOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={effectiveKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-auto sm:min-w-40 h-11 sm:h-9 rounded-xs text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xs">
              {ALL_CANNABINOIDS.filter((n) => !usedNames.has(n)).map((name) => (
                <SelectGroup key={name}>
                  <SelectLabel className="text-xs font-bold text-foreground px-2 py-1">
                    {name}
                  </SelectLabel>
                  {CANNABINOID_OPTIONS[name].map((mg) => {
                    const price = CANNABINOID_PRICES[name as CannabinoidName]?.[mg] ?? 0;
                    return (
                      <SelectItem
                        key={`${name}-${mg}`}
                        value={`${name}-${mg}`}
                        className="rounded-xs pl-4"
                      >
                        {name} {mg}mg — +${price.toFixed(2)}/unit
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="rounded-xs gap-1.5 h-11 shrink-0 px-4"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4" />
            {cannabinoids.length === 0 ? "Add" : "Add Another"}
          </Button>
        </div>
      )}

      {selectedPriceAdd > 0 && availableOptions.length > 0 && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1.5">
          +${selectedPriceAdd.toFixed(2)}/unit added to price
        </p>
      )}
    </div>
  );
}
