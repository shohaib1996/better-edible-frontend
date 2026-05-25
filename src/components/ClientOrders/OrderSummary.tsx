import type { DiscountType } from "@/types";

interface Props {
  subtotal: number;
  discount: number;
  discountType: DiscountType;
  discountAmount: number;
  total: number;
}

export function OrderSummary({ subtotal, discount, discountType, discountAmount, total }: Props) {
  return (
    <div className="p-4 border rounded-xs bg-card border-border dark:border-white/20">
      <h4 className="font-semibold mb-2">Order Summary</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>
              Discount ({discountType === "percentage" ? `${discount}%` : `$${discount}`}):
            </span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
