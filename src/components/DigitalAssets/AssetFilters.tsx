"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductLine, AssetType } from "@/types/digitalAssets/digitalAssets";

const PRODUCT_LINES: ProductLine[] = ["CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy"];
const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "file", label: "File (Download)" },
  { value: "text", label: "Text (Copy)" },
];

interface AssetFiltersProps {
  selectedProductLines: ProductLine[];
  selectedAssetTypes: AssetType[];
  onProductLineChange: (value: ProductLine, checked: boolean) => void;
  onAssetTypeChange: (value: AssetType, checked: boolean) => void;
}

export function AssetFilters({
  selectedProductLines,
  selectedAssetTypes,
  onProductLineChange,
  onAssetTypeChange,
}: AssetFiltersProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Product Line
        </p>
        <div className="space-y-2">
          {PRODUCT_LINES.map((line) => (
            <div key={line} className="flex items-center gap-2">
              <Checkbox
                id={`pl-${line}`}
                checked={selectedProductLines.includes(line)}
                onCheckedChange={(checked) => onProductLineChange(line, !!checked)}
                className="rounded-xs"
              />
              <Label htmlFor={`pl-${line}`} className="text-sm font-normal cursor-pointer">
                {line}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Asset Type
        </p>
        <div className="space-y-2">
          {ASSET_TYPES.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`at-${value}`}
                checked={selectedAssetTypes.includes(value)}
                onCheckedChange={(checked) => onAssetTypeChange(value, !!checked)}
                className="rounded-xs"
              />
              <Label htmlFor={`at-${value}`} className="text-sm font-normal cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
