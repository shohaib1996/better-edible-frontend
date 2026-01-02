"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2 } from "lucide-react";
import { IPrivateLabelProduct } from "@/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";

interface PrivateLabelProductCardProps {
  product: IPrivateLabelProduct;
  onEdit: (product: IPrivateLabelProduct) => void;
  onDelete: (productId: string) => void;
  onToggleActive: (productId: string, isActive: boolean) => void;
}

export const PrivateLabelProductCard: React.FC<
  PrivateLabelProductCardProps
> = ({ product, onEdit, onDelete, onToggleActive }) => {
  const handleToggleActive = () => {
    onToggleActive(product._id, !product.isActive);
  };

  const handleDelete = () => {
    onDelete(product._id);
  };

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md bg-card rounded-xs",
        product.isActive
          ? "border-l-4 border-l-green-600"
          : "border-l-4 border-l-muted-foreground/40"
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Product Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-card-foreground">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <Switch
                checked={product.isActive}
                onCheckedChange={handleToggleActive}
                className={cn(
                  product.isActive
                    ? "data-[state=checked]:bg-green-600"
                    : "data-[state=unchecked]:bg-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold",
                  product.isActive ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {product.isActive ? "Active ✓" : "Inactive ✗"}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Price:</span>{" "}
              <span className="text-primary font-bold text-base">
                ${product.unitPrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground">/each</span>
            </p>

            {product.description && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Description:</span>{" "}
                {product.description.length > 100 ? (
                  <span title={product.description}>
                    {product.description.substring(0, 100)}...
                  </span>
                ) : (
                  product.description
                )}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex items-center gap-1 rounded-xs"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xs"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            }
            title="Delete Product"
            description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
            confirmText="Yes, Delete"
            cancelText="Cancel"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </Card>
  );
};
