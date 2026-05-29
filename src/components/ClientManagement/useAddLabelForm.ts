"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";

function getUserFromStorage(): { userId: string; userType: "admin" | "rep" } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("better-user");
    if (raw) {
      const user = JSON.parse(raw);
      const userType =
        user.role === "superadmin" || user.role === "manager" ? "admin" : "rep";
      return { userId: user.id, userType };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export type ComponentEntry = { name: string; percentage: string };

export function useAddLabelForm(
  clientId: string,
  onSuccess: () => void,
  onClose: () => void,
) {
  const [flavorName, setFlavorName] = useState("");
  const [productType, setProductType] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [cannabinoidMix, setCannabinoidMix] = useState("");
  const [color, setColor] = useState("");
  const [flavorComponents, setFlavorComponents] = useState<ComponentEntry[]>([]);
  const [colorComponents, setColorComponents] = useState<ComponentEntry[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { data: productsData } = useGetPrivateLabelProductsQuery({ activeOnly: true });
  const [createLabel, { isLoading }] = useCreateLabelMutation();

  const products = productsData?.products ?? [];

  function resetForm() {
    setFlavorName("");
    setProductType("");
    setSpecialInstructions("");
    setCannabinoidMix("");
    setColor("");
    setFlavorComponents([]);
    setColorComponents([]);
    setFiles([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!flavorName.trim()) { toast.error("Please enter a flavor name"); return; }
    if (!productType) { toast.error("Please select a product type"); return; }

    try {
      const userInfo = getUserFromStorage();
      const formData = new FormData();

      formData.append("clientId", clientId);
      formData.append("flavorName", flavorName.trim());
      formData.append("productType", productType);
      if (specialInstructions.trim()) formData.append("specialInstructions", specialInstructions.trim());
      if (cannabinoidMix.trim()) formData.append("cannabinoidMix", cannabinoidMix.trim());
      if (color.trim()) formData.append("color", color.trim());
      if (flavorComponents.length > 0) {
        formData.append(
          "flavorComponents",
          JSON.stringify(flavorComponents.map((c) => ({ name: c.name.trim(), percentage: Number(c.percentage) }))),
        );
      }
      if (colorComponents.length > 0) {
        formData.append(
          "colorComponents",
          JSON.stringify(colorComponents.map((c) => ({ name: c.name.trim(), percentage: Number(c.percentage) }))),
        );
      }
      if (userInfo) {
        formData.append("userId", userInfo.userId);
        formData.append("userType", userInfo.userType);
      }
      files.forEach((file) => formData.append("labelImages", file));

      await createLabel(formData).unwrap();
      toast.success("Label created successfully!");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message ?? "Failed to create label");
    }
  }

  return {
    // field state
    flavorName, setFlavorName,
    productType, setProductType,
    specialInstructions, setSpecialInstructions,
    cannabinoidMix, setCannabinoidMix,
    color, setColor,
    flavorComponents, setFlavorComponents,
    colorComponents, setColorComponents,
    // file state
    files, isDragging,
    handleFileChange, handleDragOver, handleDragLeave, handleDrop, removeFile,
    // data
    products, isLoading,
    // actions
    handleSubmit,
    handleOpenChange: (isOpen: boolean) => { if (!isOpen) onClose(); },
  };
}
