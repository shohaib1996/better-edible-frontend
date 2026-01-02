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
import { IPrivateLabelOrder } from "@/types";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PrivateLabelOrderDetailsModalProps {
  order: IPrivateLabelOrder | null;
  onClose: () => void;
}

export const PrivateLabelOrderDetailsModal: React.FC<
  PrivateLabelOrderDetailsModalProps
> = ({ order, onClose }) => {
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

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      accepted: "bg-yellow-100 text-yellow-800",
      manifested: "bg-emerald-100 text-emerald-800",
      shipped: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <Badge
        className={cn(
          colorMap[status] || "bg-gray-100 text-gray-800",
          "rounded-xs"
        )}
      >
        {status}
      </Badge>
    );
  };

  const fmt = (value: number | undefined) =>
    value != null ? `$${value.toFixed(2)}` : "$0.00";

  const handleModalClose = (open: boolean) => {
    if (!open && !selectedImage) {
      // Only close if image preview is not open
      onClose();
    }
  };

  console.log(order);

  return (
    <>
      <Dialog open={!!order} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold">Private Label Order</span>
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-linear-to-r from-primary to-secondary text-white shadow-md whitespace-nowrap">
                  🏷️ PRIVATE LABEL
                </span>
              </div>
              <div className="flex items-center self-start sm:self-auto">
                {getStatusBadge(order.status)}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Store + Rep + Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Store Details
                </h3>
                <p className="font-medium text-foreground text-sm">
                  {order.store?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.store?.address}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Order Information
                </h3>
                <div className="space-y-1 mt-1">
                  <p className="text-foreground text-xs sm:text-sm">
                    <span className="font-medium">Rep:</span>{" "}
                    {order.rep?.name || "N/A"}
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
                </div>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Items</h3>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-primary/30 rounded-xs p-3 sm:p-4 bg-linear-to-r from-primary/10 to-secondary/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-full">
                          <p className="font-semibold text-foreground text-sm">
                            {item.flavor} ({item.privateLabelType})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Quantity: {item.quantity} × {fmt(item.unitPrice)} ={" "}
                            <span className="font-semibold text-primary">
                              {fmt(item.lineTotal || item.total)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Label Images */}
                      {item.labelImages && item.labelImages.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-foreground mb-2">
                            Label Images:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.labelImages.map((image, imgIdx) => {
                              const imageUrl =
                                typeof image === "string"
                                  ? image
                                  : image.secureUrl || image.url;

                              // Extract extension from URL or use format from image object
                              const getFileExtension = () => {
                                if (typeof image !== "string" && image.format) {
                                  return image.format;
                                }
                                if (
                                  typeof image !== "string" &&
                                  image.originalFilename
                                ) {
                                  return image.originalFilename;
                                }
                                // Extract from URL
                                const urlParts = imageUrl.split(".");
                                const ext =
                                  urlParts[urlParts.length - 1].split("?")[0];
                                return ext || "jpg";
                              };

                              const extension = getFileExtension();
                              const filename =
                                typeof image === "string"
                                  ? `${item.flavor}-label-${
                                      imgIdx + 1
                                    }.${extension}`
                                  : image.originalFilename ||
                                    `${item.flavor}-label-${
                                      imgIdx + 1
                                    }.${extension}`;

                              return (
                                <div
                                  key={imgIdx}
                                  className="relative group cursor-pointer w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-xs border-2 border-primary/30 hover:border-primary hover:shadow-lg transition-all duration-200"
                                  onClick={() =>
                                    setSelectedImage({
                                      url: imageUrl,
                                      filename: filename,
                                    })
                                  }
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={`Label ${imgIdx + 1}`}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-300 flex items-center justify-center pointer-events-none">
                                    <Eye className="text-white w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
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
                <div className="bg-muted rounded-xs p-3 border border-border">
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

                <div className="flex justify-between text-foreground">
                  <span className="font-medium">Discount:</span>
                  <span className="text-destructive">
                    {order.discountType === "percentage"
                      ? `${order.discount}% (-${fmt(
                          order.discountAmount || 0
                        )})`
                      : `-${fmt(order.discountAmount || order.discount || 0)}`}
                  </span>
                </div>

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
              className="rounded-xs w-full sm:w-auto"
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
