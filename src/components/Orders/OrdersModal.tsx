"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetAllOrdersQuery } from "@/redux/api/orders/orders";

interface OrdersModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
}

export const OrdersModal = ({ open, onClose, storeId }: OrdersModalProps) => {
  const { data, isLoading, isFetching } = useGetAllOrdersQuery(
    storeId ? { storeId, page: 1, limit: 20 } : skipToken,
    { skip: !storeId }
  );

  const orders = data?.orders || [];
  const store = orders[0]?.store; // ✅ populated store info if available

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            📦 Store Orders
          </DialogTitle>
        </DialogHeader>

        {/* 🏪 Store Info Section */}
        {store && (
          <div className="bg-gray-50 border rounded-md p-3 mb-4">
            <h2 className="text-lg font-semibold">{store.name}</h2>
            <p className="text-sm text-gray-600">
              {store.address || "Address not available"}
            </p>
          </div>
        )}

        {/* Loading and Empty States */}
        {isLoading || isFetching ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-gray-600" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No orders found for this store.
          </p>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {orders.map((order: any) => (
              <div
                key={order._id}
                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition shadow-sm"
              >
                {/* 🧾 Header */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <strong>Order #:</strong> {order.orderNumber}
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "returned"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>

                {/* 🧍 Rep Info */}
                {order.rep && (
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Rep:</strong> {order.rep.name || "—"}
                  </div>
                )}

                {/* 🕒 Dates */}
                <div className="text-xs text-gray-500 mt-1">
                  Ordered on: {new Date(order.createdAt).toLocaleDateString()}
                  {order.deliveryDate && (
                    <>
                      {" "}
                      | Delivered on:{" "}
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </>
                  )}
                </div>

                {/* 💰 Totals */}
                <div className="text-sm font-medium mt-2">
                  Total: ${order.total?.toLocaleString() ?? 0}
                </div>

                {/* 💳 Payment Info */}
                {order.payment && (
                  <div className="text-xs text-gray-600 mt-1">
                    <strong>Payment:</strong> {order.payment.method || "—"} |{" "}
                    {order.payment.collected
                      ? "✅ Collected"
                      : "⏳ Pending Collection"}
                  </div>
                )}

                {/* 🗒️ Note */}
                {order.note && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    “{order.note}”
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
