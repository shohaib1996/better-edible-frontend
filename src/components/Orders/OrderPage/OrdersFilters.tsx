import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Search } from "lucide-react";
import { IRep } from "@/src/types";

export const OrdersFilters = ({
  reps,
  searchTerm,
  setSearchTerm,
  selectedRepName,
  setSelectedRepName,
}: any) => (
  <div className="flex flex-wrap gap-3 items-center justify-end mb-3">
    <Select
      value={selectedRepName || "all"}
      onValueChange={(value) => setSelectedRepName(value === "all" ? "" : value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Filter by Rep" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Reps</SelectItem>
        {[...(new Set(reps?.data?.map((r: IRep) => r.name).filter(Boolean) || []))].map(
          (repName) => (
            <SelectItem key={repName as string} value={repName as string}>
              {repName as string}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>

    <div className="relative w-64">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search by store name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8 pr-3 py-1.5 w-full border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
      />
    </div>
  </div>
);
