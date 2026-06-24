"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Rep {
  _id: string;
  name: string;
}

interface ClientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  repFilter: string;
  onRepFilterChange: (value: string) => void;
  allReps: Rep[];
  hideRepFilter?: boolean;
}

export const ClientFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  repFilter,
  onRepFilterChange,
  allReps,
  hideRepFilter = false,
}: ClientFiltersProps) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 ${hideRepFilter ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
    >
      {/* Search */}
      <div className="space-y-1.5">
        <Input
          id="search"
          type="text"
          placeholder="Search by store name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-xs"
        />
      </div>

      {/* Status Filter */}
      <div className="space-y-1.5">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status" className="w-full rounded-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xs">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rep Filter - Hidden for rep view */}
      {!hideRepFilter && (
        <div className="space-y-1.5">
          <Select
            value={repFilter || "all"}
            onValueChange={(val) => onRepFilterChange(val === "all" ? "" : val)}
          >
            <SelectTrigger id="rep" className="w-full rounded-xs">
              <SelectValue placeholder="All Reps" />
            </SelectTrigger>
            <SelectContent className="rounded-xs scrollbar-hidden">
              <SelectItem value="all">All Reps</SelectItem>
              {allReps.map((rep) => (
                <SelectItem key={rep._id} value={rep._id}>
                  {rep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
