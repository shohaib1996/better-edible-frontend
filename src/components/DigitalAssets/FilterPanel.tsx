"use client";

import {
  ProductLine,
  AssetType,
  AssetCategory,
} from "@/types/digitalAssets/digitalAssets";

const PRODUCT_LINES: ProductLine[] = [
  "CannaCrispy",
  "FiftyOneFifty",
  "Bliss",
  "YummyGummy",
];
const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "file", label: "Files" },
  { value: "text", label: "Text / Copy" },
];
const CATEGORY_OPTIONS: AssetCategory[] = [
  "Banner",
  "ProductImage",
  "Video",
  "Email",
  "Flyer",
  "Social",
  "Text",
  "Other",
];

export interface FilterPanelProps {
  selectedProductLine: ProductLine | undefined;
  selectedAssetType: AssetType | undefined;
  selectedCategory: AssetCategory | undefined;
  onProductLine: (v: ProductLine | undefined) => void;
  onAssetType: (v: AssetType | undefined) => void;
  onCategory: (v: AssetCategory | undefined) => void;
  onClear: () => void;
  activeFilters: number;
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs text-sm text-left transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-accent"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
          active ? "bg-primary" : "bg-border"
        }`}
      />
      {children}
    </button>
  );
}

export function FilterPanel({
  selectedProductLine,
  selectedAssetType,
  selectedCategory,
  onProductLine,
  onAssetType,
  onCategory,
  onClear,
  activeFilters,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Filters</span>
        {activeFilters > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup label="Product Line">
        {PRODUCT_LINES.map((pl) => (
          <FilterButton
            key={pl}
            active={selectedProductLine === pl}
            onClick={() => onProductLine(selectedProductLine === pl ? undefined : pl)}
          >
            {pl}
          </FilterButton>
        ))}
      </FilterGroup>

      <FilterGroup label="Asset Type">
        {ASSET_TYPES.map(({ value, label }) => (
          <FilterButton
            key={value}
            active={selectedAssetType === value}
            onClick={() => onAssetType(selectedAssetType === value ? undefined : value)}
          >
            {label}
          </FilterButton>
        ))}
      </FilterGroup>

      <FilterGroup label="Category">
        {CATEGORY_OPTIONS.map((cat) => (
          <FilterButton
            key={cat}
            active={selectedCategory === cat}
            onClick={() => onCategory(selectedCategory === cat ? undefined : cat)}
          >
            {cat}
          </FilterButton>
        ))}
      </FilterGroup>
    </div>
  );
}
