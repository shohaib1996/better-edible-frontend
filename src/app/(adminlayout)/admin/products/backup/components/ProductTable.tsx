"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit, DollarSign, Percent, Settings, Package } from "lucide-react";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";

interface ProductTableProps {
  productLine: IProductLine;
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  productLine,
  items,
  onEdit,
  onDelete,
}) => {
  return (
    <table className="min-w-full border-collapse hidden md:table">
      <thead>
        <tr className="text-left text-muted-foreground bg-secondary/30 dark:bg-secondary/10">
          <th className="py-3 px-3 font-medium text-sm">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Item / Sub-Product
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
            <td colSpan={10} className="py-8 text-center text-muted-foreground">
              No products yet. Click "Add Item" to create your first product.
            </td>
          </tr>
        ) : (
          items.map((item: any) => (
            <tr
              key={item._id}
              className="border-b border-border hover:bg-secondary/20 dark:hover:bg-secondary/10 transition"
            >
              <td className="py-3 px-3 text-foreground font-medium">
                {item.itemName || item.subProductLine}
              </td>

              {/* Dynamic cells based on pricing structure */}
              {productLine.pricingStructure.type === "multi-type" &&
                productLine.pricingStructure.typeLabels?.map((type) => (
                  <React.Fragment key={type}>
                    <td className="py-3 px-2 text-foreground">
                      {item.prices?.[type]?.price ??
                        item.hybridBreakdown?.[type] ??
                        "-"}
                    </td>
                    <td className="py-3 px-2 text-primary font-medium">
                      {item.prices?.[type]?.discountPrice
                        ? `$${item.prices[type].discountPrice.toFixed(2)}`
                        : "-"}
                    </td>
                  </React.Fragment>
                ))}

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
