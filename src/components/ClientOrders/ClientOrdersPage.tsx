"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Package, Users, ShoppingCart } from "lucide-react";
import { useGetAllClientOrdersQuery } from "@/redux/api/PrivateLabel/clientOrderApi";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { OrderCard } from "./OrderCard";
import { OrderFilters } from "./OrderFilters";
import { CreateOrderModal } from "./CreateOrderModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUser } from "@/redux/hooks/useAuth";

interface ClientOrdersPageProps {
  isRepView?: boolean;
  currentRepId?: string;
}

export const ClientOrdersPage = ({
  isRepView = false,
  currentRepId,
}: ClientOrdersPageProps) => {
  const router = useRouter();
  const user = useUser();
  const isAdmin = user?.role === "superadmin";

  // Default tab: "all" for rep view, "active" for admin
  const [activeTab, setActiveTab] = useState(isRepView ? "all" : "active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleManageProducts = () => {
    router.push("/admin/private-label-products");
  };

  const handleManageClients = () => {
    router.push(isAdmin ? "/admin/manage-clients" : "/rep/manage-clients");
  };

  const { data: clientsData } = useGetAllPrivateLabelClientsQuery({
    limit: 1000,
  });
  const allClients = clientsData?.clients || [];

  // Build query params based on active tab and view type
  const getQueryParams = () => {
    const baseParams: any = {
      clientId: clientFilter || undefined,
      search: searchQuery || undefined,
    };

    if (isAdmin) {
      // Admin View: 2 tabs (Active Orders, Shipped Orders)
      if (activeTab === "active") {
        if (statusFilter !== "all") {
          baseParams.status = statusFilter;
        } else {
          baseParams.status =
            "waiting,stage_1,stage_2,stage_3,stage_4,ready_to_ship";
        }
        baseParams.limit = 999;
      } else {
        // Shipped tab
        baseParams.status = "shipped";
        baseParams.page = currentPage;
        baseParams.limit = limit;
      }
    } else {
      // Rep View: 3 tabs (All Orders, My Orders, Shipped Orders)
      if (activeTab === "all") {
        // All active orders from entire system
        if (statusFilter !== "all") {
          baseParams.status = statusFilter;
        } else {
          baseParams.status =
            "waiting,stage_1,stage_2,stage_3,stage_4,ready_to_ship";
        }
        baseParams.limit = 999;
      } else if (activeTab === "my") {
        // Only this rep's active orders
        baseParams.repId = currentRepId;
        if (statusFilter !== "all") {
          baseParams.status = statusFilter;
        } else {
          baseParams.status =
            "waiting,stage_1,stage_2,stage_3,stage_4,ready_to_ship";
        }
        baseParams.limit = 999;
      } else {
        // Shipped tab
        baseParams.status = "shipped";
        baseParams.page = currentPage;
        baseParams.limit = limit;
      }
    }

    return baseParams;
  };

  const { data, isLoading, refetch } = useGetAllClientOrdersQuery(
    getQueryParams(),
    { refetchOnMountOrArgChange: true },
  );

  const orders = data?.orders || [];
  const totalOrders = data?.total || 0;
  const totalPages = Math.ceil(totalOrders / limit);

  // Reset page when tab, search, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, clientFilter, statusFilter]);

  // Calculate total value (exclude any cancelled if we had them)
  const totalValue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span>Private Label Client Orders</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Total Orders: <span className="font-medium">{totalOrders}</span>
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleManageClients}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 sm:gap-2 bg-card hover:border-primary hover:bg-primary/5 hover:text-primary text-foreground cursor-pointer rounded-xs text-xs sm:text-sm flex-1 sm:flex-initial border border-border dark:border-white/20 shadow-xs transition-all duration-200 h-8.5"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="hidden sm:inline">
              {isAdmin ? "Manage Clients" : "My Clients"}
            </span>
            <span className="sm:hidden">Clients</span>
          </Button>
          {isAdmin && (
            <Button
              onClick={handleManageProducts}
              variant="outline"
              size="sm"
              className="flex h-8.5 items-center gap-1 sm:gap-2 bg-card hover:border-primary hover:bg-primary/5 hover:text-primary text-foreground cursor-pointer rounded-xs text-xs sm:text-sm flex-1 sm:flex-initial border border-border dark:border-white/20 shadow-xs transition-all duration-200"
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="hidden sm:inline">Manage Products</span>
              <span className="sm:hidden">Products</span>
            </Button>
          )}
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            className="flex items-center gap-1 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-xs text-xs sm:text-sm flex-1 sm:flex-initial shadow-sm transition-all duration-200"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Create Order</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={cn(
            "grid w-full h-auto p-1 bg-muted/50 rounded-xs",
            isAdmin ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {isAdmin ? (
            <>
              <TabsTrigger
                value="active"
                className="rounded-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
              >
                Active Orders
              </TabsTrigger>
              <TabsTrigger
                value="shipped"
                className="rounded-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
              >
                Shipped Orders
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger
                value="all"
                className="rounded-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
              >
                All Orders
              </TabsTrigger>
              <TabsTrigger
                value="my"
                className="rounded-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
              >
                My Orders
              </TabsTrigger>
              <TabsTrigger
                value="shipped"
                className="rounded-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
              >
                Shipped Orders
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Filters */}
        <div className="mt-4">
          <OrderFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            clientFilter={clientFilter}
            onClientFilterChange={setClientFilter}
            allClients={allClients}
            hideStatusFilter={activeTab === "shipped"}
          />
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {/* Total Value Display */}
          {orders.length > 0 && (
            <div className="text-right font-semibold text-primary mb-4 pr-2">
              Total Orders Value: $
              {totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}

          {/* Order List */}
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No orders found</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                {activeTab === "shipped"
                  ? "No shipped orders yet"
                  : activeTab === "my"
                    ? "You have no active orders"
                    : "Create your first client order to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} onUpdate={refetch} />
                ))}
              </div>

              {/* Pagination - Only show for shipped tab */}
              {activeTab === "shipped" && totalOrders > 0 && (
                <GlobalPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalOrders}
                  itemsPerPage={limit}
                  onPageChange={setCurrentPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </Tabs>

      {/* Create Order Modal */}
      <CreateOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};
