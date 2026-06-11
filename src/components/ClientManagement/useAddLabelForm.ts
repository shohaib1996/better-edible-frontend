"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCreateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { getUserFromStorage } from "@/lib/getUserFromStorage";
import type { ComponentEntry } from "./LabelComponentList";

const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;

export interface AddLabelInitialValues {
  flavorName?: string;
  cannabinoidMix?: string;
  specialInstructions?: string;
  productTypeKeyword?: string;
  submissionLabelId?: string;
  gummyColorHex?: string;
  gummyColorName?: string;
  selectedFlavors?: string[];
  // gummy spec fields passed through from store submission
  size?: "standard" | "xl";
  oilType?: "biomax" | "rosin";
  effect?: "hybrid" | "indica" | "sativa";
  cannabinoids?: { name: string; mg: number; priceAdd: number }[];
  unitsOrdered?: number;
  unitCost?: number;
  totalCost?: number;
}

export function useAddLabelForm(
  clientId: string,
  onSuccess: () => void,
  onClose: () => void,
  initialValues?: AddLabelInitialValues,
) {
  const [flavorName, setFlavorName] = useState(initialValues?.flavorName ?? "");
  const [productType, setProductType] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState(initialValues?.specialInstructions ?? "");
  const [cannabinoidMix, setCannabinoidMix] = useState(initialValues?.cannabinoidMix ?? "");
  const [color, setColor] = useState(initialValues?.gummyColorName ?? initialValues?.gummyColorHex ?? "");
  const [flavorComponents, setFlavorComponents] = useState<ComponentEntry[]>(() => {
    const flavors = initialValues?.selectedFlavors ?? [];
    if (!flavors.length) return [];
    const base = Math.floor(100 / flavors.length);
    const remainder = 100 - base * flavors.length;
    return flavors.map((name, i) => ({
      name,
      percentage: String(base + (i === 0 ? remainder : 0)),
    }));
  });
  const [colorComponents, setColorComponents] = useState<ComponentEntry[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // AI recipe data
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(initialValues?.selectedFlavors ?? []);
  const [gummyColorHex, setGummyColorHex] = useState(initialValues?.gummyColorHex ?? "");
  const [gummyColorName, setGummyColorName] = useState(initialValues?.gummyColorName ?? "");
  const [isColorLoading, setIsColorLoading] = useState(false);

  const { data: productsData } = useGetPrivateLabelProductsQuery({ activeOnly: true });
  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const [createLabel, { isLoading }] = useCreateLabelMutation();

  const products = productsData?.products ?? [];
  const allFlavors = [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  // Auto-select product type by keyword
  useEffect(() => {
    if (products.length > 0 && !productType && initialValues?.productTypeKeyword) {
      const keyword = initialValues.productTypeKeyword.toLowerCase();
      const match = products.find((p: { name: string }) =>
        p.name.toLowerCase().includes(keyword)
      );
      if (match) setProductType(match.name);
    }
  }, [products]);

  async function fetchColorForFlavors(flavors: string[]) {
    if (flavors.length === 0) return;
    setIsColorLoading(true);
    try {
      const res = await fetch(COLOR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavor: flavors.join(", ") }),
      });
      const data = await res.json();
      if (data?.hex && /^#[0-9A-Fa-f]{6}$/.test(data.hex)) {
        setGummyColorHex(data.hex);
        setGummyColorName(data.name || "");
        if (data.name) setColor(data.name);
      }
    } catch {
      toast.error("Failed to generate color");
    } finally {
      setIsColorLoading(false);
    }
  }

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= 3) return;
    const updated = [...selectedFlavors, name];
    setSelectedFlavors(updated);
    fetchColorForFlavors(updated);
  }

  function handleRemoveFlavor(name: string) {
    const updated = selectedFlavors.filter((f) => f !== name);
    setSelectedFlavors(updated);
    if (updated.length > 0) fetchColorForFlavors(updated);
    else { setGummyColorHex(""); setGummyColorName(""); }
  }

  function resetForm() {
    setFlavorName(initialValues?.flavorName ?? "");
    setProductType("");
    setSpecialInstructions(initialValues?.specialInstructions ?? "");
    setCannabinoidMix(initialValues?.cannabinoidMix ?? "");
    setColor(initialValues?.gummyColorName ?? initialValues?.gummyColorHex ?? "");
    const flavors = initialValues?.selectedFlavors ?? [];
    if (flavors.length) {
      const base = Math.floor(100 / flavors.length);
      const remainder = 100 - base * flavors.length;
      setFlavorComponents(flavors.map((name, i) => ({
        name,
        percentage: String(base + (i === 0 ? remainder : 0)),
      })));
    } else {
      setFlavorComponents([]);
    }
    setColorComponents([]);
    setFiles([]);
    setSelectedFlavors(initialValues?.selectedFlavors ?? []);
    setGummyColorHex(initialValues?.gummyColorHex ?? "");
    setGummyColorName(initialValues?.gummyColorName ?? "");
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
      if (initialValues?.submissionLabelId) {
        formData.append("submissionLabelId", initialValues.submissionLabelId);
      }
      if (selectedFlavors.length > 0) {
        formData.append("selectedFlavors", JSON.stringify(selectedFlavors));
      }
      if (gummyColorHex) formData.append("gummyColorHex", gummyColorHex);
      if (gummyColorName) formData.append("gummyColorName", gummyColorName);
      if (initialValues?.size) formData.append("size", initialValues.size);
      if (initialValues?.oilType) formData.append("oilType", initialValues.oilType);
      if (initialValues?.effect) formData.append("effect", initialValues.effect);
      if (initialValues?.unitsOrdered) formData.append("unitsOrdered", String(initialValues.unitsOrdered));
      if (initialValues?.cannabinoids?.length) formData.append("cannabinoids", JSON.stringify(initialValues.cannabinoids));
      if (initialValues?.unitCost != null) formData.append("unitCost", String(initialValues.unitCost));
      if (initialValues?.totalCost != null) formData.append("totalCost", String(initialValues.totalCost));
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
    // AI recipe data
    selectedFlavors, handleAddFlavor, handleRemoveFlavor,
    gummyColorHex, gummyColorName, isColorLoading, fetchColorForFlavors,
    allFlavors, isLoadingFlavors,
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
