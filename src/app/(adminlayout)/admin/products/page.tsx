"use client";

import React, { useMemo } from "react";
import { useGetAllProductsQuery } from "@/redux/api/Products/productsApi";
import { useGetActiveProductLinesQuery } from "@/redux/api/ProductLines/productLinesApi";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Package } from "lucide-react";
import { EntityModal } from "@/components/ReUsableComponents/EntityModal";
import { ProductLineModal } from "@/components/pages/Products/ProductLineModal";
import { ProductLineCard } from "@/components/pages/Products/ProductLineCard";
import { useProductHandlers } from "@/redux/hooks/useProductHandlers";
import { useProductFields } from "@/redux/hooks/useProductFields";
import { groupProductsByLine } from "@/components/pages/Products/utils";

const ProductsPage = () => {
  const { data, isLoading, refetch } = useGetAllProductsQuery({});
  const {
    data: productLinesData,
    isLoading: isLoadingProductLines,
    refetch: refetchProductLines,
  } = useGetActiveProductLinesQuery();

  const products = data?.products || [];
  const productLines = productLinesData?.productLines || [];

  // Use custom hook for all handlers and state management
  const {
    open,
    setOpen,
    initialModalData,
    selectedLine,
    productLineModalOpen,
    setProductLineModalOpen,
    editingProductLine,
    isCreating,
    isUpdating,
    isCreatingProductLine,
    isUpdatingProductLine,
    handleDelete,
    handleOpenAdd,
    handleOpenEdit,
    handleOpenAddProductLine,
    handleProductLineSubmit,
    handleSubmit,
  } = useProductHandlers(refetch, refetchProductLines);

  // Group & order product lines dynamically
  const groupedProducts = useMemo(
    () => groupProductsByLine(products, productLines),
    [products, productLines]
  );

  // Get dynamic fields for modal based on ProductLine configuration
  const fields = useProductFields(selectedLine);

  if (isLoading || isLoadingProductLines) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
            Product Management
          </h1>
        </div>
        <Button
          onClick={handleOpenAddProductLine}
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xs"
        >
          <Plus className="w-4 h-4" /> Add Product Line
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([line, items]) => {
          const productLineObj = productLines.find((pl) => pl.name === line);
          if (!productLineObj) return null;

          return (
            <ProductLineCard
              key={line}
              productLine={productLineObj}
              items={items}
              onAddItem={handleOpenAdd}
              onEdit={(item) => handleOpenEdit(item, productLines)}
              onDelete={handleDelete}
            />
          );
        })}
      </div>

      {/* Product Modal */}
      <EntityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        title={
          initialModalData
            ? `Edit ${selectedLine?.name || "Product"}`
            : `Add ${selectedLine?.name || "Product"}`
        }
        fields={fields}
        initialData={initialModalData}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Product Line Modal */}
      <ProductLineModal
        open={productLineModalOpen}
        onClose={() => setProductLineModalOpen(false)}
        onSubmit={handleProductLineSubmit}
        isSubmitting={isCreatingProductLine || isUpdatingProductLine}
        editingProductLine={editingProductLine}
      />
    </div>
  );
};

export default ProductsPage;
