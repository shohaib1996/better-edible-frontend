"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IClientOrder } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/constants/privateLabel";
import { Truck, Eye, ImageIcon } from "lucide-react";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import Image from "next/image";

interface OrderDetailsModalProps {
  order: IClientOrder | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  // Reset selectedImage when order changes or modal closes
  React.useEffect(() => {
    if (!order) {
      setSelectedImage(null);
    }
  }, [order]);

  if (!order) return null;

  const fmt = (value: number | undefined) =>
    value != null ? `$${value.toFixed(2)}` : "$0.00";

  const handleModalClose = (open: boolean) => {
    if (!open && !selectedImage) {
      // Only close if image preview is not open
      onClose();
    }
  };

  return (
    <>
      <Dialog open={!!order} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs p-4 sm:p-6 border-border dark:border-white/20 bg-secondary dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold">{order.orderNumber}</span>
                {order.shipASAP && (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1 rounded-xs"
                  >
                    <Truck className="h-3 w-3" />
                    Ship ASAP
                  </Badge>
                )}
                {order.isRecurring && (
                  <Badge variant="outline">Recurring</Badge>
                )}
              </div>
              <div className="flex items-center self-start sm:self-auto">
                <Badge
                  className={cn(
                    ORDER_STATUS_COLORS[order.status],
                    "rounded-xs",
                  )}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Store + Client + Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Client Details
                </h3>
                <p className="font-medium text-foreground text-sm">
                  {order.client?.store?.name || "Unknown Store"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.client?.store?.address || "No address available"}
                </p>
                {order.client?.store?.city && (
                  <p className="text-xs text-muted-foreground">
                    {order.client.store.city}
                    {order.client.store.state &&
                      `, ${order.client.store.state}`}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Order Information
                </h3>
                <div className="space-y-1 mt-1">
                  <p className="text-foreground text-xs sm:text-sm">
                    <span className="font-medium">Assigned Rep:</span>{" "}
                    {order.assignedRep?.name || "N/A"}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm">
                    <span className="font-medium">Order Date:</span>{" "}
                    {format(new Date(order.createdAt), "PPP")}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm">
                    <span className="font-medium">Delivery Date:</span>{" "}
                    {order.deliveryDate
                      ? format(new Date(order.deliveryDate), "PPP")
                      : "N/A"}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm">
                    <span className="font-medium">Production Start:</span>{" "}
                    {order.productionStartDate
                      ? format(new Date(order.productionStartDate), "PPP")
                      : "N/A"}
                  </p>
                  {order.actualShipDate && (
                    <p className="text-foreground text-xs sm:text-sm">
                      <span className="font-medium">Shipped Date:</span>{" "}
                      {format(new Date(order.actualShipDate), "PPP")}
                    </p>
                  )}
                  {order.trackingNumber && (
                    <p className="text-foreground text-xs sm:text-sm">
                      <span className="font-medium">Tracking Number:</span>{" "}
                      {order.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground">
                Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    // Get label images from the populated label field
                    const labelImages = item.label?.labelImages || [];

                    return (
                      <div
                        key={idx}
                        className="border border-primary/30 rounded-xs p-3 sm:p-4 bg-linear-to-r from-primary/10 to-secondary/10"
                      >
                        <div className="flex gap-4 items-start">
                          {/* Label Image Thumbnail */}
                          <div
                            className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-md bg-muted cursor-pointer group"
                            onClick={() => {
                              if (labelImages.length > 0) {
                                const img = labelImages[0];
                                setSelectedImage({
                                  url: img.secureUrl || img.url,
                                  filename: `${item.flavorName}-label`,
                                });
                              }
                            }}
                          >
                            {labelImages.length > 0 ? (
                              <>
                                <Image
                                  src={
                                    labelImages[0].secureUrl ||
                                    labelImages[0].url
                                  }
                                  alt={item.flavorName}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                                  <Eye className="text-white w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm">
                              {item.flavorName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.productType}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Quantity: {item.quantity} x {fmt(item.unitPrice)}{" "}
                              ={" "}
                              <span className="font-semibold text-primary">
                                {fmt(item.lineTotal)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-6 text-muted-foreground">
                    No items in this order
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Note */}
            {order.note && (
              <>
                <div className="bg-card rounded-xs p-3 border border-border dark:border-white/20">
                  <h3 className="font-semibold mb-2 text-foreground">Note</h3>
                  <p className="text-sm text-foreground">{order.note}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 space-y-2">
                <div className="flex justify-between text-foreground">
                  <span className="font-medium">Subtotal:</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>

                {(order.discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-foreground">
                    <span className="font-medium">Discount:</span>
                    <span className="text-green-600">
                      {order.discountType === "percentage"
                        ? `${order.discount}% (-${fmt(order.discountAmount)})`
                        : `-${fmt(order.discountAmount || order.discount || 0)}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-lg border-t border-border pt-2 text-foreground">
                  <span>Total:</span>
                  <span className="text-primary">{fmt(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xs w-full sm:w-auto border-border dark:border-white/20 bg-card hover:bg-accent/50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};
