"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";
import { ProductTable } from "./ProductTable";
import { ProductMobileCard } from "./ProductMobileCard";

interface ProductLineCardProps {
  productLine: IProductLine;
  items: any[];
  onAddItem: (productLine: IProductLine) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export const ProductLineCard: React.FC<ProductLineCardProps> = ({
  productLine,
  items,
  onAddItem,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="border border-border rounded-xs shadow-sm hover:shadow-md transition bg-card py-0">
      <CardHeader className="bg-primary dark:bg-primary rounded-t-xs p-3 md:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-base md:text-lg font-semibold text-white">
            {productLine.name}
          </CardTitle>
          <Button
            onClick={() => onAddItem(productLine)}
            className="bg-white/20 hover:bg-white/30 text-white text-sm flex items-center gap-2 rounded-xs h-8"
          >
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto bg-card p-0 rounded-b-xs scrollbar-hidden">
        {/* Desktop Table View */}
        <ProductTable
          productLine={productLine}
          items={items}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {/* Mobile Card View */}
        <ProductMobileCard
          productLine={productLine}
          items={items}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
};
