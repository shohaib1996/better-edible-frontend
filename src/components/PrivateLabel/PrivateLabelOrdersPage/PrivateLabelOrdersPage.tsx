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
import { PrivateLabelOrderCard } from "@/components/PrivateLabel/PrivateLabelOrderCard";
import { PrivateLabelOrderDetailsModal } from "@/components/PrivateLabel/PrivateLabelOrderDetailsModal";
import { CreatePrivateLabelOrderModal } from "@/components/PrivateLabel/CreatePrivateLabelOrderModal";
import { IPrivateLabelOrder } from "@/types";
import { useUser } from "@/redux/hooks/useAuth";

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

  const [activeTab, setActiveTab] = useState(
    isRepView ? "all" : "new"
  );
  const [selectedOrder, setSelectedOrder] = useState<IPrivateLabelOrder | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch orders based on current tab and role
  const getQueryParams = () => {
    if (isAdmin) {
      // Admin View
      if (activeTab === "new") {
        return { status: ["submitted", "accepted", "manifested"] };
      } else if (activeTab === "shipped") {
        return { status: ["shipped", "cancelled"] };
      }
    } else {
      // Rep View
      if (activeTab === "all") {
        return {}; // All orders from entire system
      } else if (activeTab === "new") {
        return {
          repId: currentRepId,
          status: ["submitted", "accepted", "manifested"],
        };
      } else if (activeTab === "shipped") {
        return { status: ["shipped", "cancelled"] };
      }
    }
    return {};
  };

  const { data, isLoading, refetch } = useGetPrivateLabelOrdersQuery(
    getQueryParams()
  );
  const [changeStatus] = useChangePrivateLabelOrderStatusMutation();

  const orders: IPrivateLabelOrder[] = data?.orders || [];

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

  const handleCreateOrder = () => {
    setCreateModalOpen(true);
  };

  const handleManageProducts = () => {
    router.push("/admin/private-label-products");
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

        {/* Tab Content */}
        <div className="mt-6">
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
            <div className="space-y-3">
              {orders.map((order) => (
                <PrivateLabelOrderCard
                  key={order._id}
                  order={order}
                  canEditStatus={canEditOrder(order)}
                  onStatusChange={handleStatusChange}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>

      {/* Order Details Modal */}
      <PrivateLabelOrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
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
    </div>
  );
};

export default PrivateLabelOrdersPage;
