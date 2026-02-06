"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className={`grid grid-cols-1 gap-4 ${hideRepFilter ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
      {/* Search */}
      <div>
        <Label htmlFor="search">Search Stores</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by store name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Status Filter */}
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rep Filter - Hidden for rep view */}
      {!hideRepFilter && (
        <div>
          <Label htmlFor="rep">Assigned Rep</Label>
          <Select value={repFilter || "all"} onValueChange={(val) => onRepFilterChange(val === "all" ? "" : val)}>
            <SelectTrigger id="rep">
              <SelectValue placeholder="All Reps" />
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
        </div>
      )}
    </div>
  );
};
