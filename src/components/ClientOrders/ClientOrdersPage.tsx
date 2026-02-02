"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetAllClientOrdersQuery } from "@/redux/api/PrivateLabel/clientOrderApi";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { OrderCard } from "./OrderCard";
import { OrderFilters } from "./OrderFilters";
import { CreateOrderModal } from "./CreateOrderModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Button } from "@/components/ui/button";

export const ClientOrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: clientsData } = useGetAllPrivateLabelClientsQuery({ limit: 1000 });
  const allClients = clientsData?.clients || [];

  const { data, isLoading, refetch } = useGetAllClientOrdersQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      clientId: clientFilter || undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: limit,
    },
    { refetchOnMountOrArgChange: true }
  );

  const orders = data?.orders || [];
  const totalOrders = data?.total || 0;
  const totalPages = Math.ceil(totalOrders / limit);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            Client Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total Orders: <span className="font-medium">{totalOrders}</span>
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          + Create New Order
        </Button>
      </div>

      {/* Filters */}
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        allClients={allClients}
      />

      {/* Order List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} onUpdate={refetch} />
        ))}
      </div>

      {orders.length === 0 && (
        <p className="text-muted-foreground text-center mt-8">
          No orders found.
        </p>
      )}

      {/* Pagination */}
      {totalOrders > 0 && (
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

      {/* Create Order Modal */}
      <CreateOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};
