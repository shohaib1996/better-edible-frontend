"use client";

import { useState } from "react";
import { Copy, Check, Tag, Percent, Zap, BarChart2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IPromotion } from "@/types/promotions/promotions";
import { STATUS_BADGE, fmtDate, discountLabel } from "@/utils/promotionHelpers";

interface Props {
  promotions: IPromotion[];
  onEdit: (promo: IPromotion) => void;
  onDelete: (id: string, name: string) => void;
  onViewUsage: (id: string) => void;
}

export function PromotionsTable({ promotions, onEdit, onDelete, onViewUsage }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-xs border border-border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-muted/50">
            <TableHead className="px-4 py-3 font-medium text-muted-foreground">Name</TableHead>
            <TableHead className="px-4 py-3 font-medium text-muted-foreground">Code</TableHead>
            <TableHead className="px-4 py-3 font-medium text-muted-foreground">Discount</TableHead>
            <TableHead className="px-4 py-3 font-medium text-muted-foreground">Min Order</TableHead>
            <TableHead className="px-4 py-3 font-medium text-muted-foreground">Dates</TableHead>
            <TableHead className="px-4 py-3 text-center font-medium text-muted-foreground">Uses</TableHead>
            <TableHead className="px-4 py-3 font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="px-4 py-3 w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.map((promo) => (
            <TableRow key={promo._id}>
              <TableCell className="px-4 py-3 font-medium text-sm">
                <div className="flex flex-col gap-0.5">
                  <span>{promo.name}</span>
                  {promo.autoApply && (
                    <span className="text-xs text-purple-600 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Auto-apply
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                {promo.code ? (
                  <div className="flex items-center gap-1.5">
                    <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{promo.code}</code>
                    <button
                      onClick={() => copyCode(promo.code!)}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === promo.code
                        ? <Check className="w-3 h-3 text-green-600" />
                        : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm font-semibold">
                <span className="flex items-center gap-1">
                  {promo.type === "flat"
                    ? <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    : <Percent className="w-3.5 h-3.5 text-muted-foreground" />}
                  {discountLabel(promo.type, promo.value)}
                </span>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {promo.minOrderAmount ? `$${promo.minOrderAmount.toFixed(2)}` : "—"}
              </TableCell>
              <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {fmtDate(promo.startDate)} — {fmtDate(promo.endDate)}
              </TableCell>
              <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">
                {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ""}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className={`rounded-xs text-xs ${STATUS_BADGE[promo.status]}`}>
                  {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="px-2 py-3">
                <div className="flex items-center gap-1 justify-end">
                  <button
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="View usage"
                    onClick={() => onViewUsage(promo._id)}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => onEdit(promo)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => onDelete(promo._id, promo.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
