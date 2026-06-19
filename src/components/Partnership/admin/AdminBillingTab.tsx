"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useGetAdminBillingQuery,
  useGenerateBillMutation,
  useApplyCreditMutation,
  useUpdateBillStatusMutation,
} from "@/redux/api/Partnership/partnershipApi";
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

function BillCard({ bill }: { bill: IPartnershipBill }) {
  const [expanded, setExpanded] = useState(false);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const [applyCredit, { isLoading: isApplying }] = useApplyCreditMutation();
  const [updateBillStatus, { isLoading: isUpdating }] = useUpdateBillStatusMutation();

  async function handleAddCredit() {
    if (!creditAmount || !creditReason) {
      toast.error("Amount and reason are required");
      return;
    }
    try {
      await applyCredit({
        billId: bill._id,
        amount: parseFloat(creditAmount),
        reason: creditReason,
      }).unwrap();
      toast.success("Credit applied");
      setCreditAmount("");
      setCreditReason("");
      setShowCreditForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to apply credit");
    }
  }

  async function handleStatusUpdate(status: "draft" | "sent" | "paid") {
    try {
      await updateBillStatus({ billId: bill._id, status }).unwrap();
      toast.success(`Bill marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update status");
    }
  }

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
            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
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
          {/* Line items */}
          <div className="rounded-xs border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border bg-muted/50">
                  <th className="px-3 py-2.5 font-medium text-muted-foreground">Product</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground">SKU</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Units</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Price</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bill.lineItems.map((li, i) => (
                  <tr key={i} className="bg-card">
                    <td className="px-3 py-2.5">{li.productName}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{li.sku}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {li.unitsSold.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      ${li.wholesalePrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">${li.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Credits list */}
          {bill.credits.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Credits
              </p>
              {bill.credits.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{c.reason}</span>
                  <span className="text-green-700 font-medium">−${c.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
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

          {/* Add credit form */}
          {bill.status !== "paid" && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCreditForm((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
              >
                {showCreditForm ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {showCreditForm ? "Cancel" : "Add Credit"}
              </button>

              {showCreditForm && (
                <div className="rounded-xs border bg-muted/30 p-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Amount"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="rounded-xs text-sm w-28"
                    />
                    <Input
                      placeholder="Reason"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="rounded-xs text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      className="rounded-xs shrink-0"
                      onClick={handleAddCredit}
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status buttons */}
          <div className="flex gap-2 flex-wrap border-t pt-3">
            {bill.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xs"
                onClick={() => handleStatusUpdate("sent")}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Mark as Sent
              </Button>
            )}
            {(bill.status === "draft" || bill.status === "sent") && (
              <Button
                size="sm"
                className="rounded-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleStatusUpdate("paid")}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Mark as Paid
              </Button>
            )}
            {bill.paidAt && (
              <span className="text-xs text-green-700 self-center">
                Paid on{" "}
                {new Date(bill.paidAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBillingTab({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetAdminBillingQuery({ storeId, page, limit });
  const [generateBill, { isLoading: isGenerating }] = useGenerateBillMutation();

  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const bills = data?.bills ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  async function handleGenerate() {
    try {
      await generateBill({
        storeId,
        year: parseInt(year),
        month: parseInt(month),
      }).unwrap();
      toast.success("Bill generated");
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to generate bill");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="rounded-xs gap-1.5"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Generate Bill"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xs border bg-muted/30 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Generate Monthly Bill</p>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-xs border border-border bg-background px-2.5 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
              >
                {MONTH_NAMES.slice(1).map((name, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Year
              </label>
              <Input
                type="number"
                min="2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-xs text-sm w-24"
              />
            </div>
            <Button
              size="sm"
              className="rounded-xs"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Generate
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : bills.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No bills generated yet.
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
