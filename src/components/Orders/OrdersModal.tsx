"use client";

import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Package, MapPin, User, Calendar, DollarSign, CreditCard, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetAllOrdersQuery } from "@/redux/api/orders/orders";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";

interface OrdersModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
}

export const OrdersModal = ({ open, onClose, storeId }: OrdersModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data, isLoading, isFetching } = useGetAllOrdersQuery(
    storeId ? { storeId, page: currentPage, limit: itemsPerPage } : skipToken,
    { skip: !storeId }
  );

  const orders = data?.orders || [];
  const totalOrders = data?.total || 0;
  const store = orders[0]?.store; // ✅ populated store info if available
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-background border-border rounded-xs flex flex-col">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Store Orders
          </DialogTitle>
        </DialogHeader>

        {/* Store Info Section */}
        {store && (
          <div className="bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xs p-3 shadow-sm shrink-0">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-foreground">{store.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {store.address || "Address not available"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading and Empty States */}
        {isLoading || isFetching ? (
          <div className="flex justify-center items-center py-10 flex-1">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              No orders found for this store.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 overflow-y-auto scrollbar-hidden pr-1 flex-1 min-h-0">
              {orders.map((order: any) => (
                <div
                  key={order._id}
                  className="border border-border rounded-xs p-3 bg-card hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                {/* Header */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-xs">
                      <Package className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Order #{order.orderNumber}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-[10px] font-semibold rounded-xs border-2 ${
                      order.status === "delivered"
                        ? "bg-primary/10 text-primary border-primary/40"
                        : order.status === "shipped"
                        ? "bg-secondary/30 text-secondary border-secondary/50 dark:bg-secondary/20 dark:text-secondary dark:border-secondary/60"
                        : order.status === "returned"
                        ? "bg-accent/10 text-accent border-accent/40"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Rep Info */}
                  {order.rep && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium">Rep:</span>
                      <span className="text-foreground truncate">{order.rep.name || "—"}</span>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-medium">Ordered:</span>
                    <span className="text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Delivery Date */}
                  {order.deliveryDate && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-secondary shrink-0" />
                      <span className="font-medium">Delivered:</span>
                      <span className="text-foreground">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Payment Info */}
                  {order.payment && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium">Payment:</span>
                      <span className="text-foreground">{order.payment.method || "—"}</span>
                      <span className={order.payment.collected ? "text-primary" : "text-accent"}>
                        {order.payment.collected ? "✓" : "⏳"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Total:</span>
                  <span className="text-sm font-bold text-primary">${order.total?.toLocaleString() ?? 0}</span>
                </div>

                {/* Note */}
                {order.note && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-start gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                        "{order.note}"
                      </p>
                    </div>
                  </div>
                )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalOrders > itemsPerPage && (
              <div className="border-t border-border pt-3 shrink-0">
                <GlobalPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalOrders}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  limitOptions={[5, 10, 20, 50]}
                />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
