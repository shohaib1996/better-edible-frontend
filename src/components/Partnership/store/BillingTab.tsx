"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetPartnershipBillingQuery } from "@/redux/api/Partnership/partnershipApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import type { IPartnershipBill } from "@/types/partnership/partnership";

interface Props {
  storeId: string;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_BADGE: Record<IPartnershipBill["status"], string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-amber-100 text-amber-800 border-amber-300",
  paid: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_LABEL: Record<IPartnershipBill["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
};

function BillCard({ bill }: { bill: IPartnershipBill }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xs border bg-card">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">
            {MONTH_NAMES[bill.billingMonth]} {bill.billingYear}
          </span>
          <Badge className={`rounded-xs text-xs ${STATUS_BADGE[bill.status]}`}>
            {STATUS_LABEL[bill.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">${bill.total.toFixed(2)}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 flex flex-col gap-4">
          <div className="rounded-xs border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border bg-muted/50">
                  <th className="px-3 py-2.5 font-medium text-muted-foreground">Product</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Units</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Price</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bill.lineItems.map((li, i) => (
                  <tr key={i} className="bg-card">
                    <td className="px-3 py-2.5">{li.productName}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {li.unitsSold.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      ${li.wholesalePrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      ${li.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bill.credits.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Credits
              </p>
              {bill.credits.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{c.reason}</span>
                  <span className="text-green-700 font-medium">
                    −${c.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.creditsTotal > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Credits</span>
                <span>−${bill.creditsTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t mt-1">
              <span>Total</span>
              <span>${bill.total.toFixed(2)}</span>
            </div>
          </div>

          {bill.paidAt && (
            <p className="text-xs text-green-700">
              Paid on{" "}
              {new Date(bill.paidAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BillingTab({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetPartnershipBillingQuery({ storeId, page, limit });

  const bills = data?.bills ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No bills generated yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {bills.map((bill) => (
          <BillCard key={bill._id} bill={bill} />
        ))}
      </div>
      <GlobalPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        limitOptions={[10, 25, 50]}
      />
    </div>
  );
}
