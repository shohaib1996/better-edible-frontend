"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Client {
  _id: string;
  store?: { name: string };
}

interface Props {
  clients: Client[] | undefined;
  isLoading: boolean;
  selectedClientId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
}

export function ClientSearchCombobox({
  clients,
  isLoading,
  selectedClientId,
  searchQuery,
  onSearchChange,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedName = clients?.find((c) => c._id === selectedClientId)?.store?.name;

  return (
    <div>
      <Label htmlFor="client">Select Client *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-xs border-border dark:border-white/20 bg-card hover:bg-muted/50 hover:text-foreground font-normal"
          >
            {selectedClientId ? (selectedName || "Selected client") : "Search for a client..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 rounded-xs border-border dark:border-white/20 bg-card"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search clients..."
              value={searchQuery}
              onValueChange={onSearchChange}
              className="border-none focus:ring-0"
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : clients && clients.length === 0 ? (
                <CommandEmpty>No clients found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {clients?.map((client) => (
                    <CommandItem
                      key={client._id}
                      value={client._id}
                      onSelect={(value) => {
                        onSelect(value === selectedClientId ? "" : value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedClientId === client._id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {client.store?.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
