"use client";

import { useState, useEffect, useRef } from "react";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import { useGetDigitalAssetsQuery } from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { useGetActiveProductLinesQuery } from "@/redux/api/ProductLines/productLinesApi";
import { useGetDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import type { AssetCategory } from "@/types/digitalAssets/digitalAssets";
import { AssetsTab } from "./digitalAssets/_AssetsTab";
import { RequestsTab } from "./digitalAssets/_RequestsTab";

export function DigitalAssetsPage() {
  const [user, setUser] = useState<IStoreUser | null>(null);
  const [activeTab, setActiveTab] = useState<"assets" | "requests">("assets");
  const [activeProduct, setActiveProduct] = useState("");
  const [activeType, setActiveType] = useState("");
  const didInitProduct = useRef(false);
  const didInitType = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const { data: assetsData, isLoading: loadingAssets, isError: assetError } =
    useGetDigitalAssetsQuery({ status: "active" });

  const { data: productLinesData } = useGetActiveProductLinesQuery();

  const { data: requestsData, isLoading: loadingRequests, isError: requestError } =
    useGetDesignRequestsQuery(
      { storeId: user?.storeId || "", limit: 100 },
      { skip: activeTab !== "requests" || !user?.storeId },
    );

  const assets = assetsData?.assets ?? [];
  const productLines = productLinesData?.productLines ?? [];
  const requests = requestsData?.requests ?? [];

  const productOptions = productLines.map((l) => l.name);
  const typeOptions = Array.from(
    new Set(assets.map((a) => a.category).filter((v): v is AssetCategory => !!v && v.trim() !== "")),
  ).sort();

  useEffect(() => {
    if (didInitProduct.current || productOptions.length === 0) return;
    setActiveProduct(productOptions[0]);
    didInitProduct.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productOptions.length]);

  useEffect(() => {
    if (didInitType.current || typeOptions.length === 0) return;
    setActiveType(typeOptions[0]);
    didInitType.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeOptions.length]);

  return (
    <div>
      <div className="flex items-center gap-1 mb-5" style={{ borderBottom: "2px solid #e5e0c8" }}>
        {(
          [
            { id: "assets" as const, label: "Asset Library" },
            { id: "requests" as const, label: "My Requests", count: requests.length || undefined },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderBottom: activeTab === t.id ? "2px solid #c45a1a" : "2px solid transparent",
              marginBottom: -2,
              color: activeTab === t.id ? "#2a2518" : "#9a8f6e",
            }}
          >
            {t.label}
            {"count" in t && t.count !== undefined && t.count > 0 && (
              <span
                className="rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                style={{ background: "#c45a1a", color: "#fff" }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "assets" && (
        <AssetsTab
          assets={assets}
          productOptions={productOptions}
          typeOptions={typeOptions}
          activeProduct={activeProduct}
          activeType={activeType}
          onProductChange={setActiveProduct}
          onTypeChange={setActiveType}
          loading={loadingAssets}
          error={assetError}
        />
      )}

      {activeTab === "requests" && (
        <RequestsTab requests={requests} loading={loadingRequests} error={requestError} />
      )}
    </div>
  );
}
