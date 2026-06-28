"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { ShippedOrderFilters } from "./ShippedOrderFilters";
import { ShippedOrderCard } from "./ShippedOrderCard";
import type { IRep } from "@/types";

interface ShippedOrdersTabProps {
  orders: any[];
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  onFilter: (args: { startDate?: string; endDate?: string; repName?: string }) => void;
  onEdit: (order: any) => void;
  isLoading: boolean;
  reps: any[];
  totalOrders?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  currentRep?: Partial<IRep> | null;
  isRepView?: boolean;
}

export const ShippedOrdersTab: React.FC<ShippedOrdersTabProps> = ({
  orders,
  handleChangeStatus,
  onFilter,
  onEdit,
  isLoading,
  totalOrders = 0,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onLimitChange,
  currentRep,
  isRepView = false,
}) => {
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);

  const [startDate, setStartDate] = useState<Date | undefined>(sixMonthsAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const [selectedRepName, setSelectedRepName] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"both" | "orders" | "samples">("both");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    onFilter({
      startDate: format(sixMonthsAgo, "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilter = () => {
    onFilter({
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      repName: selectedRepName,
    });
    onPageChange?.(1);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedRepName(undefined);
    onFilter({});
    onPageChange?.(1);
  };

  const filteredOrders =
    viewMode === "orders"
      ? orders.filter((o) => !o.isSample)
      : viewMode === "samples"
      ? orders.filter((o) => o.isSample)
      : orders;

  const shippedTotal = filteredOrders.reduce(
    (sum, o) => (o?.status === "shipped" ? sum + (Number(o?.total) || 0) : sum),
    0
  );

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  let orderIndex = 0;
  let sampleIndex = 0;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <ShippedOrderFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onFilter={handleFilter}
          onClear={handleClear}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : !orders.length ? (
          <p className="text-muted-foreground mt-4 text-center">No shipped orders found.</p>
        ) : (
          <>
            <div className="flex items-center justify-between pr-1">
              <div className="flex gap-3 text-sm font-semibold">
                <span className="text-primary">
                  {filteredOrders.filter((o) => !o.isSample).length} Orders
                </span>
                <span className="text-purple-600 dark:text-purple-400">
                  {filteredOrders.filter((o) => o.isSample).length} Samples
                </span>
              </div>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                Shipped Value: ${shippedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {filteredOrders.map((order) => {
              const isSample = order.isSample === true;
              const displayNumber = isSample ? ++sampleIndex : ++orderIndex;
              const isOwnOrder = isRepView ? order.rep?._id === currentRep?._id : true;

              return (
                <ShippedOrderCard
                  key={order._id}
                  order={order}
                  displayNumber={displayNumber}
                  isSample={isSample}
                  isOwnOrder={isOwnOrder}
                  onOpenDialog={setSelectedOrder}
                  onEdit={onEdit}
                  onUnauthorized={() =>
                    toast.error("You are not authorized to change it. This is not your order.")
                  }
                  onChangeStatus={handleChangeStatus}
                />
              );
            })}

            {totalOrders > itemsPerPage && onPageChange && onLimitChange && (
              <GlobalPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalOrders}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onLimitChange={(limit) => {
                  onLimitChange(limit);
                  onPageChange(1);
                }}
                limitOptions={[10, 25, 50, 100]}
              />
            )}
          </>
        )}

        <OrderDetailsDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </div>
    </TooltipProvider>
  );
};
