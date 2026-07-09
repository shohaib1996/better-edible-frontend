import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
  useBatchUpdateProductOrderMutation,
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
  const [uploadProductImages] = useUploadProductImagesMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();
  const [batchUpdateProductOrder] = useBatchUpdateProductOrderMutation();
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
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

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

    // Exclude nested pricing objects so they don't leak into form submission
    const { hybridBreakdown: _hb, prices: _pr, discounts: _dc, variants: _va, ...rest } = product;
    const flatData: any = { ...rest };

    if (!productLineObj) {
      setInitialModalData(flatData);
      setOpen(true);
      return;
    }

    // Handle multi-type pricing (e.g., Cannacrispy with hybrid/indica/sativa)
    if (productLineObj.pricingStructure.type === "multi-type") {
      const typeLabels = productLineObj.pricingStructure.typeLabels ?? [];
      typeLabels.forEach((type: string) => {
        const lowerType = type.toLowerCase();
        const unitKey = `${type}Units`;
        const discountKey = `${type}Discount`;

        if (product.hybridBreakdown) {
          flatData[unitKey] = product.hybridBreakdown[lowerType] ?? "";
        }

        if (product.prices) {
          flatData[unitKey] = product.prices[lowerType]?.price ?? flatData[unitKey] ?? "";
          flatData[discountKey] = product.prices[lowerType]?.discountPrice ?? "";
        }

        if (product.discounts) {
          flatData[discountKey] = product.discounts[lowerType] ?? flatData[discountKey] ?? "";
        }
      });
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
      selectedLine.pricingStructure.typeLabels?.forEach((type) => {
        const unitKey = `${type}Units`;
        const discountKey = `${type}Discount`;
        const normalizedUnitKey = `${type.toLowerCase()}Units`;
        const normalizedDiscountKey = `${type.toLowerCase()}Discount`;
        const unitVal = values[unitKey] ?? values[normalizedUnitKey];
        const discountVal = values[discountKey] ?? values[normalizedDiscountKey];
        if (unitVal !== undefined && unitVal !== "") {
          payload[normalizedUnitKey] = Number.parseFloat(unitVal);
        }
        if (discountVal !== undefined && discountVal !== "") {
          payload[normalizedDiscountKey] = Number.parseFloat(discountVal);
        }
      });
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

  // 🖼️ Upload images for a product
  const handleImageUpload = async (productId: string, files: FileList | null) => {
    if (!files?.length) return;
    setUploadingIds((prev) => new Set(prev).add(productId));
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));
      await uploadProductImages({ id: productId, formData }).unwrap();
      toast.success(`${files.length > 1 ? `${files.length} images` : "Image"} uploaded`);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // 🗑️ Delete a single product image
  const handleImageDelete = async (productId: string, publicId: string) => {
    try {
      await deleteProductImage({ id: productId, publicId }).unwrap();
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  // 🔢 Reorder items within a product line
  const handleReorder = async (items: any[], fromIdx: number, direction: "up" | "down") => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= items.length) return;

    // Build new order array with the two items swapped
    const newItems = [...items];
    [newItems[fromIdx], newItems[toIdx]] = [newItems[toIdx], newItems[fromIdx]];

    // Assign (idx + 1) * 10 so 0 remains the sentinel for "never manually ordered"
    const updates = newItems.map((item, idx) => ({
      id: item._id,
      displayOrder: (idx + 1) * 10,
    }));

    try {
      await batchUpdateProductOrder(updates).unwrap();
    } catch {
      toast.error("Failed to reorder");
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
    uploadingIds,
    handleDelete,
    handleOpenAdd,
    handleOpenEdit,
    handleOpenAddProductLine,
    handleProductLineSubmit,
    handleSubmit,
    handleImageUpload,
    handleImageDelete,
    handleReorder,
  };
};
