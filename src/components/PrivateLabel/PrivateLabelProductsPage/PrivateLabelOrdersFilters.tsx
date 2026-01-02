import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { IRep } from "@/types";
import { Input } from "@/components/ui/input";

interface PrivateLabelOrdersFiltersProps {
  reps: any;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedRepName: string;
  setSelectedRepName: (value: string) => void;
  isRepView?: boolean;
}

export const PrivateLabelOrdersFilters = ({
  reps,
  searchTerm,
  setSearchTerm,
  selectedRepName,
  setSelectedRepName,
  isRepView = false,
}: PrivateLabelOrdersFiltersProps) => {
  // Extract reps data correctly from the query response
  const repsData = reps?.data?.data || [];

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      {!isRepView && (
        <div className="flex-1">
          <Select
            value={selectedRepName || "all"}
            onValueChange={(value) =>
              setSelectedRepName(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="rounded-xs border-primary w-full">
              <SelectValue placeholder="Filter by Rep" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {[
                ...new Set(
                  repsData?.map((r: IRep) => r.name).filter(Boolean) || []
                ),
              ].map((repName) => (
                <SelectItem key={repName as string} value={repName as string}>
                  {repName as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="relative flex-2">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by store name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 pr-3 py-1.5 w-full border rounded-xs text-sm focus:ring-1 focus:ring-primary outline-none border-primary"
        />
      </div>
    </div>
  );
};
