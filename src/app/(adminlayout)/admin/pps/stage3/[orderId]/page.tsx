"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/lib/ppsUser";
import { useGetStage3CookItemsQuery } from "@/redux/api/PrivateLabel/ppsApi";
import { Stage3CookItemCard } from "@/components/PPS/Stage3CookItemCard";
import Stage3ScannerBlock from "@/components/PPS/Stage3ScannerBlock";

export default function Stage3OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;
  const allComplete = orderItems.length > 0 && orderItems.every((i) => i.status === "bag_seal_complete");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load cook items. Check your connection and try again.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/pps")} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <PackageCheck className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 3 — Bag & Seal"}
            </h1>
            <p className="text-base text-muted-foreground font-mono">Order {decodedOrderId}</p>
          </div>
        </div>
      </div>

      <Stage3ScannerBlock
        orderItems={orderItems}
        scannerId="stage3-admin-scanner"
        labelPageSize="4in 2in"
        labelType="bagging"
        compact
      />

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <PackageCheck className="w-10 h-10 opacity-40" />
          <p className="text-base">No bag &amp; seal items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {allComplete && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xs bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <p className="text-xl font-semibold">All items sealed — ready for packaging</p>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <Stage3CookItemCard key={item._id} item={item} isAdmin={isAdmin} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
