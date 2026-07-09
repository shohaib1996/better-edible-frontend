"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";

interface ProductMobileCardProps {
  productLine: IProductLine;
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onImageUpload: (productId: string, files: FileList | null) => void;
  onImageDelete: (productId: string, publicId: string) => void;
  onImagePreview: (image: { url: string; filename: string }) => void;
  onReorder: (items: any[], fromIdx: number, direction: "up" | "down") => void;
  uploadingIds: Set<string>;
}

export const ProductMobileCard: React.FC<ProductMobileCardProps> = ({
  productLine,
  items,
  onEdit,
  onDelete,
  onImageUpload,
  onImageDelete,
  onImagePreview,
  onReorder,
  uploadingIds,
}) => {
  return (
    <div className="md:hidden divide-y divide-border">
      {items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No products yet. Click "Add Item" to create your first product.
        </div>
      ) : (
        items.map((item: any, index: number) => (
          <div key={item._id} className="p-3">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-2">
              {/* Up/Down order buttons */}
              <div className="flex flex-col gap-0.5 mr-2">
                <button
                  onClick={() => onReorder(items, index, "up")}
                  disabled={index === 0}
                  className="p-0.5 rounded-xs text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onReorder(items, index, "down")}
                  disabled={index === items.length - 1}
                  className="p-0.5 rounded-xs text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <span className="font-semibold text-foreground flex-1">
                {item.itemName || item.subProductLine}
              </span>

              <div className="flex gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className="bg-secondary text-white hover:bg-primary rounded-xs h-7 w-7"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xs">
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <ConfirmDialog
                  triggerText="Delete"
                  title="Delete Product?"
                  description={`Are you sure you want to delete "${
                    item.itemName || item.subProductLine
                  }\"?`}
                  onConfirm={() => onDelete(item._id)}
                />
              </div>
            </div>

            {/* Images row */}
            <div className="flex flex-wrap gap-1 mb-2">
              {(item.images || []).map((img: any) => (
                <div key={img.publicId} className="relative group">
                  <button
                    onClick={() =>
                      onImagePreview({ url: img.url, filename: item.itemName || item.subProductLine || "product" })
                    }
                    className="w-10 h-10 rounded-xs overflow-hidden border border-border block"
                    title="View image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt="product"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <ConfirmDialog
                    trigger={
                      <button
                        className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 rounded-full bg-destructive text-white items-center justify-center shadow-sm"
                        title="Delete image"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    }
                    title="Delete image?"
                    description="This image will be permanently removed from Cloudinary."
                    confirmText="Delete"
                    onConfirm={() => onImageDelete(item._id, img.publicId)}
                  />
                </div>
              ))}

              {/* Upload button */}
              <label
                className="w-10 h-10 border-2 border-dashed border-border rounded-xs flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                title="Add image"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onImageUpload(item._id, e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
                {uploadingIds.has(item._id) ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                ) : (
                  <span className="text-muted-foreground text-lg leading-none">+</span>
                )}
              </label>
            </div>

            {/* Card Details */}
            <div className="bg-secondary/30 dark:bg-secondary/10 rounded-xs p-2 text-sm space-y-1">
              {/* Dynamic mobile view based on pricing structure */}
              {productLine.pricingStructure.type === "multi-type" && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {productLine.pricingStructure.typeLabels?.map((type) => {
                    const key = type.toLowerCase();
                    return (
                      <div key={type} className="flex flex-col">
                        <span className="text-muted-foreground font-medium">
                          {type.charAt(0).toUpperCase() + type.slice(1)}:
                        </span>
                        <span className="text-foreground">
                          {item.prices?.[key]?.price ??
                            item.hybridBreakdown?.[key] ??
                            "-"}
                        </span>
                        {item.prices?.[key]?.discountPrice && (
                          <span className="text-primary font-medium">
                            ${item.prices[key].discountPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {productLine.pricingStructure.type === "simple" && (
                <div className="flex gap-4">
                  <span className="text-muted-foreground">
                    Price:{" "}
                    <span className="text-foreground">
                      ${item.price?.toFixed(2)}
                    </span>
                  </span>
                  {item.discountPrice && (
                    <span className="text-muted-foreground">
                      Discount:{" "}
                      <span className="text-primary">
                        ${item.discountPrice.toFixed(2)}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {productLine.pricingStructure.type === "variants" && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {item.variants?.map((v: any) => (
                    <div key={v.label} className="flex flex-col">
                      <span className="text-muted-foreground font-medium">
                        {v.label}:
                      </span>
                      <span className="text-foreground">
                        ${v.price?.toFixed(2)}
                      </span>
                      {v.discountPrice && (
                        <span className="text-primary font-medium">
                          ${v.discountPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
