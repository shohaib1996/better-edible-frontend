"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useGetAdminStorePromotionsQuery,
  useGetPromotionCreditsQuery,
  useApplyPromotionCreditMutation,
} from "@/redux/api/Promotions/promotionsApi";
import type { IStorePromotion } from "@/types/promotions/promotions";

const STATUS_BADGE: Record<IStorePromotion["status"], string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  pending_sales_log: "bg-amber-100 text-amber-800 border-amber-300",
  sales_logged: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<IStorePromotion["status"], string> = {
  active: "Active",
  pending_sales_log: "Log Sales",
  sales_logged: "Sales Logged",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface Props {
  storeId: string;
}

export default function AdminStorePromotionDetail({ storeId }: Props) {
  const [promoPage, setPromoPage] = useState(1);
  const [creditPage, setCreditPage] = useState(1);
  const [applyAmount, setApplyAmount] = useState("");
  const [applyOrderId, setApplyOrderId] = useState("");

  const { data: promoData, isLoading: promoLoading } = useGetAdminStorePromotionsQuery({ storeId, page: promoPage });
  const { data: creditData, isLoading: creditLoading } = useGetPromotionCreditsQuery({ storeId, page: creditPage });
  const [applyCredit, { isLoading: isApplying }] = useApplyPromotionCreditMutation();

  const storePromotions = promoData?.storePromotions ?? [];
  const enrollment = promoData?.enrollment;
  const credits = creditData?.credits ?? [];
  const creditBalance = creditData?.creditBalance ?? enrollment?.creditBalance ?? 0;

  async function handleApplyCredit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!applyOrderId.trim()) { toast.error("Enter an order ID"); return; }

    try {
      const result = await applyCredit({ storeId, amount, orderId: applyOrderId.trim() }).unwrap();
      toast.success(`$${amount.toFixed(2)} credit applied — balance: $${result.creditBalance.toFixed(2)}`);
      setApplyAmount("");
      setApplyOrderId("");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to apply credit");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Credit balance + apply form */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Credit Balance</h3>
          <span className="text-lg font-bold text-green-700">${creditBalance.toFixed(2)}</span>
        </div>

        {creditBalance > 0 && (
          <form onSubmit={handleApplyCredit} className="rounded-xs border bg-card p-4 flex flex-col gap-3 max-w-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Apply Credit to Order</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Order ID</label>
              <input
                type="text"
                value={applyOrderId}
                onChange={(e) => setApplyOrderId(e.target.value)}
                placeholder="Paste order ID…"
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Amount ($)</label>
              <input
                type="number"
                min={0.01}
                max={creditBalance}
                step={0.01}
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder={`Max $${creditBalance.toFixed(2)}`}
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button type="submit" size="sm" className="rounded-xs" disabled={isApplying}>
              {isApplying && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Apply Credit
            </Button>
          </form>
        )}
      </div>

      {/* Store promotions table */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Promotions</h3>
        {promoLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : storePromotions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No promotions for this store.</p>
        ) : (
          <>
            <div className="rounded-xs border border-border bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Promotion</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Units Sold</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storePromotions.map((sp) => {
                    const name = sp.name ?? sp.productName ?? "—";
                    return (
                      <TableRow key={sp._id}>
                        <TableCell className="px-4 py-3 font-medium text-sm">{name}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground capitalize">{sp.type}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={`rounded-xs text-xs ${STATUS_BADGE[sp.status]}`}>
                            {STATUS_LABEL[sp.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-muted-foreground">
                          {sp.unitsSold.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                          ${sp.creditsEarned.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <GlobalPagination
              currentPage={promoPage}
              totalPages={promoData?.totalPages ?? 1}
              totalItems={promoData?.totalCount ?? 0}
              itemsPerPage={20}
              onPageChange={setPromoPage}
              onLimitChange={() => {}}
              limitOptions={[20]}
            />
          </>
        )}
      </div>

      {/* Credit history table */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Credit History</h3>
        {creditLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : credits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credit transactions yet.</p>
        ) : (
          <>
            <div className="rounded-xs border border-border bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Date</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Description</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{c.description}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={`rounded-xs text-xs ${c.type === "earned" ? "bg-green-100 text-green-800 border-green-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>
                          {c.type === "earned" ? "Earned" : "Applied"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`px-4 py-3 text-right text-sm font-semibold ${c.type === "earned" ? "text-green-700" : "text-blue-700"}`}>
                        {c.type === "earned" ? "+" : "−"}${c.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <GlobalPagination
              currentPage={creditPage}
              totalPages={creditData?.totalPages ?? 1}
              totalItems={creditData?.totalCount ?? 0}
              itemsPerPage={20}
              onPageChange={setCreditPage}
              onLimitChange={() => {}}
              limitOptions={[20]}
            />
          </>
        )}
      </div>
    </div>
  );
}
