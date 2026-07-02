"use client";

import type { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";
import { FilterRow } from "./_FilterRow";
import { AssetCard } from "./_AssetCard";

interface AssetsTabProps {
  assets: IDigitalAsset[];
  productOptions: string[];
  typeOptions: string[];
  activeProduct: string;
  activeType: string;
  onProductChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  loading: boolean;
  error: boolean;
}

export function AssetsTab({
  assets,
  productOptions,
  typeOptions,
  activeProduct,
  activeType,
  onProductChange,
  onTypeChange,
  loading,
  error,
}: AssetsTabProps) {
  const filtered = assets.filter(
    (a) =>
      (activeProduct === "" || (a.productLine || "") === activeProduct) &&
      (activeType === "" || (a.category || "") === activeType),
  );

  return (
    <>
      <div className="mb-4">
        <p className="text-sm" style={{ color: "#6b6045" }}>
          Download and use these assets for your store marketing, social media, and signage — no restrictions.
        </p>
      </div>

      {!loading && (productOptions.length > 0 || typeOptions.length > 0) && (
        <div className="space-y-2 mb-5">
          {productOptions.length > 0 && (
            <FilterRow options={productOptions} active={activeProduct} onChange={onProductChange} />
          )}
          {typeOptions.length > 0 && (
            <FilterRow options={typeOptions} active={activeType} onChange={onTypeChange} />
          )}
        </div>
      )}

      {loading && (
        <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>Loading assets…</div>
      )}

      {error && (
        <div className="text-sm py-4 px-4 rounded" style={{ background: "#fdf0ec", color: "#c45a1a", border: "1px solid #f0c4a8" }}>
          Could not load assets. Please try again.
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
          No assets found{activeProduct !== "" || activeType !== "" ? " for the selected filters" : ""}.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      )}
    </>
  );
}
