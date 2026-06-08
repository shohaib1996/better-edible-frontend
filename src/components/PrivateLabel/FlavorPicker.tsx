"use client";

import { useState } from "react";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Flavor {
  flavorId: string;
  name: string;
}

interface FlavorPickerProps {
  selectedFlavors: string[];
  allFlavors: Flavor[];
  isLoadingFlavors: boolean;
  maxFlavors: number;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

export function FlavorPicker({
  selectedFlavors,
  allFlavors,
  isLoadingFlavors,
  maxFlavors,
  onAdd,
  onRemove,
}: FlavorPickerProps) {
  const [open, setOpen] = useState(false);

  const canAddFlavor = selectedFlavors.length < maxFlavors;
  const availableFlavors = allFlavors.filter((f) => !selectedFlavors.includes(f.name));

  function handleSelect(name: string) {
    onAdd(name);
    // Close only when the last available slot is filled; otherwise stay open for multi-pick
    if (selectedFlavors.length + 1 >= maxFlavors) {
      setOpen(false);
    }
  }

  return (
    <div>
      {canAddFlavor ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between rounded-xs h-10 text-sm font-normal text-muted-foreground"
            >
              <span className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                {selectedFlavors.length === 0 ? (
                  "Search flavors…"
                ) : (
                  selectedFlavors.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-xs text-xs px-1.5 py-0.5 font-medium"
                    >
                      {f}
                      <button
                        type="button"
                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onClick={(e) => { e.stopPropagation(); onRemove(f); }}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
                {selectedFlavors.length > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {maxFlavors > 1 ? `${selectedFlavors.length}/${maxFlavors}` : ""}
                  </span>
                )}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0 rounded-xs"
            align="start"
          >
            <Command className="rounded-xs">
              <CommandInput placeholder="Search flavors…" className="h-10" />
              <CommandList className="max-h-64">
                <CommandEmpty>
                  {isLoadingFlavors ? "Loading flavors…" : "No flavors found."}
                </CommandEmpty>
                <CommandGroup>
                  {availableFlavors.map((f) => (
                    <CommandItem
                      key={f.flavorId}
                      value={f.name}
                      onSelect={handleSelect}
                      className="rounded-xs"
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {f.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selectedFlavors.map((f) => (
            <Badge key={f} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1">
              <span className="text-xs font-medium">{f}</span>
              <button
                type="button"
                onClick={() => onRemove(f)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
