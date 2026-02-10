"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { IOrder } from "@/types/order/order";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Store, Calendar, Package, FileText, X } from "lucide-react";
import { sortCannaCrispyItems } from "@/utils/productOrdering";

interface OrderDetailsDialogProps {
  order: IOrder | null;
  onClose: () => void;
}

export const OrderDetailsDialog = ({
  order,
  onClose,
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      submitted: "bg-blue-500 text-white dark:bg-blue-600",
      accepted: "bg-yellow-500 text-white dark:bg-yellow-600",
      manifested: "bg-emerald-500 text-white dark:bg-emerald-600",
      shipped: "bg-green-500 text-white dark:bg-green-600",
      cancelled: "bg-red-500 text-white dark:bg-red-600",
    };
    return (
      <Badge
        className={`${colorMap[status] || "bg-gray-500 text-white"} rounded-xs`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const fmt = (value: number) => `$${value.toFixed(2)}`;

  const subtotal =
    order.subtotal ??
    (order.items && order.items.length > 0
      ? order.items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0)
      : 0);

  const discount = order.discount ?? 0;
  const total = order.total ?? subtotal - discount;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs bg-card dark:bg-card border border-border dark:border-gray-700">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-foreground dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Order #{order.orderNumber}
            </span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-secondary/30 dark:bg-secondary/10 p-3 rounded-xs border border-border dark:border-gray-700">
              <h3 className="font-semibold text-foreground dark:text-white flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-primary" />
                Store Details
              </h3>
              <p className="text-foreground dark:text-gray-200 font-medium">
                {order.store?.name}
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                {order.store?.address}
              </p>
            </div>
            <div className="bg-secondary/30 dark:bg-secondary/10 p-3 rounded-xs border border-border dark:border-gray-700">
              <h3 className="font-semibold text-foreground dark:text-white flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                Dates
              </h3>
              <p className="text-foreground dark:text-gray-200">
                <span className="font-medium text-primary">Order Date:</span>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-foreground dark:text-gray-200">
                <span className="font-medium text-primary">Delivery Date:</span>{" "}
                {order.deliveryDate
                  ? new Date(order.deliveryDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <Separator className="dark:bg-gray-700" />

          {order.items && order.items.length > 0 ? (
            /* Items table with dark mode and rounded-xs */
            <div>
              <h3 className="font-semibold mb-3 text-foreground dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Items ({order.items.length})
              </h3>
              <div className="border border-border dark:border-gray-700 rounded-xs overflow-hidden">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-4 bg-secondary/50 dark:bg-secondary/20 font-medium text-foreground dark:text-gray-200 text-sm">
                  <div className="py-2 px-3 border-r border-border dark:border-gray-700">
                    Item
                  </div>
                  <div className="py-2 px-3 text-right border-r border-border dark:border-gray-700">
                    Unit Price
                  </div>
                  <div className="py-2 px-3 text-right border-r border-border dark:border-gray-700">
                    Qty
                  </div>
                  <div className="py-2 px-3 text-right">Total</div>
                </div>

                {/* Rows */}
                <div className="mt-1">
                  {sortCannaCrispyItems(order.items).map((item, idx) => {
                    const lineTotal = item.qty * item.unitPrice;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-4 border-b border-border dark:border-gray-700 last:border-b-0 bg-card dark:bg-card hover:bg-secondary/20 dark:hover:bg-secondary/10 transition-colors"
                      >
                        {/* Item - Mobile shows all info stacked */}
                        <div className="py-2 px-3 sm:border-r border-border dark:border-gray-700">
                          <p className="font-medium text-foreground dark:text-white">
                            {item.name}
                          </p>
                          {item.unitLabel && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                              {item.unitLabel}
                            </p>
                          )}
                          {/* Mobile-only price info */}
                          <div className="sm:hidden text-sm text-muted-foreground dark:text-gray-400 mt-1">
                            {fmt(item.unitPrice)} x {item.qty} ={" "}
                            <span className="text-primary font-medium">
                              {fmt(lineTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Desktop-only columns */}
                        <div className="hidden sm:block py-2 px-3 text-right border-r border-border dark:border-gray-700 text-foreground dark:text-gray-200">
                          {fmt(item.unitPrice)}
                        </div>
                        <div className="hidden sm:block py-2 px-3 text-right border-r border-border dark:border-gray-700 text-foreground dark:text-gray-200">
                          {item.qty}
                        </div>
                        <div className="hidden sm:block py-2 px-3 text-right text-primary font-medium">
                          {fmt(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground dark:text-gray-400 bg-secondary/20 dark:bg-secondary/10 rounded-xs">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No items in this order</p>
            </div>
          )}

          <Separator className="dark:bg-gray-700" />

          {order.note && (
            <>
              <div className="bg-secondary/30 dark:bg-secondary/10 rounded-xs p-3 border border-border dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-foreground dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Note
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-300">
                  {order.note}
                </p>
              </div>
              <Separator className="dark:bg-gray-700" />
            </>
          )}

          <div className="flex justify-end">
            <div className="w-full sm:w-1/2 md:w-1/3 space-y-2 bg-secondary/30 dark:bg-secondary/10 p-3 rounded-xs border border-border dark:border-gray-700">
              <div className="flex justify-between text-foreground dark:text-gray-200">
                <span className="font-medium">Subtotal:</span>
                <span>{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-foreground dark:text-gray-200">
                  Discount:
                </span>
                <span className="text-accent">-{fmt(discount)}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg border-t border-border dark:border-gray-600 pt-2">
                <span className="text-foreground dark:text-white">Total:</span>
                <span className="text-primary">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:text-white dark:hover:bg-primary border-none"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
