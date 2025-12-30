"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IOrder } from "@/types/order/order";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
      submitted: "bg-blue-100 text-blue-800",
      accepted: "bg-yellow-100 text-yellow-800",
      manifested: "bg-emerald-100 text-emerald-800",
      shipped: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const fmt = (value: number) => `$${value.toFixed(2)}`;

  const subtotal = order.subtotal ??
    (order.items && order.items.length > 0
      ? order.items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0)
      : 0);

  const discount = order.discount ?? 0;
  const total = order.total ?? subtotal - discount;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order #{order.orderNumber}</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Store + Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Store Details</h3>
              <p>{order.store?.name}</p>
              <p className="text-sm text-gray-500">{order.store?.address}</p>
            </div>
            <div>
              <h3 className="font-semibold">Dates</h3>
              <p>
                <span className="font-medium">Order Date:</span>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Delivery Date:</span>{" "}
                {order.deliveryDate
                  ? new Date(order.deliveryDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <Separator />

          {order.items && order.items.length > 0 ? (
            /* Regular Order Items Table */
            <div className="">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="border">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-4 border-b font-medium text-gray-700 text-sm">
                  <div className="py-2 px-2 border-r">Item</div>
                  <div className="py-2 px-2 text-right border-r">
                    Unit Price
                  </div>
                  <div className="py-2 px-2 text-right border-r">Quantity</div>
                  <div className="py-2 px-2 text-right">Total</div>
                </div>

                {/* Rows */}
                <div className="mt-1">
                  {order.items.map((item, idx) => {
                    const lineTotal = item.qty * item.unitPrice;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-4 border-b last:border-b-0"
                      >
                        {/* Item */}
                        <div className="py-3 px-2 border-r">
                          <p className="font-medium">{item.name}</p>
                          {item.unitLabel && (
                            <p className="text-sm text-gray-500">
                              {item.unitLabel}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="py-3 px-2 text-right border-r">
                          {fmt(item.unitPrice)}
                        </div>

                        {/* Quantity */}
                        <div className="py-3 px-2 text-right border-r">
                          {item.qty}
                        </div>

                        {/* Total */}
                        <div className="py-3 px-2 text-right">
                          {fmt(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* No items message */
            <div className="text-center py-6 text-gray-500">
              <p>No items in this order</p>
            </div>
          )}

          <Separator />

          {/* Note if exists */}
          {order.note && (
            <>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <h3 className="font-semibold mb-2">Note</h3>
                <p className="text-sm text-gray-700">{order.note}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Summary aligned right */}
          <div className="flex justify-end">
            <div className="w-full sm:w-1/3 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Discount:</span>
                <span className="text-red-500">-{fmt(discount)}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
