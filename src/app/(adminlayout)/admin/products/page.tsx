"use client";

import React, { useMemo, useState } from "react";
import {
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/src/redux/api/Products/productsApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/src/components/ReUsableComponents/ConfirmDialog";

const ProductsPage = () => {
  // 🔹 Query + Mutations
  const { data, isLoading, refetch } = useGetAllProductsQuery({});
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  // 🔹 Local State
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState("");

  const products = data?.products || [];

  // 🔹 Group and sort product lines
  const groupedProducts = useMemo(() => {
    const order = ["Cannacrispy", "Fifty-One Fifty", "BLISS Cannabis Syrup"];
    const groups: Record<string, any[]> = {};
    products.forEach((p: any) => {
      if (!groups[p.productLine]) groups[p.productLine] = [];
      groups[p.productLine].push(p);
    });
    return Object.fromEntries(order.map((key) => [key, groups[key] || []]));
  }, [products]);

  // 🔹 Handlers
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success("Product deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleOpenAdd = (line: string) => {
    setEditingProduct(null);
    setSelectedLine(line);
    setOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setSelectedLine(product.productLine);
    setOpen(true);
  };

  const handleSubmit = async (values: any) => {
    let payload: any = { productLine: selectedLine };

    if (selectedLine === "Cannacrispy") {
      payload.subProductLine = values.subProductLine;
      payload.hybridBreakdown = {
        hybrid: parseFloat(values.hybrid),
        indica: parseFloat(values.indica),
        sativa: parseFloat(values.sativa),
      };
    } else if (selectedLine === "Fifty-One Fifty") {
      payload = {
        ...payload,
        itemName: values.itemName,
        price: parseFloat(values.price),
        priceDescription: values.priceDescription,
        applyDiscount: !!values.discountPrice,
        discountPrice: values.discountPrice
          ? parseFloat(values.discountPrice)
          : undefined,
        discountDescription: values.discountDescription,
      };
    } else if (selectedLine === "BLISS Cannabis Syrup") {
      payload = {
        ...payload,
        subProductLine: values.subProductLine,
        variants: [
          { label: "100Mg", price: parseFloat(values.p100) },
          { label: "300Mg", price: parseFloat(values.p300) },
          { label: "1000Mg", price: parseFloat(values.p1000) },
        ],
      };
    }

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, ...payload }).unwrap();
        toast.success("Product updated successfully");
      } else {
        await createProduct(payload).unwrap();
        toast.success("Product added successfully");
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error("Failed to save product");
    }
  };

  // 🔹 Dynamic Field Configurations
  const getFields = (): Field[] => {
    if (selectedLine === "Cannacrispy") {
      return [
        {
          name: "subProductLine",
          label: "Sub Product Line",
          placeholder: "e.g. Original",
        },
        { name: "hybrid", label: "Hybrid", placeholder: "62.5" },
        { name: "indica", label: "Indica", placeholder: "62.5" },
        { name: "sativa", label: "Sativa", placeholder: "62.5" },
      ];
    }

    if (selectedLine === "Fifty-One Fifty") {
      return [
        {
          name: "itemName",
          label: "Item Name",
          placeholder: "e.g. 100mg THC + 50mg CBN",
        },
        { name: "price", label: "Price", placeholder: "162.5" },
        { name: "discountPrice", label: "Discount Price", placeholder: "145" },
        {
          name: "priceDescription",
          label: "Price Description",
          placeholder: "$3.25/unit. 50 units/case.",
        },
        {
          name: "discountDescription",
          label: "Discount Description",
          placeholder: "$2.90/unit. 50 units/case.",
        },
      ];
    }

    if (selectedLine === "BLISS Cannabis Syrup") {
      return [
        { name: "subProductLine", label: "Flavor", placeholder: "e.g. Mango" },
        { name: "p100", label: "100Mg Price", placeholder: "81.25" },
        { name: "p300", label: "300Mg Price", placeholder: "82.5" },
        { name: "p1000", label: "1000Mg Price", placeholder: "112.5" },
      ];
    }

    return [];
  };

  // 🔹 Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Product Management
      </h1>

      <div className="space-y-10">
        {Object.entries(groupedProducts).map(([line, items]) => (
          <Card
            key={line}
            className="border border-gray-200 shadow-sm hover:shadow-md transition"
          >
            <CardHeader className="bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">{line}</CardTitle>
                <Button
                  onClick={() => handleOpenAdd(line)}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto bg-white p-4 rounded-b-lg">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="pb-2 px-3 font-medium">
                      Item / Sub-Product
                    </th>
                    {line === "Cannacrispy" && (
                      <>
                        <th className="pb-2 px-3">Hybrid</th>
                        <th className="pb-2 px-3">Indica</th>
                        <th className="pb-2 px-3">Sativa</th>
                      </>
                    )}
                    {line === "Fifty-One Fifty" && (
                      <>
                        <th className="pb-2 px-3">Price</th>
                        <th className="pb-2 px-3">Discount</th>
                      </>
                    )}
                    {line === "BLISS Cannabis Syrup" && (
                      <>
                        <th className="pb-2 px-3">100Mg</th>
                        <th className="pb-2 px-3">300Mg</th>
                        <th className="pb-2 px-3">1000Mg</th>
                      </>
                    )}
                    <th className="pb-2 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-3 text-gray-800">
                        {item.itemName || item.subProductLine}
                      </td>

                      {line === "Cannacrispy" && (
                        <>
                          <td>{item.hybridBreakdown?.hybrid || "-"}</td>
                          <td>{item.hybridBreakdown?.indica || "-"}</td>
                          <td>{item.hybridBreakdown?.sativa || "-"}</td>
                        </>
                      )}

                      {line === "Fifty-One Fifty" && (
                        <>
                          <td>${item.price?.toFixed(2)}</td>
                          <td>
                            {item.discountPrice
                              ? `$${item.discountPrice.toFixed(2)}`
                              : "-"}
                          </td>
                        </>
                      )}

                      {line === "BLISS Cannabis Syrup" && (
                        <>
                          {item.variants?.map((v: any) => (
                            <td key={v.label}>${v.price?.toFixed(2)}</td>
                          ))}
                        </>
                      )}

                      <td className="py-3 px-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="icon"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <ConfirmDialog
                            triggerText="Delete"
                            title="Delete Product?"
                            description={`Are you sure you want to delete "${
                              item.itemName || item.subProductLine
                            }"?`}
                            onConfirm={() => handleDelete(item._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Entity Modal for Add/Edit */}
      <EntityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        title={editingProduct ? `Edit ${selectedLine}` : `Add ${selectedLine}`}
        fields={getFields()}
        initialData={editingProduct || {}}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
};

export default ProductsPage;
