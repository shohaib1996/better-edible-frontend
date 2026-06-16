import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { IRep } from "@/types";

interface OrdersHeaderProps {
  onNewOrder: () => void;
  reps: any;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedRepName: string;
  setSelectedRepName: (value: string) => void;
  isRepView?: boolean;
}

export const OrdersHeader = ({
  onNewOrder,
  reps,
  searchTerm,
  setSearchTerm,
  selectedRepName,
  setSelectedRepName,
  isRepView = false,
}: OrdersHeaderProps) => (
  <div className="space-y-4 mb-4">
    <h1 className="text-2xl font-semibold">Orders Management</h1>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {/* New Order Button */}
      <Button onClick={onNewOrder} className="w-full rounded-xs">
        + New Order
      </Button>

      {/* Rep Filter (only if NOT rep view) */}
      {!isRepView && (
        <Select
          value={selectedRepName || "all"}
          onValueChange={(value) =>
            setSelectedRepName(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full rounded-xs bg-accent text-white dark:bg-accent [&_svg]:text-white [&_svg]:opacity-100 border-none">
            <SelectValue placeholder="Filter by Rep" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reps</SelectItem>
            {[
              ...new Set(
                reps?.data?.map((r: IRep) => r.name).filter(Boolean) || []
              ),
            ].map((repName) => (
              <SelectItem key={repName as string} value={repName as string}>
                {repName as string}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Search Input */}
      <div
        className={
          !isRepView ? "relative w-full" : "relative w-full md:col-span-2"
        }
      >
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by store name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 pr-3 py-2 w-full border border-primary rounded-xs text-sm focus:ring-1 focus:ring-primary outline-none bg-background text-foreground"
        />
      </div>
    </div>
  </div>
);
