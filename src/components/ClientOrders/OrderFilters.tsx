"use client";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          className="rounded-xs border-border focus:ring-primary/20"
        />
      </div>

      {/* Status Filter - Hide when on shipped tab */}
      {!hideStatusFilter && (
        <div className="md:col-span-1">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger
              id="status"
              className="w-full rounded-xs border-border"
            >
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xs border-border">
              <SelectItem
                value="all"
                className="rounded-xs cursor-pointer focus:bg-accent/50"
              >
                All Statuses
              </SelectItem>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="rounded-xs cursor-pointer focus:bg-accent/50"
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
        <Select
          value={clientFilter || "all"}
          onValueChange={(value) =>
            onClientFilterChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger
            id="client"
            className="w-full rounded-xs border-border"
          >
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="rounded-xs border-border">
            <SelectItem
              value="all"
              className="rounded-xs cursor-pointer focus:bg-accent/50"
            >
              All Clients
            </SelectItem>
            {allClients.map((client) => (
              <SelectItem
                key={client._id}
                value={client._id}
                className="rounded-xs cursor-pointer focus:bg-accent/50"
              >
                {client.store?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
