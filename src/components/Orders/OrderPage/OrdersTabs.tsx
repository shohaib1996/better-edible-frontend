import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { NewOrdersTab } from "./NewOrdersTab";
import { ShippedOrdersTab } from "./ShippedOrdersTab";
import { IRep } from "@/types";

interface OrdersTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  grouped: {
    newOrders: any[];
    shippedOrders: any[];
  };
  handleChangeStatus: (id: string, status: string) => void;
  updateOrder: any;
  isLoading: boolean;
  refetch: (args?: { startDate?: string; endDate?: string }) => void;
  onEdit: (order: any) => void; // ✅ NEW
  onFilter: (args: {
    startDate?: string;
    endDate?: string;
    repName?: string;
  }) => void;
  reps: any[];
  currentRep?: Partial<IRep> | null;
  // Pagination props
  totalOrders?: number;
  shippedPage?: number;
  shippedLimit?: number;
  onShippedPageChange?: (page: number) => void;
  onShippedLimitChange?: (limit: number) => void;
}

export const OrdersTabs = ({
  activeTab,
  setActiveTab,
  grouped,
  handleChangeStatus,
  updateOrder,
  isLoading,
  refetch,
  onEdit, // ✅ added
  onFilter,
  reps,
  currentRep,
  totalOrders,
  shippedPage,
  shippedLimit,
  onShippedPageChange,
  onShippedLimitChange,
}: OrdersTabsProps) => {
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="flex gap-3">
        <TabsTrigger value="new">New Orders</TabsTrigger>
        <TabsTrigger value="shipped">Shipped Orders</TabsTrigger>
      </TabsList>

      {/* NEW ORDERS */}
      <TabsContent value="new">
        <NewOrdersTab
          orders={grouped.newOrders}
          handleChangeStatus={handleChangeStatus}
          updateOrder={updateOrder}
          refetch={refetch}
          onEdit={onEdit} // ✅ pass down
          currentRep={currentRep}
        />
      </TabsContent>

      {/* SHIPPED ORDERS */}
      <TabsContent value="shipped">
        <ShippedOrdersTab
          orders={grouped.shippedOrders}
          handleChangeStatus={handleChangeStatus}
          updateOrder={updateOrder}
          onFilter={onFilter}
          onEdit={onEdit} // ✅ pass down
          isLoading={isLoading}
          reps={reps}
          totalOrders={totalOrders}
          currentPage={shippedPage}
          itemsPerPage={shippedLimit}
          onPageChange={onShippedPageChange}
          onLimitChange={onShippedLimitChange}
        />
      </TabsContent>
    </Tabs>
  );
};
