"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import {
  useGetPrivateLabelOrdersQuery,
  useChangePrivateLabelOrderStatusMutation,
} from "@/redux/api/PrivateLabel/privateLabelApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { PrivateLabelOrderCard } from "@/components/PrivateLabel/PrivateLabelOrderCard";
import { PrivateLabelOrderDetailsModal } from "@/components/PrivateLabel/PrivateLabelOrderDetailsModal";
import { CreatePrivateLabelOrderModal } from "@/components/PrivateLabel/CreatePrivateLabelOrderModal";
import { EditPrivateLabelOrderModal } from "@/components/PrivateLabel/EditPrivateLabelOrderModal";
import { PrivateLabelOrdersFilters } from "@/components/PrivateLabel/PrivateLabelProductsPage/PrivateLabelOrdersFilters";
import { PrivateLabelPackingListDialog } from "@/components/PrivateLabel/PrivateLabelPackingListDialog";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { IPrivateLabelOrder } from "@/types";
import { useUser } from "@/redux/hooks/useAuth";
import { generatePrivateLabelInvoice } from "@/utils/privateLabelInvoiceGenerator";

interface PrivateLabelOrdersPageProps {
  isRepView?: boolean;
  currentRepId?: string;
}

export const PrivateLabelOrdersPage: React.FC<PrivateLabelOrdersPageProps> = ({
  isRepView = false,
  currentRepId,
}) => {
  const router = useRouter();
  const user = useUser();
  const isAdmin = user?.role === "superadmin";

  const [activeTab, setActiveTab] = useState(isRepView ? "all" : "new");
  const [selectedOrder, setSelectedOrder] = useState<IPrivateLabelOrder | null>(
    null
  );
  const [editOrder, setEditOrder] = useState<IPrivateLabelOrder | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [packingOrder, setPackingOrder] = useState<IPrivateLabelOrder | null>(
    null
  );
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] =
    useState<IPrivateLabelOrder | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepName, setSelectedRepName] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch all reps for the filter dropdown
  const reps = useGetAllRepsQuery({});

  // Fetch orders based on current tab and role
  const getQueryParams = () => {
    const baseParams: any = {
      search: searchTerm || undefined,
      repName: selectedRepName || undefined,
      // Add pagination params: limit 999 for new/all tabs, use page/limit for shipped tab
      ...(activeTab === "shipped" ? { page, limit } : { limit: 999 }),
    };

    if (isAdmin) {
      // Admin View
      if (activeTab === "new") {
        return {
          ...baseParams,
          status: ["submitted", "accepted", "manifested"],
        };
      } else if (activeTab === "shipped") {
        return { ...baseParams, status: ["shipped", "cancelled"] };
      }
    } else {
      // Rep View
      if (activeTab === "all") {
        return { ...baseParams }; // All orders from entire system
      } else if (activeTab === "new") {
        return {
          ...baseParams,
          repId: currentRepId,
          status: ["submitted", "accepted", "manifested"],
        };
      } else if (activeTab === "shipped") {
        return { ...baseParams, status: ["shipped", "cancelled"] };
      }
    }
    return baseParams;
  };

  const { data, isLoading, refetch } = useGetPrivateLabelOrdersQuery(
    getQueryParams()
  );
  const [changeStatus] = useChangePrivateLabelOrderStatusMutation();

  const orders: IPrivateLabelOrder[] = data?.orders || [];
  const totalOrders = data?.total || 0;
  const totalPages = Math.ceil(totalOrders / limit);

  // Reset page to 1 when tab, search, or rep filter changes
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, selectedRepName]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  // Permission check: Can user edit this order?
  const canEditOrder = (order: IPrivateLabelOrder) => {
    if (isAdmin) return true;
    if (isRepView) {
      return order.rep?._id === currentRepId;
    }
    return false;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await changeStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success(`Order status changed to ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error("Error changing order status");
    }
  };

  const handleViewDetails = (order: IPrivateLabelOrder) => {
    setSelectedOrder(order);
  };

  const handleEdit = (order: IPrivateLabelOrder) => {
    setEditOrder(order);
  };

  const handleCreateOrder = () => {
    setCreateModalOpen(true);
  };

  const handleManageProducts = () => {
    router.push("/admin/private-label-products");
  };

  const handleDelivery = (order: IPrivateLabelOrder) => {
    setSelectedOrderForDelivery(order);
    setDeliveryModalOpen(true);
  };

  const handleGenerateInvoice = (order: IPrivateLabelOrder) => {
    generatePrivateLabelInvoice(order);
  };

  const handlePackingList = (order: IPrivateLabelOrder) => {
    setPackingOrder(order);
  };

  // Calculate totals (exclude cancelled orders)
  const totalValue = useMemo(() => {
    return orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-8 h-8 text-orange-600" />
            Private Label Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage private label orders with custom branding
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Button
              onClick={handleManageProducts}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Manage Products
            </Button>
          )}
          <Button
            onClick={handleCreateOrder}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          {isAdmin ? (
            <>
              <TabsTrigger value="new">New Orders</TabsTrigger>
              <TabsTrigger value="shipped">Shipped Orders</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="new">New Orders</TabsTrigger>
              <TabsTrigger value="shipped">Shipped Orders</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Filters */}
        <div className="mt-4">
          <PrivateLabelOrdersFilters
            reps={reps}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRepName={selectedRepName}
            setSelectedRepName={setSelectedRepName}
            isRepView={isRepView}
          />
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {/* Total Value Display */}
          {orders.length > 0 && (
            <div className="text-right font-semibold text-orange-600 mb-4 pr-2">
              Total Orders Value: ${totalValue.toFixed(2)}
            </div>
          )}

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">
                Create your first private label order to get started
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((order) => (
                  <PrivateLabelOrderCard
                    key={order._id}
                    order={order}
                    canEditStatus={canEditOrder(order)}
                    onStatusChange={handleStatusChange}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelivery={handleDelivery}
                    onGenerateInvoice={handleGenerateInvoice}
                    onPackingList={handlePackingList}
                  />
                ))}
              </div>

              {/* Pagination - Only show for shipped tab */}
              {activeTab === "shipped" && totalOrders > 0 && (
                <GlobalPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalOrders}
                  itemsPerPage={limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  limitOptions={[10, 20, 50, 100]}
                />
              )}
            </>
          )}
        </div>
      </Tabs>

      {/* Order Details Modal */}
      <PrivateLabelOrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Edit Order Modal */}
      <EditPrivateLabelOrderModal
        order={editOrder}
        onClose={() => setEditOrder(null)}
        onSuccess={() => {
          refetch();
        }}
        canEdit={editOrder ? canEditOrder(editOrder) : false}
      />

      {/* Create Order Modal */}
      <CreatePrivateLabelOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
        isRepView={isRepView}
        currentRepId={currentRepId}
      />

      {/* Packing List Dialog */}
      <PrivateLabelPackingListDialog
        order={packingOrder}
        onClose={() => setPackingOrder(null)}
      />

      {/* Delivery Modal */}
      {selectedOrderForDelivery && (
        <DeliveryModal
          open={deliveryModalOpen}
          onClose={() => {
            setDeliveryModalOpen(false);
            setSelectedOrderForDelivery(null);
          }}
          store={selectedOrderForDelivery.store}
          rep={isRepView ? selectedOrderForDelivery.rep : undefined}
          privateLabelOrderId={selectedOrderForDelivery._id}
          onSuccess={() => {
            refetch();
            setDeliveryModalOpen(false);
            setSelectedOrderForDelivery(null);
          }}
        />
      )}
    </div>
  );
};

export default PrivateLabelOrdersPage;
