"use client";

import { DollarSign } from "lucide-react";

interface Props {
  balance: number;
}

export default function CreditBalanceWidget({ balance }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-green-50 border border-green-200 text-green-800">
      <DollarSign className="w-3.5 h-3.5 shrink-0" />
      <span className="text-sm font-semibold">${balance.toFixed(2)}</span>
      <span className="text-xs text-green-700">credits available</span>
    </div>
  );
}
