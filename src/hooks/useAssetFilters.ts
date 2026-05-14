import { useState, useEffect, useCallback } from "react";
import {
  ProductLine,
  AssetType,
  AssetCategory,
} from "@/types/digitalAssets/digitalAssets";
import { useGetDigitalAssetsQuery } from "@/redux/api/DigitalAssets/digitalAssetsApi";

export function useAssetFilters() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProductLine, setSelectedProductLine] = useState<ProductLine | undefined>(undefined);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const resetPage = useCallback(() => setPage(1), []);
  useEffect(() => {
    resetPage();
  }, [debouncedSearch, selectedProductLine, selectedAssetType, selectedCategory, resetPage]);

  const { data, isLoading, isFetching } = useGetDigitalAssetsQuery({
    status: "active",
    search: debouncedSearch || undefined,
    productLine: selectedProductLine,
    assetType: selectedAssetType,
    category: selectedCategory,
    page,
    limit,
  });

  const activeFilters = [selectedProductLine, selectedAssetType, selectedCategory].filter(Boolean).length;

  function clearFilters() {
    setSelectedProductLine(undefined);
    setSelectedAssetType(undefined);
    setSelectedCategory(undefined);
  }

  function clearAll() {
    setSearch("");
    clearFilters();
    setPage(1);
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    selectedProductLine,
    setSelectedProductLine,
    selectedAssetType,
    setSelectedAssetType,
    selectedCategory,
    setSelectedCategory,
    page,
    setPage,
    limit,
    setLimit,
    assets: data?.assets ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading: isLoading || isFetching,
    activeFilters,
    clearFilters,
    clearAll,
  };
}
