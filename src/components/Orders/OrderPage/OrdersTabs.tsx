import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { AllOrdersTab } from "./AllOrdersTab";
import { NewOrdersTab } from "./NewOrdersTab";
import { ShippedOrdersTab } from "./ShippedOrdersTab";
import { IRep } from "@/types";

interface OrdersTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  grouped: {
    allOrders: any[];
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
  isRepView?: boolean;
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
  isRepView = false,
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
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex gap-3">
          {isRepView && <TabsTrigger value="all">All Orders</TabsTrigger>}
          <TabsTrigger value="new">New Orders</TabsTrigger>
          <TabsTrigger value="shipped">Shipped Orders</TabsTrigger>
        </TabsList>

        <div className="grid">
          {/* ALL ORDERS - Only for Rep View */}
          {isRepView && (
            <TabsContent
              value="all"
              className="[grid-area:1/1] data-[state=inactive]:invisible data-[state=inactive]:h-0 data-[state=inactive]:overflow-hidden"
            >
              <AllOrdersTab
                orders={grouped.allOrders}
                handleChangeStatus={handleChangeStatus}
                updateOrder={updateOrder}
                refetch={refetch}
                onEdit={onEdit}
                currentRep={currentRep}
              />
            </TabsContent>
          )}

          {/* NEW ORDERS */}
          <TabsContent
            value="new"
            className="[grid-area:1/1] data-[state=inactive]:invisible data-[state=inactive]:h-0 data-[state=inactive]:overflow-hidden"
          >
            <NewOrdersTab
              orders={grouped.newOrders}
              handleChangeStatus={handleChangeStatus}
              updateOrder={updateOrder}
              refetch={refetch}
              onEdit={onEdit} // ✅ pass down
              currentRep={currentRep}
              isRepView={isRepView}
            />
          </TabsContent>

          {/* SHIPPED ORDERS */}
          <TabsContent
            value="shipped"
            className="[grid-area:1/1] data-[state=inactive]:invisible data-[state=inactive]:h-0 data-[state=inactive]:overflow-hidden"
          >
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
              currentRep={currentRep}
              isRepView={isRepView}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
