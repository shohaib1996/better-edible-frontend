"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit } from "lucide-react";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";

interface ProductMobileCardProps {
  productLine: IProductLine;
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export const ProductMobileCard: React.FC<ProductMobileCardProps> = ({
  productLine,
  items,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="md:hidden divide-y divide-border">
      {items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No products yet. Click "Add Item" to create your first product.
        </div>
      ) : (
        items.map((item: any) => (
          <div key={item._id} className="p-3">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-foreground">
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

            {/* Card Details */}
            <div className="bg-secondary/30 dark:bg-secondary/10 rounded-xs p-2 text-sm space-y-1">
              {/* Dynamic mobile view based on pricing structure */}
              {productLine.pricingStructure.type === "multi-type" && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {productLine.pricingStructure.typeLabels?.map((type) => (
                    <div key={type} className="flex flex-col">
                      <span className="text-muted-foreground font-medium">
                        {type.charAt(0).toUpperCase() + type.slice(1)}:
                      </span>
                      <span className="text-foreground">
                        {item.prices?.[type]?.price ??
                          item.hybridBreakdown?.[type] ??
                          "-"}
                      </span>
                      {item.prices?.[type]?.discountPrice && (
                        <span className="text-primary font-medium">
                          ${item.prices[type].discountPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
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
