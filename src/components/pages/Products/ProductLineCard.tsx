"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";
import { ProductTable } from "./ProductTable";
import { ProductMobileCard } from "./ProductMobileCard";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";

interface ProductLineCardProps {
  productLine: IProductLine;
  items: any[];
  onAddItem: (productLine: IProductLine) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onImageUpload: (productId: string, files: FileList | null) => void;
  onImageDelete: (productId: string, publicId: string) => void;
  onReorder: (items: any[], fromIdx: number, direction: "up" | "down") => void;
  uploadingIds: Set<string>;
}

export const ProductLineCard: React.FC<ProductLineCardProps> = ({
  productLine,
  items,
  onAddItem,
  onEdit,
  onDelete,
  onImageUpload,
  onImageDelete,
  onReorder,
  uploadingIds,
}) => {
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);

  return (
    <>
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
            onImageUpload={onImageUpload}
            onImageDelete={onImageDelete}
            onImagePreview={(img) => setPreviewImage(img)}
            onReorder={onReorder}
            uploadingIds={uploadingIds}
          />

          {/* Mobile Card View */}
          <ProductMobileCard
            productLine={productLine}
            items={items}
            onEdit={onEdit}
            onDelete={onDelete}
            onImageUpload={onImageUpload}
            onImageDelete={onImageDelete}
            onImagePreview={(img) => setPreviewImage(img)}
            onReorder={onReorder}
            uploadingIds={uploadingIds}
          />
        </CardContent>
      </Card>

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};
