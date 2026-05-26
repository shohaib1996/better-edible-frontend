"use client";

import { Loader2, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ILabel } from "@/types";
import type { OrderItem } from "./CreateOrderModal";

interface Props {
  selectedClientId: string;
  labels: ILabel[] | undefined;
  isLoading: boolean;
  selectedLabels: OrderItem[];
  onToggle: (label: ILabel) => void;
  onPreviewImage?: (url: string, filename: string) => void;
}

export function LabelPicker({
  selectedClientId,
  labels,
  isLoading,
  selectedLabels,
  onToggle,
  onPreviewImage,
}: Props) {
  if (!selectedClientId) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!labels || labels.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No approved labels found for this client.
      </p>
    );
  }

  return (
    <div>
      <Label>Select Labels *</Label>
      <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-border dark:border-white/20 rounded-xs p-2 scrollbar-thin bg-card">
        {labels.map((label) => (
          <div
            key={label._id}
            className="flex items-center gap-3 p-2 hover:bg-accent/30 rounded-xs transition-colors"
          >
            <Checkbox
              checked={selectedLabels.some((l) => l.labelId === label._id)}
              onCheckedChange={() => onToggle(label)}
              className="rounded-xs data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
            />

            <div
              className="relative w-12 h-12 shrink-0 overflow-hidden rounded-xs bg-muted cursor-pointer group border border-border"
              onClick={(e) => {
                e.stopPropagation();
                if (onPreviewImage && label.labelImages?.length > 0) {
                  const img = label.labelImages[0];
                  onPreviewImage(
                    img.secureUrl || img.url,
                    img.originalFilename || `${label.flavorName}-label`
                  );
                }
              }}
            >
              {label.labelImages?.length > 0 ? (
                <img
                  src={label.labelImages[0].secureUrl || label.labelImages[0].url}
                  alt={label.flavorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium">{label.flavorName}</p>
              <p className="text-xs text-muted-foreground">
                {label.productType} - ${(label.unitPrice || 0).toFixed(2)}/unit
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
