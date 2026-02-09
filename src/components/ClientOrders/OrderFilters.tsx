"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ReUsableComponents/SearchableSelect";
import { ORDER_STATUS_LABELS } from "@/constants/privateLabel";
import { IPrivateLabelClient } from "@/types";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  allClients: IPrivateLabelClient[];
  hideStatusFilter?: boolean;
}

export const OrderFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clientFilter,
  onClientFilterChange,
  allClients,
  hideStatusFilter = false,
}: OrderFiltersProps) => {
  const clientOptions = useMemo(() => {
    return [
      { value: "all", label: "All Clients" },
      ...allClients.map((client) => ({
        value: client._id,
        label: client.store?.name || "Unknown Store",
      })),
    ];
  }, [allClients]);

  return (
    <div
      className={`grid grid-cols-1 gap-4 ${hideStatusFilter ? "md:grid-cols-5" : "md:grid-cols-6"}`}
    >
      {/* Search */}
      <div className="md:col-span-3">
        <Input
          id="search"
          type="text"
          placeholder="Order number or store name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-xs border-border dark:border-white/20 focus:ring-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200"
        />
      </div>

      {/* Status Filter - Hide when on shipped tab */}
      {!hideStatusFilter && (
        <div className="md:col-span-1">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger
              id="status"
              className="w-full rounded-xs border-border dark:border-white/20 hover:border-primary hover:bg-primary/5 transition-all duration-200"
            >
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xs border-border dark:border-white/20">
              <SelectItem
                value="all"
                className="rounded-xs cursor-pointer focus:bg-primary/10 focus:text-primary"
              >
                All Statuses
              </SelectItem>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="rounded-xs cursor-pointer focus:bg-primary/10 focus:text-primary"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Client Filter */}
      <div className="md:col-span-2">
        <SearchableSelect
          options={clientOptions}
          value={clientFilter || "all"}
          onChange={(value) =>
            onClientFilterChange(value === "all" ? "" : value)
          }
          placeholder="All Clients"
          searchPlaceholder="Search clients..."
          emptyMessage="No clients found."
        />
      </div>
    </div>
  );
};
