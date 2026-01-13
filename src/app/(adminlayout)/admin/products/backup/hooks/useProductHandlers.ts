import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/Products/productsApi";
import {
  useCreateProductLineMutation,
  useUpdateProductLineMutation,
  type IProductLine,
} from "@/redux/api/ProductLines/productLinesApi";

export const useProductHandlers = (
  refetch: () => void,
  refetchProductLines: () => void
) => {
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [createProductLine, { isLoading: isCreatingProductLine }] =
    useCreateProductLineMutation();
  const [updateProductLine, { isLoading: isUpdatingProductLine }] =
    useUpdateProductLineMutation();

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [initialModalData, setInitialModalData] = useState<any | null>(null);
  const [selectedLine, setSelectedLine] = useState<IProductLine | null>(null);
  const [productLineModalOpen, setProductLineModalOpen] = useState(false);
  const [editingProductLine, setEditingProductLine] =
    useState<IProductLine | null>(null);

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

  const handleOpenEdit = (
    product: any,
    productLines: IProductLine[]
  ) => {
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

  return {
    open,
    setOpen,
    editingProduct,
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
  };
};
