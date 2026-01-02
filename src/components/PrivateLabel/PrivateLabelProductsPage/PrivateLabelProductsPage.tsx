"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Package, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useGetPrivateLabelProductsQuery,
  useCreatePrivateLabelProductMutation,
  useUpdatePrivateLabelProductMutation,
  useDeletePrivateLabelProductMutation,
} from "@/redux/api/PrivateLabel/privateLabelApi";
import { PrivateLabelProductCard } from "@/components/PrivateLabel/PrivateLabelProductCard";
import { ProductFormModal } from "@/components/PrivateLabel/ProductFormModal";
import { IPrivateLabelProduct } from "@/types";

export const PrivateLabelProductsPage: React.FC = () => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<IPrivateLabelProduct | null>(null);

  const { data, isLoading, refetch } = useGetPrivateLabelProductsQuery({
    activeOnly: false,
  });
  const [createProduct, { isLoading: creating }] =
    useCreatePrivateLabelProductMutation();
  const [updateProduct, { isLoading: updating }] =
    useUpdatePrivateLabelProductMutation();
  const [deleteProduct] = useDeletePrivateLabelProductMutation();

  const products: IPrivateLabelProduct[] = data?.products || [];

  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEditProduct = (product: IPrivateLabelProduct) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId).unwrap();
      toast.success("Product deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Error deleting product");
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      await updateProduct({ id: productId, isActive }).unwrap();
      toast.success(
        `Product ${isActive ? "activated" : "deactivated"} successfully`
      );
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Error updating product status");
    }
  };

  const handleSubmit = async (data: {
    name: string;
    unitPrice: number;
    description?: string;
    isActive: boolean;
  }) => {
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...data }).unwrap();
        toast.success("Product updated successfully");
      } else {
        await createProduct(data).unwrap();
        toast.success("Product created successfully");
      }
      setModalOpen(false);
      setEditingProduct(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Error saving product");
    }
  };

  const handleBack = () => {
    router.push("/admin/private-label-orders");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2 rounded-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1 w-full sm:w-auto">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Private Label Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage products available for private label orders
          </p>
        </div>
        <Button
          onClick={handleAddProduct}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No products found</p>
          <p className="text-muted-foreground/70 text-sm mt-1">
            Add your first product to get started
          </p>
          <Button
            onClick={handleAddProduct}
            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Products */}
          {products.filter((p) => p.isActive).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Active Products
              </h2>
              <div className="space-y-3">
                {products
                  .filter((p) => p.isActive)
                  .map((product) => (
                    <PrivateLabelProductCard
                      key={product._id}
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Inactive Products */}
          {products.filter((p) => !p.isActive).length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Inactive Products
              </h2>
              <div className="space-y-3">
                {products
                  .filter((p) => !p.isActive)
                  .map((product) => (
                    <PrivateLabelProductCard
                      key={product._id}
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
        isSubmitting={creating || updating}
      />
    </div>
  );
};

export default PrivateLabelProductsPage;
