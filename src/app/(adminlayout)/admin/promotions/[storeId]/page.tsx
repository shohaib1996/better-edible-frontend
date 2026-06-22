"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetAdminStorePromotionsQuery } from "@/redux/api/Promotions/promotionsApi";
import AdminStorePromotionDetail from "@/components/Promotions/admin/AdminStorePromotionDetail";

const STATUS_BADGE: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 border-amber-300",
  active: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Pending Approval",
  active: "Active",
  rejected: "Rejected",
};

export default function AdminStorePromotionsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();

  const { data, isLoading } = useGetAdminStorePromotionsQuery({ storeId });

  const enrollment = data?.enrollment;
  const storeName =
    enrollment
      ? typeof enrollment.storeId === "string"
        ? "Store"
        : (enrollment.storeId as any)?.name ?? "Store"
      : "Store";

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{storeName}</h1>
          {enrollment && (
            <Badge className={`rounded-xs text-xs ${STATUS_BADGE[enrollment.status] ?? ""}`}>
              {STATUS_LABEL[enrollment.status] ?? enrollment.status}
            </Badge>
          )}
        </div>
      </div>

      {!enrollment ? (
        <p className="text-sm text-muted-foreground">This store has no promotions enrollment.</p>
      ) : (
        <AdminStorePromotionDetail storeId={storeId} />
      )}
    </div>
  );
}
