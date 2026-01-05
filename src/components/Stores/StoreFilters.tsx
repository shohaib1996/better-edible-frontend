"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IRep } from "@/types";

interface StoreFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  selectedRepFilter: string;
  onRepFilterChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  allReps: IRep[];
}

export const StoreFilters = ({
  searchQuery,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  selectedRepFilter,
  onRepFilterChange,
  sortOrder,
  onSortOrderChange,
  allReps,
}: StoreFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="text"
        placeholder="Search by store name..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-[200px] border border-accent rounded-xs"
      />
      <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
        <SelectTrigger className="flex-1 min-w-[180px] border border-accent rounded-xs">
          <SelectValue placeholder="Filter by Due" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stores</SelectItem>
          <SelectItem value="due">
            <span className="flex items-center gap-2">⚪ All Due</span>
          </SelectItem>
          <SelectItem value="green">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Less than 7 days
            </span>
          </SelectItem>
          <SelectItem value="yellow">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Less than 30 days
            </span>
          </SelectItem>
          <SelectItem value="red">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              More than 30 days
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedRepFilter || "all"}
        onValueChange={(value) =>
          onRepFilterChange(value === "all" ? "" : value)
        }
      >
        <SelectTrigger className="flex-1 min-w-[150px] border border-accent rounded-xs">
          <SelectValue placeholder="Filter by Rep" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Reps</SelectItem>
          {allReps.map((rep) => (
            <SelectItem key={rep._id} value={rep._id}>
              {rep.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="flex-1 min-w-[150px] border border-accent rounded-xs">
          <SelectValue placeholder="Sort Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">
            <span className="flex items-center gap-2">
              ↑ A → Z (0-9 first)
            </span>
          </SelectItem>
          <SelectItem value="desc">
            <span className="flex items-center gap-2">
              ↓ Z → A (9-0 first)
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
