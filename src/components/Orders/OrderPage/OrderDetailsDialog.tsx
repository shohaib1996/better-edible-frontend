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
import { Eye } from "lucide-react";
import { useState } from "react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import Image from "next/image";

interface OrderDetailsDialogProps {
  order: IOrder | null;
  onClose: () => void;
}

export const OrderDetailsDialog = ({
  order,
  onClose,
}: OrderDetailsDialogProps) => {
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  if (!order) return null;

  const isPrivateLabel = (order as any).isPrivateLabel === true;

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

  const subtotal = isPrivateLabel
    ? order.subtotal ?? order.total ?? 0
    : order.subtotal ??
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
            <div className="flex items-center gap-2">
              <span>Order #{order.orderNumber}</span>
              {isPrivateLabel && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-orange-600 to-yellow-600 text-white shadow-md">
                  🏷️ PRIVATE LABEL
                </span>
              )}
            </div>
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

          {isPrivateLabel ? (
            /* Private Label Details */
            <>
              <div className="bg-linear-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold mb-3 text-orange-900">
                  Private Label Order Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-orange-700 min-w-[120px]">
                      Product Type:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {(order as any).privateLabelType || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-orange-700 min-w-[120px]">
                      Flavor:
                    </span>
                    <span className="text-gray-800">
                      {(order as any).flavor || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-orange-700 min-w-[120px]">
                      Quantity:
                    </span>
                    <span className="text-gray-800">
                      {(order as any).quantity || 0} units
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-orange-700 min-w-[120px]">
                      Rep:
                    </span>
                    <span className="text-gray-800">
                      {order.rep?.name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Label Images */}
              {(order as any).labelImages &&
                (order as any).labelImages.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">
                        Label Images ({(order as any).labelImages.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {(order as any).labelImages.map(
                          (img: any, idx: number) => (
                            <div
                              key={idx}
                              className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition group relative"
                            >
                              <div className="relative">
                                <Image
                                  src={img.secureUrl || img.url}
                                  alt={
                                    img.originalFilename || `Label ${idx + 1}`
                                  }
                                  width={500}
                                  height={500}
                                  className="w-full h-40 object-contain bg-gray-50"
                                />
                                {/* Hover Overlay with Eye Icon */}
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    onClick={() =>
                                      setPreviewImage({
                                        url: img.secureUrl || img.url,
                                        filename:
                                          img.originalFilename ||
                                          `Label ${idx + 1}`,
                                      })
                                    }
                                    className="bg-white rounded-full p-3 hover:bg-gray-100 transition"
                                  >
                                    <Eye className="w-6 h-6 text-gray-700" />
                                  </button>
                                </div>
                              </div>
                              <div className="p-2 bg-gray-50 border-t">
                                <p className="text-xs text-gray-600 truncate">
                                  {img.originalFilename || `Label ${idx + 1}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {img.format?.toUpperCase()} •{" "}
                                  {(img.bytes / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
            </>
          ) : order.items && order.items.length > 0 ? (
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </Dialog>
  );
};
