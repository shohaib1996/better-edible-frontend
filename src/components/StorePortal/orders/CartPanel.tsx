"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { lineColor, ep } from "@/lib/orderHelpers";
import type { CartEntry } from "@/types/storePortal/orders";

interface CartPanelProps {
  cart: CartEntry[];
  cartTotal: number;
  creditBalance: number;
  creditApplied: number;
  finalTotal: number;
  deliveryDate: string;
  setDeliveryDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  submitError: string;
  submitting: boolean;
  handleSubmit: () => void;
  setRowQty: (entry: Omit<CartEntry, "qty">, qty: number) => void;
}

export function CartPanel({
  cart,
  cartTotal,
  creditBalance,
  creditApplied,
  finalTotal,
  deliveryDate,
  setDeliveryDate,
  notes,
  setNotes,
  submitError,
  submitting,
  handleSubmit,
  setRowQty,
}: CartPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#9a8f6e]">
        Your Order ({cart.length} item{cart.length !== 1 ? "s" : ""})
      </p>

      {cart.length === 0 ? (
        <p className="text-sm py-4 text-center text-[#9a8f6e]">No items added yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cart.map((item) => {
            const itemEp = ep(item.price, item.discountPrice, item.onSale);
            return (
              <div key={item.rowKey} className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                    style={{ color: lineColor(item.productLineName).accent }}
                  >
                    {item.productLineName}
                  </p>
                  <p className="text-xs font-medium leading-snug text-[#2a2518]">
                    {item.rowLabel ? `${item.name} — ${item.rowLabel}` : item.name}
                  </p>
                  <p className="text-xs text-[#9a8f6e]">
                    ${itemEp.toFixed(2)} × {item.qty} = ${(itemEp * item.qty).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() => setRowQty(item, item.qty - 1)}
                    className="h-6 w-6 text-xs rounded"
                  >
                    −
                  </Button>
                  <span className="text-xs w-6 text-center text-[#2a2518]">{item.qty}</span>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() => setRowQty(item, item.qty + 1)}
                    className="h-6 w-6 text-xs rounded"
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-1.5">
            {creditApplied > 0 ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b6045]">Subtotal</span>
                  <span className="text-[#2a2518]">
                    ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#2a7a4e]">Store credit applied</span>
                  <span className="text-[#2a7a4e] font-semibold">
                    −${creditApplied.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <Separator className="border-dashed" />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#2a2518]">Estimated Total</span>
                  <span className="text-[#c45a1a]">
                    ${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-[#9a8f6e]">
                  ${creditBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credit available
                  {" · "}
                  ${Math.max(0, creditBalance - creditApplied).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will remain
                </p>
              </>
            ) : (
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-[#2a2518]">Estimated Total</span>
                <span className="text-[#c45a1a]">
                  ${cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-[#6b6045]">
          Desired Delivery Date
        </Label>
        <div className="flex gap-2">
          <Button
            variant={deliveryDate === "asap" ? "default" : "outline"}
            size="sm"
            onClick={() => setDeliveryDate("asap")}
            className={deliveryDate === "asap" ? "bg-[#c45a1a] hover:bg-[#b04d15] border-[#c45a1a]" : "border-[#d6d0b4] text-[#4a4535]"}
          >
            ASAP
          </Button>
          <Button
            variant={deliveryDate !== "asap" ? "default" : "outline"}
            size="sm"
            onClick={() => setDeliveryDate("")}
            className={deliveryDate !== "asap" ? "bg-[#c45a1a] hover:bg-[#b04d15] border-[#c45a1a]" : "border-[#d6d0b4] text-[#4a4535]"}
          >
            Pick a date
          </Button>
        </div>
        {deliveryDate !== "asap" && (
          <Input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="text-sm border-[#d6d0b4] bg-[#fafaf7] text-[#2a2518]"
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-[#6b6045]">
          Order Notes (optional)
        </Label>
        <Textarea
          placeholder="Delivery instructions, special requests…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="text-sm resize-none border-[#d6d0b4] bg-[#fafaf7] text-[#2a2518]"
        />
      </div>

      {submitError && (
        <p className="text-xs px-3 py-2 rounded bg-[#fdf3ec] text-[#c45a1a] border border-[#f0c8a8]">
          {submitError}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting || cart.length === 0}
        className="w-full bg-[#c45a1a] hover:bg-[#b04d15] text-white disabled:bg-[#e5e0c8] disabled:text-[#9a8f6e]"
      >
        {submitting ? "Submitting…" : "Submit Order"}
      </Button>

      <p className="text-xs text-center text-[#9a8f6e]">Rep confirms within 24 hours.</p>
    </div>
  );
}
