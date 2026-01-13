"use client";

import React, { useMemo, useState } from "react";
import {
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/Products/productsApi";
import {
  useGetActiveProductLinesQuery,
  useCreateProductLineMutation,
  useUpdateProductLineMutation,
  type IProductLine,
} from "@/redux/api/ProductLines/productLinesApi";
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
import { ProductLineModal } from "@/components/pages/Products/ProductLineModal";

const ProductsPage = () => {
  const { data, isLoading, refetch } = useGetAllProductsQuery({});
  const { data: productLinesData, isLoading: isLoadingProductLines, refetch: refetchProductLines } =
    useGetActiveProductLinesQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [createProductLine, { isLoading: isCreatingProductLine }] = useCreateProductLineMutation();
  const [updateProductLine, { isLoading: isUpdatingProductLine }] = useUpdateProductLineMutation();

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [initialModalData, setInitialModalData] = useState<any | null>(null);
  const [selectedLine, setSelectedLine] = useState<IProductLine | null>(null);

  // Product Line Modal State
  const [productLineModalOpen, setProductLineModalOpen] = useState(false);
  const [editingProductLine, setEditingProductLine] = useState<IProductLine | null>(null);

  const products = data?.products || [];
  const productLines = productLinesData?.productLines || [];

  // Group & order product lines dynamically
  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};

    products.forEach((p: any) => {
      const productLineName = p.productLine?.name || p.productLine;
      if (!groups[productLineName]) groups[productLineName] = [];
      groups[productLineName].push(p);
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
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
      });
    }

    // Return groups ordered by productLines displayOrder
    // ✅ Show ALL active product lines, even if they have no products
    const orderedGroups: Record<string, any[]> = {};
    [...productLines]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((pl) => {
        // Initialize with empty array if no products exist for this line
        orderedGroups[pl.name] = groups[pl.name] || [];
      });

    return orderedGroups;
  }, [products, productLines]);

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

  const handleOpenAdd = (productLine: IProductLine) => {
    setEditingProduct(null);
    setInitialModalData(null);
    setSelectedLine(productLine);
    setOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    const productLineObj =
      typeof product.productLine === "object"
        ? product.productLine
        : productLines.find((pl) => pl._id === product.productLine);
    setSelectedLine(productLineObj || null);

    const flatData: any = { ...product };

    if (!productLineObj) {
      setInitialModalData(flatData);
      setOpen(true);
      return;
    }

    // Handle multi-type pricing (e.g., Cannacrispy with hybrid/indica/sativa)
    if (productLineObj.pricingStructure.type === "multi-type") {
      if (product.hybridBreakdown) {
        flatData.hybridUnits = product.hybridBreakdown.hybrid ?? "";
        flatData.indicaUnits = product.hybridBreakdown.indica ?? "";
        flatData.sativaUnits = product.hybridBreakdown.sativa ?? "";
      }

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

      if (product.discounts) {
        flatData.hybridDiscount =
          product.discounts.hybrid ?? flatData.hybridDiscount;
        flatData.indicaDiscount =
          product.discounts.indica ?? flatData.indicaDiscount;
        flatData.sativaDiscount =
          product.discounts.sativa ?? flatData.sativaDiscount;
      }
    }

    // Handle variants pricing (e.g., BLISS Cannabis Syrup)
    if (
      productLineObj.pricingStructure.type === "variants" &&
      product.variants
    ) {
      product.variants.forEach((v: any) => {
        const variantKey = v.label.replace(/\s/g, "").toLowerCase();
        flatData[`p${variantKey}`] = v.price;
        flatData[`dp${variantKey}`] = v.discountPrice ?? "";
      });
    }

    setInitialModalData(flatData);
    setOpen(true);
  };

  const handleOpenAddProductLine = () => {
    setEditingProductLine(null);
    setProductLineModalOpen(true);
  };

  const handleProductLineSubmit = async (data: any) => {
    try {
      if (editingProductLine) {
        await updateProductLine(data).unwrap();
        toast.success("Product line updated successfully");
      } else {
        await createProductLine(data).unwrap();
        toast.success("Product line created successfully");
      }
      setProductLineModalOpen(false);
      refetchProductLines();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save product line");
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedLine) {
      toast.error("Product line not selected");
      return;
    }

    let payload: any = { productLine: selectedLine._id };

    // 🔹 Multi-type pricing (e.g., Cannacrispy)
    if (selectedLine.pricingStructure.type === "multi-type") {
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

    // 🔹 Simple pricing (e.g., Fifty-One Fifty)
    else if (selectedLine.pricingStructure.type === "simple") {
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

    // 🔹 Variants pricing (e.g., BLISS)
    else if (selectedLine.pricingStructure.type === "variants") {
      const variants = selectedLine.pricingStructure.variantLabels?.map((variant) => {
        const variantKey = variant.replace(/\s/g, "").toLowerCase();
        const priceKey = `p${variantKey}`;
        const discountKey = `dp${variantKey}`;

        const variantData: any = {
          label: variant,
          price: Number.parseFloat(values[priceKey]),
        };

        // Only include discountPrice if it has a value
        if (values[discountKey] && values[discountKey] !== "") {
          variantData.discountPrice = Number.parseFloat(values[discountKey]);
        }

        return variantData;
      }) || [];

      payload = {
        ...payload,
        subProductLine: values.subProductLine,
        variants,
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

  // Dynamic fields for modal based on ProductLine configuration
  const getFields = (): Field[] => {
    if (!selectedLine) return [];

    const fields: Field[] = [];

    // Add custom fields from ProductLine configuration
    selectedLine.fields.forEach((field) => {
      fields.push({
        name: field.name,
        label: field.label,
        placeholder: field.placeholder || "",
      });
    });

    // Add pricing fields based on pricing structure type
    if (selectedLine.pricingStructure.type === "multi-type") {
      // Add fields for each type (e.g., hybrid, indica, sativa)
      selectedLine.pricingStructure.typeLabels?.forEach((type) => {
        fields.push(
          {
            name: `${type}Units`,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Unit Price`,
          },
          {
            name: `${type}Discount`,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Discount Price`,
          }
        );
      });
    } else if (selectedLine.pricingStructure.type === "simple") {
      fields.push(
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
        }
      );
    } else if (selectedLine.pricingStructure.type === "variants") {
      // Add fields for each variant (e.g., 100Mg, 300Mg, 1000Mg)
      selectedLine.pricingStructure.variantLabels?.forEach((variant) => {
        const variantKey = variant.replace(/\s/g, "").toLowerCase();
        fields.push(
          {
            name: `p${variantKey}`,
            label: `${variant} Price`,
            placeholder: "81.25",
          },
          {
            name: `dp${variantKey}`,
            label: `${variant} Discount Price`,
            placeholder: "70",
          }
        );
      });
    }

    return fields;
  };

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
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product Line
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([line, items]) => {
          const productLineObj = productLines.find((pl) => pl.name === line);
          if (!productLineObj) return null;

          return (
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
                    onClick={() => handleOpenAdd(productLineObj)}
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

                    {/* Dynamic headers based on pricing structure */}
                    {productLineObj.pricingStructure.type === "multi-type" &&
                      productLineObj.pricingStructure.typeLabels?.map((type) => (
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
                      ))
                    }

                    {productLineObj.pricingStructure.type === "simple" && (
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

                    {productLineObj.pricingStructure.type === "variants" &&
                      productLineObj.pricingStructure.variantLabels?.map((variant) => (
                        <React.Fragment key={variant}>
                          <th className="py-3 px-2 text-sm">{variant}</th>
                          <th className="py-3 px-2 text-sm">Discount</th>
                        </React.Fragment>
                      ))
                    }

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
                      {productLineObj.pricingStructure.type === "multi-type" &&
                        productLineObj.pricingStructure.typeLabels?.map((type) => (
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
                        ))
                      }

                      {productLineObj.pricingStructure.type === "simple" && (
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

                      {productLineObj.pricingStructure.type === "variants" &&
                        item.variants?.map((v: any) => (
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
                        ))
                      }

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
                  ))
                  )}
                </tbody>
              </table>

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
                      {/* Dynamic mobile view based on pricing structure */}
                      {productLineObj.pricingStructure.type === "multi-type" && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {productLineObj.pricingStructure.typeLabels?.map((type) => (
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

                      {productLineObj.pricingStructure.type === "simple" && (
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

                      {productLineObj.pricingStructure.type === "variants" && (
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
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Product Modal */}
      <EntityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        title={
          editingProduct
            ? `Edit ${selectedLine?.name || "Product"}`
            : `Add ${selectedLine?.name || "Product"}`
        }
        fields={getFields()}
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
