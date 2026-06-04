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
    setOpen(false);
  }

  return (
    <div>
      {selectedFlavors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
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

      {canAddFlavor ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between rounded-xs h-10 text-sm font-normal text-muted-foreground"
            >
              {selectedFlavors.length === 0 ? "Search flavors…" : "Add another flavor…"}
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
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxFlavors} flavor{maxFlavors > 1 ? "s" : ""} selected.
        </p>
      )}
    </div>
  );
}
