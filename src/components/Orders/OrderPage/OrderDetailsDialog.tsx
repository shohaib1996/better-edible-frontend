
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { IOrder } from "@/src/types/order/order";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

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

          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.product}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.unitLabel}</p>
                  </div>
                  <div className="text-right">
                    <p>Qty: {item.qty}</p>
                    <p className="text-sm text-gray-500">
                      @ ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Discount:</span>
              <span className="text-red-500">
                -${(order.discount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
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
