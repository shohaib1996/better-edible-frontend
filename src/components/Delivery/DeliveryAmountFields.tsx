"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const animProps = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: "auto", marginTop: 0 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
  transition: { duration: 0.25, ease: "easeInOut" as const },
};

interface Props {
  showDelivery: boolean;
  showMoneyPickup: boolean;
  amount: string;
  moneyPickupAmount: string;
  onChange: (key: string, value: string) => void;
}

export function DeliveryAmountFields({
  showDelivery,
  showMoneyPickup,
  amount,
  moneyPickupAmount,
  onChange,
}: Props) {
  return (
    <>
      <AnimatePresence>
        {showDelivery && (
          <motion.div key="delivery-amount" {...animProps} className="overflow-hidden space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Delivery Invoiced Amount
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onChange("amount", e.target.value)}
              className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoneyPickup && (
          <motion.div key="money-pickup-amount" {...animProps} className="overflow-hidden space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Money Pickup Amount
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={moneyPickupAmount}
              onChange={(e) => onChange("moneyPickupAmount", e.target.value)}
              className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
