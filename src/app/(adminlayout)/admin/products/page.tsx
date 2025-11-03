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
  const { data, isLoading, refetch } = useGetAllProductsQuery({});
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [initialModalData, setInitialModalData] = useState<any | null>(null);
  const [selectedLine, setSelectedLine] = useState("");

  const products = data?.products || [];

  // Group & order product lines
  const groupedProducts = useMemo(() => {
    const order = ["Cannacrispy", "Fifty-One Fifty", "BLISS Cannabis Syrup"];
    const groups: Record<string, any[]> = {};
    products.forEach((p: any) => {
      if (!groups[p.productLine]) groups[p.productLine] = [];
      groups[p.productLine].push(p);
    });
    return Object.fromEntries(order.map((key) => [key, groups[key] || []]));
  }, [products]);

  // CRUD handlers
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
    setInitialModalData(null);
    setSelectedLine(line);
    setOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setSelectedLine(product.productLine);

    const flatData: any = { ...product };

    if (product.productLine === "Cannacrispy") {
      // Units
      if (product.hybridBreakdown) {
        flatData.hybridUnits = product.hybridBreakdown.hybrid ?? "";
        flatData.indicaUnits = product.hybridBreakdown.indica ?? "";
        flatData.sativaUnits = product.hybridBreakdown.sativa ?? "";
      }

      // ✅ Prices & Discounts (new schema)
      if (product.prices) {
        flatData.hybridUnits = product.prices.hybrid?.price ?? flatData.hybridUnits;
        flatData.hybridDiscount = product.prices.hybrid?.discountPrice ?? "";
        flatData.indicaUnits = product.prices.indica?.price ?? flatData.indicaUnits;
        flatData.indicaDiscount = product.prices.indica?.discountPrice ?? "";
        flatData.sativaUnits = product.prices.sativa?.price ?? flatData.sativaUnits;
        flatData.sativaDiscount = product.prices.sativa?.discountPrice ?? "";
      }

      // ✅ Backward-compatibility (legacy discounts field)
      if (product.discounts) {
        flatData.hybridDiscount = product.discounts.hybrid ?? flatData.hybridDiscount;
        flatData.indicaDiscount = product.discounts.indica ?? flatData.indicaDiscount;
        flatData.sativaDiscount = product.discounts.sativa ?? flatData.sativaDiscount;
      }
    }

    if (product.productLine === "BLISS Cannabis Syrup" && product.variants) {
      product.variants.forEach((v: any) => {
        if (v.label === "100Mg") {
          flatData.p100 = v.price;
          flatData.dp100 = v.discountPrice;
        }
        if (v.label === "300Mg") {
          flatData.p300 = v.price;
          flatData.dp300 = v.discountPrice;
        }
        if (v.label === "1000Mg") {
          flatData.p1000 = v.price;
          flatData.dp1000 = v.discountPrice;
        }
      });
    }

    setInitialModalData(flatData);
    setOpen(true);
  };

  const handleSubmit = async (values: any) => {
    let payload: any = { productLine: selectedLine };

    // 🔹 Cannacrispy
    if (selectedLine === "Cannacrispy") {
      payload.subProductLine = values.subProductLine;
      payload.hybridUnits = values.hybridUnits
        ? parseFloat(values.hybridUnits)
        : undefined;
      payload.hybridDiscount = values.hybridDiscount
        ? parseFloat(values.hybridDiscount)
        : undefined;
      payload.indicaUnits = values.indicaUnits
        ? parseFloat(values.indicaUnits)
        : undefined;
      payload.indicaDiscount = values.indicaDiscount
        ? parseFloat(values.indicaDiscount)
        : undefined;
      payload.sativaUnits = values.sativaUnits
        ? parseFloat(values.sativaUnits)
        : undefined;
      payload.sativaDiscount = values.sativaDiscount
        ? parseFloat(values.sativaDiscount)
        : undefined;
    }

    // 🔹 Fifty-One Fifty
    else if (selectedLine === "Fifty-One Fifty") {
      payload = {
        ...payload,
        itemName: values.itemName,
        price: parseFloat(values.price),
        priceDescription: values.priceDescription,
        discountPrice: values.discountPrice
          ? parseFloat(values.discountPrice)
          : undefined,
        discountDescription: values.discountDescription,
      };
    }

    // 🔹 BLISS
    else if (selectedLine === "BLISS Cannabis Syrup") {
      payload = {
        ...payload,
        subProductLine: values.subProductLine,
        variants: [
          {
            label: "100Mg",
            price: parseFloat(values.p100),
            discountPrice: values.dp100
              ? parseFloat(values.dp100)
              : undefined,
          },
          {
            label: "300Mg",
            price: parseFloat(values.p300),
            discountPrice: values.dp300
              ? parseFloat(values.dp300)
              : undefined,
          },
          {
            label: "1000Mg",
            price: parseFloat(values.p1000),
            discountPrice: values.dp1000
              ? parseFloat(values.dp1000)
              : undefined,
          },
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

  // Dynamic fields for modal
  const getFields = (): Field[] => {
    if (selectedLine === "Cannacrispy") {
      return [
        {
          name: "subProductLine",
          label: "Sub Product Line",
          placeholder: "e.g. Strawberry",
        },
        { name: "hybridUnits", label: "Hybrid Unit Price" },
        { name: "hybridDiscount", label: "Hybrid Discount Price" },
        { name: "indicaUnits", label: "Indica Unit Price" },
        { name: "indicaDiscount", label: "Indica Discount Price" },
        { name: "sativaUnits", label: "Sativa Unit Price" },
        { name: "sativaDiscount", label: "Sativa Discount Price" },
      ];
    }

    if (selectedLine === "Fifty-One Fifty") {
      return [
        { name: "itemName", label: "Item Name", placeholder: "100mg THC + 50mg CBN" },
        { name: "price", label: "Unit Price", placeholder: "162.5" },
        { name: "discountPrice", label: "Discounted Price", placeholder: "145" },
        { name: "priceDescription", label: "Price Description", placeholder: "$3.25/unit. 50 units/case." },
        { name: "discountDescription", label: "Discount Description", placeholder: "$2.90/unit. 50 units/case." },
      ];
    }

    if (selectedLine === "BLISS Cannabis Syrup") {
      return [
        { name: "subProductLine", label: "Flavor", placeholder: "Mango" },
        { name: "p100", label: "100Mg Price", placeholder: "81.25" },
        { name: "dp100", label: "100Mg Discount Price", placeholder: "70" },
        { name: "p300", label: "300Mg Price", placeholder: "82.5" },
        { name: "dp300", label: "300Mg Discount Price", placeholder: "72" },
        { name: "p1000", label: "1000Mg Price", placeholder: "112.5" },
        { name: "dp1000", label: "1000Mg Discount Price", placeholder: "90" },
      ];
    }

    return [];
  };

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
                    <th className="pb-2 px-3 font-medium">Item / Sub-Product</th>

                    {line === "Cannacrispy" && (
                      <>
                        <th>Hybrid Units</th>
                        <th>Hybrid Discount</th>
                        <th>Indica Units</th>
                        <th>Indica Discount</th>
                        <th>Sativa Units</th>
                        <th>Sativa Discount</th>
                      </>
                    )}

                    {line === "Fifty-One Fifty" && (
                      <>
                        <th>Unit Price</th>
                        <th>Discount Price</th>
                      </>
                    )}

                    {line === "BLISS Cannabis Syrup" && (
                      <>
                        <th>100Mg</th>
                        <th>100Mg Discount</th>
                        <th>300Mg</th>
                        <th>300Mg Discount</th>
                        <th>1000Mg</th>
                        <th>1000Mg Discount</th>
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
                          {/* Hybrid */}
                          <td>{item.prices?.hybrid?.price ?? item.hybridBreakdown?.hybrid ?? "-"}</td>
                          <td className="text-emerald-600">
                            {item.prices?.hybrid?.discountPrice
                              ? `$${item.prices.hybrid.discountPrice.toFixed(2)}`
                              : "-"}
                          </td>

                          {/* Indica */}
                          <td>{item.prices?.indica?.price ?? item.hybridBreakdown?.indica ?? "-"}</td>
                          <td className="text-emerald-600">
                            {item.prices?.indica?.discountPrice
                              ? `$${item.prices.indica.discountPrice.toFixed(2)}`
                              : "-"}
                          </td>

                          {/* Sativa */}
                          <td>{item.prices?.sativa?.price ?? item.hybridBreakdown?.sativa ?? "-"}</td>
                          <td className="text-emerald-600">
                            {item.prices?.sativa?.discountPrice
                              ? `$${item.prices.sativa.discountPrice.toFixed(2)}`
                              : "-"}
                          </td>
                        </>
                      )}

                      {line === "Fifty-One Fifty" && (
                        <>
                          <td>${item.price?.toFixed(2)}</td>
                          <td className="text-emerald-600">
                            {item.discountPrice
                              ? `$${item.discountPrice.toFixed(2)}`
                              : "-"}
                          </td>
                        </>
                      )}

                      {line === "BLISS Cannabis Syrup" && (
                        <>
                          {item.variants?.map((v: any) => (
                            <React.Fragment key={v.label}>
                              <td>${v.price?.toFixed(2)}</td>
                              <td className="text-emerald-600">
                                {v.discountPrice
                                  ? `$${v.discountPrice.toFixed(2)}`
                                  : "-"}
                              </td>
                            </React.Fragment>
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

      {/* Modal */}
      <EntityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        title={editingProduct ? `Edit ${selectedLine}` : `Add ${selectedLine}`}
        fields={getFields()}
        initialData={initialModalData}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
};

export default ProductsPage;
