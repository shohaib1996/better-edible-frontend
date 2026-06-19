"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetPartnershipReplenishmentsQuery } from "@/redux/api/Partnership/partnershipApi";
import type { IPartnershipReplenishment } from "@/types/partnership/partnership";

interface Props {
  storeId: string;
}

const STATUS_BADGE: Record<IPartnershipReplenishment["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  in_transit: "bg-blue-100 text-blue-800 border-blue-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  reconciled: "bg-purple-100 text-purple-800 border-purple-300",
};

const STATUS_LABEL: Record<IPartnershipReplenishment["status"], string> = {
  pending: "Pending",
  in_transit: "In Transit",
  delivered: "Delivered",
  reconciled: "Reconciled",
};

function ReplenishmentCard({ r }: { r: IPartnershipReplenishment }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xs border bg-card">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {new Date(r.requestedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <Badge className={`rounded-xs text-xs ${STATUS_BADGE[r.status]}`}>
            {STATUS_LABEL[r.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {r.items.length} product{r.items.length !== 1 ? "s" : ""}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-2 font-medium text-muted-foreground">Product</th>
                <th className="pb-2 font-medium text-muted-foreground">SKU</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Requested</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {r.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="py-2 text-right">{item.unitsRequested}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    {item.unitsDelivered ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {r.status === "reconciled" && r.driverCounts.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Driver physical count
              </p>
              <div className="flex flex-col gap-1">
                {r.driverCounts.map((dc, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{dc.sku}</span>
                    <span className="font-semibold">{dc.actualCount} units</span>
                  </div>
                ))}
              </div>
              {r.driverNotes && (
                <p className="text-xs text-muted-foreground mt-2 italic">{r.driverNotes}</p>
              )}
            </div>
          )}

          {r.deliveredAt && (
            <p className="text-xs text-muted-foreground">
              Delivered:{" "}
              {new Date(r.deliveredAt).toLocaleDateString("en-US", {
                month: "short",
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

export default function ReplenishmentsTab({ storeId }: Props) {
  const { data, isLoading } = useGetPartnershipReplenishmentsQuery(storeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const replenishments = data?.replenishments ?? [];

  if (replenishments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No replenishments yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {replenishments.map((r) => (
        <ReplenishmentCard key={r._id} r={r} />
      ))}
    </div>
  );
}
