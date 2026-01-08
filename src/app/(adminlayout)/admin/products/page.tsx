"use client";

import React, { useMemo, useState } from "react";
import {
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/Products/productsApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Edit,
  Plus,
  Package,
  DollarSign,
  Percent,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  EntityModal,
  type Field,
} from "@/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

    // Custom sort for Cannacrispy
    if (groups["Cannacrispy"]) {
      const cannacrispyOrder = [
        "Original",
        "Fruity",
        "Chocolate",
        "Cookies & Cream",
        "Peanut Butter & Chocolate",
        "Strawberry",
      ];
      groups["Cannacrispy"].sort((a, b) => {
        const indexA = cannacrispyOrder.indexOf(a.subProductLine);
        const indexB = cannacrispyOrder.indexOf(b.subProductLine);
        // Items not in the list go to the end
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
      });
    }

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
        flatData.hybridUnits =
          product.prices.hybrid?.price ?? flatData.hybridUnits;
        flatData.hybridDiscount = product.prices.hybrid?.discountPrice ?? "";
        flatData.indicaUnits =
          product.prices.indica?.price ?? flatData.indicaUnits;
        flatData.indicaDiscount = product.prices.indica?.discountPrice ?? "";
        flatData.sativaUnits =
          product.prices.sativa?.price ?? flatData.sativaUnits;
        flatData.sativaDiscount = product.prices.sativa?.discountPrice ?? "";
      }

      // ✅ Backward-compatibility (legacy discounts field)
      if (product.discounts) {
        flatData.hybridDiscount =
          product.discounts.hybrid ?? flatData.hybridDiscount;
        flatData.indicaDiscount =
          product.discounts.indica ?? flatData.indicaDiscount;
        flatData.sativaDiscount =
          product.discounts.sativa ?? flatData.sativaDiscount;
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
        ? Number.parseFloat(values.hybridUnits)
        : undefined;
      payload.hybridDiscount = values.hybridDiscount
        ? Number.parseFloat(values.hybridDiscount)
        : undefined;
      payload.indicaUnits = values.indicaUnits
        ? Number.parseFloat(values.indicaUnits)
        : undefined;
      payload.indicaDiscount = values.indicaDiscount
        ? Number.parseFloat(values.indicaDiscount)
        : undefined;
      payload.sativaUnits = values.sativaUnits
        ? Number.parseFloat(values.sativaUnits)
        : undefined;
      payload.sativaDiscount = values.sativaDiscount
        ? Number.parseFloat(values.sativaDiscount)
        : undefined;
    }

    // 🔹 Fifty-One Fifty
    else if (selectedLine === "Fifty-One Fifty") {
      const discountPrice = values.discountPrice
        ? Number.parseFloat(values.discountPrice)
        : 0;

      payload = {
        ...payload,
        itemName: values.itemName,
        price: Number.parseFloat(values.price),
        priceDescription: values.priceDescription,
        discountPrice: discountPrice,
        discountDescription: values.discountDescription || "",
        applyDiscount: discountPrice > 0,
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
            price: Number.parseFloat(values.p100),
            discountPrice: values.dp100
              ? Number.parseFloat(values.dp100)
              : undefined,
          },
          {
            label: "300Mg",
            price: Number.parseFloat(values.p300),
            discountPrice: values.dp300
              ? Number.parseFloat(values.dp300)
              : undefined,
          },
          {
            label: "1000Mg",
            price: Number.parseFloat(values.p1000),
            discountPrice: values.dp1000
              ? Number.parseFloat(values.dp1000)
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
        {
          name: "itemName",
          label: "Item Name",
          placeholder: "100mg THC + 50mg CBN",
        },
        { name: "price", label: "Unit Price", placeholder: "162.5" },
        {
          name: "discountPrice",
          label: "Discounted Price",
          placeholder: "145",
        },
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
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          Product Management
        </h1>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([line, items]) => (
          <Card
            key={line}
            className="border border-border rounded-xs shadow-sm hover:shadow-md transition bg-card py-0"
          >
            <CardHeader className="bg-primary dark:bg-primary rounded-t-xs p-3 md:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-base md:text-lg font-semibold text-white">
                  {line}
                </CardTitle>
                <Button
                  onClick={() => handleOpenAdd(line)}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm flex items-center gap-2 rounded-xs h-8"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto bg-card p-0 rounded-b-xs scrollbar-hidden">
              {/* Desktop Table View */}
              <table className="min-w-full border-collapse hidden md:table">
                <thead>
                  <tr className="text-left text-muted-foreground bg-secondary/30 dark:bg-secondary/10">
                    <th className="py-3 px-3 font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4" />
                        Item / Sub-Product
                      </div>
                    </th>

                    {line === "Cannacrispy" && (
                      <>
                        <th className="py-3 px-2 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            Hybrid
                          </div>
                        </th>
                        <th className="py-3 px-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5" />
                            Discount
                          </div>
                        </th>
                        <th className="py-3 px-2 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            Indica
                          </div>
                        </th>
                        <th className="py-3 px-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5" />
                            Discount
                          </div>
                        </th>
                        <th className="py-3 px-2 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            Sativa
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

                    {line === "Fifty-One Fifty" && (
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

                    {line === "BLISS Cannabis Syrup" && (
                      <>
                        <th className="py-3 px-2 text-sm">100Mg</th>
                        <th className="py-3 px-2 text-sm">Discount</th>
                        <th className="py-3 px-2 text-sm">300Mg</th>
                        <th className="py-3 px-2 text-sm">Discount</th>
                        <th className="py-3 px-2 text-sm">1000Mg</th>
                        <th className="py-3 px-2 text-sm">Discount</th>
                      </>
                    )}

                    <th className="py-3 px-3 text-center text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <Settings className="w-3.5 h-3.5" />
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item: any) => (
                    <tr
                      key={item._id}
                      className="border-b border-border hover:bg-secondary/20 dark:hover:bg-secondary/10 transition"
                    >
                      <td className="py-3 px-3 text-foreground font-medium">
                        {item.itemName || item.subProductLine}
                      </td>

                      {line === "Cannacrispy" && (
                        <>
                          <td className="py-3 px-2 text-foreground">
                            {item.prices?.hybrid?.price ??
                              item.hybridBreakdown?.hybrid ??
                              "-"}
                          </td>
                          <td className="py-3 px-2 text-primary font-medium">
                            {item.prices?.hybrid?.discountPrice
                              ? `$${item.prices.hybrid.discountPrice.toFixed(
                                  2
                                )}`
                              : "-"}
                          </td>
                          <td className="py-3 px-2 text-foreground">
                            {item.prices?.indica?.price ??
                              item.hybridBreakdown?.indica ??
                              "-"}
                          </td>
                          <td className="py-3 px-2 text-primary font-medium">
                            {item.prices?.indica?.discountPrice
                              ? `$${item.prices.indica.discountPrice.toFixed(
                                  2
                                )}`
                              : "-"}
                          </td>
                          <td className="py-3 px-2 text-foreground">
                            {item.prices?.sativa?.price ??
                              item.hybridBreakdown?.sativa ??
                              "-"}
                          </td>
                          <td className="py-3 px-2 text-primary font-medium">
                            {item.prices?.sativa?.discountPrice
                              ? `$${item.prices.sativa.discountPrice.toFixed(
                                  2
                                )}`
                              : "-"}
                          </td>
                        </>
                      )}

                      {line === "Fifty-One Fifty" && (
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

                      {line === "BLISS Cannabis Syrup" && (
                        <>
                          {item.variants?.map((v: any) => (
                            <React.Fragment key={v.label}>
                              <td className="py-3 px-2 text-foreground">
                                ${v.price?.toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-primary font-medium">
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  className="bg-secondary text-white hover:bg-primary rounded-xs h-8 w-8"
                                  onClick={() => handleOpenEdit(item)}
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
                            onConfirm={() => handleDelete(item._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="md:hidden divide-y divide-border">
                {items.map((item: any) => (
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
                                onClick={() => handleOpenEdit(item)}
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
                          }"?`}
                          onConfirm={() => handleDelete(item._id)}
                        />
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="bg-secondary/30 dark:bg-secondary/10 rounded-xs p-2 text-sm space-y-1">
                      {line === "Cannacrispy" && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">
                              Hybrid:
                            </span>
                            <span className="text-foreground">
                              {item.prices?.hybrid?.price ??
                                item.hybridBreakdown?.hybrid ??
                                "-"}
                            </span>
                            {item.prices?.hybrid?.discountPrice && (
                              <span className="text-primary font-medium">
                                ${item.prices.hybrid.discountPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">
                              Indica:
                            </span>
                            <span className="text-foreground">
                              {item.prices?.indica?.price ??
                                item.hybridBreakdown?.indica ??
                                "-"}
                            </span>
                            {item.prices?.indica?.discountPrice && (
                              <span className="text-primary font-medium">
                                ${item.prices.indica.discountPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-medium">
                              Sativa:
                            </span>
                            <span className="text-foreground">
                              {item.prices?.sativa?.price ??
                                item.hybridBreakdown?.sativa ??
                                "-"}
                            </span>
                            {item.prices?.sativa?.discountPrice && (
                              <span className="text-primary font-medium">
                                ${item.prices.sativa.discountPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {line === "Fifty-One Fifty" && (
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

                      {line === "BLISS Cannabis Syrup" && (
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
                ))}
              </div>
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
