"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  DollarSign,
  Percent,
  Settings,
  Package,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";

interface ProductTableProps {
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

export const ProductTable: React.FC<ProductTableProps> = ({
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
    <table className="min-w-full border-collapse hidden md:table">
      <thead>
        <tr className="text-left text-muted-foreground bg-secondary/30 dark:bg-secondary/10">
          <th className="py-3 px-2 font-medium text-sm w-12 text-center">Order</th>

          <th className="py-3 px-3 font-medium text-sm">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Item / Sub-Product
            </div>
          </th>

          <th className="py-3 px-2 font-medium text-sm">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              Images
            </div>
          </th>

          {/* Dynamic headers based on pricing structure */}
          {productLine.pricingStructure.type === "multi-type" &&
            productLine.pricingStructure.typeLabels?.map((type) => (
              <React.Fragment key={type}>
                <th className="py-3 px-2 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                </th>
                <th className="py-3 px-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    Discount
                  </div>
                </th>
              </React.Fragment>
            ))}

          {productLine.pricingStructure.type === "simple" && (
            <>
              <th className="py-3 px-2 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Unit Price
                </div>
              </th>
              <th className="py-3 px-2 text-sm">
                <div className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  Discount
                </div>
              </th>
            </>
          )}

          {productLine.pricingStructure.type === "variants" &&
            productLine.pricingStructure.variantLabels?.map((variant) => (
              <React.Fragment key={variant}>
                <th className="py-3 px-2 text-sm">{variant}</th>
                <th className="py-3 px-2 text-sm">Discount</th>
              </React.Fragment>
            ))}

          <th className="py-3 px-3 text-center text-sm">
            <div className="flex items-center justify-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              Actions
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={12} className="py-8 text-center text-muted-foreground">
              No products yet. Click "Add Item" to create your first product.
            </td>
          </tr>
        ) : (
          items.map((item: any, index: number) => (
            <tr
              key={item._id}
              className="border-b border-border hover:bg-secondary/20 dark:hover:bg-secondary/10 transition"
            >
              {/* Order column */}
              <td className="py-3 px-2 text-center">
                <div className="flex flex-col items-center gap-0.5">
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
              </td>

              {/* Product name */}
              <td className="py-3 px-3 text-foreground font-medium">
                {item.itemName || item.subProductLine}
              </td>

              {/* Images column */}
              <td className="py-3 px-2">
                <div className="flex flex-wrap gap-1 max-w-[180px]">
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
                    className="w-10 h-10 border-2 border-dashed border-border rounded-xs flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors shrink-0"
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
              </td>

              {/* Dynamic pricing cells */}
              {productLine.pricingStructure.type === "multi-type" &&
                productLine.pricingStructure.typeLabels?.map((type) => {
                  const key = type.toLowerCase();
                  return (
                    <React.Fragment key={type}>
                      <td className="py-3 px-2 text-foreground">
                        {item.prices?.[key]?.price ??
                          item.hybridBreakdown?.[key] ??
                          "-"}
                      </td>
                      <td className="py-3 px-2 text-primary font-medium">
                        {item.prices?.[key]?.discountPrice
                          ? `$${item.prices[key].discountPrice.toFixed(2)}`
                          : "-"}
                      </td>
                    </React.Fragment>
                  );
                })}

              {productLine.pricingStructure.type === "simple" && (
                <>
                  <td className="py-3 px-2 text-foreground">
                    ${item.price?.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-primary font-medium">
                    {item.discountPrice
                      ? `$${item.discountPrice.toFixed(2)}`
                      : "-"}
                  </td>
                </>
              )}

              {productLine.pricingStructure.type === "variants" &&
                item.variants?.map((v: any) => (
                  <React.Fragment key={v.label}>
                    <td className="py-3 px-2 text-foreground">
                      ${v.price?.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-primary font-medium">
                      {v.discountPrice ? `$${v.discountPrice.toFixed(2)}` : "-"}
                    </td>
                  </React.Fragment>
                ))}

              {/* Actions */}
              <td className="py-3 px-3 text-center">
                <div className="flex gap-2 justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          className="bg-secondary text-white hover:bg-primary rounded-xs h-8 w-8"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
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
                    }"?`}
                    onConfirm={() => onDelete(item._id)}
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};
