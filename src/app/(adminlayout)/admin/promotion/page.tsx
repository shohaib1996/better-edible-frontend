"use client";

import { useState } from "react";
import { Loader2, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { useGetAdminPromotionsQuery, useDeletePromotionMutation } from "@/redux/api/Promotions/promotionsApi";
import type { IPromotion } from "@/types/promotions/promotions";
import { PromotionForm } from "@/components/Promotions/admin/PromotionForm";
import { PromotionsTable } from "@/components/Promotions/admin/PromotionsTable";
import { PromotionUsagePanel } from "@/components/Promotions/admin/PromotionUsagePanel";

export default function AdminPromotionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IPromotion | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [usagePromoId, setUsagePromoId] = useState<string | null>(null);

  const { data, isLoading } = useGetAdminPromotionsQuery({ page, limit });
  const [deletePromotion, { isLoading: isDeleting }] = useDeletePromotionMutation();

  const promotions = data?.promotions ?? [];

  function openEdit(promo: IPromotion) {
    setEditing(promo);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deletePromotion({ id: deleting.id }).unwrap();
      toast.success("Promotion deleted");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  if (usagePromoId) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <PromotionUsagePanel promotionId={usagePromoId} onBack={() => setUsagePromoId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create promo codes and order-threshold discounts for stores.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" className="rounded-xs gap-1.5" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-3.5 h-3.5" /> New Promotion
          </Button>
        )}
      </div>

      {showForm && (
        <PromotionForm editing={editing} onCancel={closeForm} onSaved={closeForm} />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Zap className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No promotions yet. Create your first one above.</p>
        </div>
      ) : (
        <>
          <PromotionsTable
            promotions={promotions}
            onEdit={openEdit}
            onDelete={(id, name) => setDeleting({ id, name })}
            onViewUsage={setUsagePromoId}
          />
          <GlobalPagination
            currentPage={page} totalPages={data?.totalPages ?? 1} totalItems={data?.totalCount ?? 0}
            itemsPerPage={limit} onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            limitOptions={[10, 20, 50]}
          />
        </>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <span className="font-semibold text-foreground">{deleting?.name}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleDelete} disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
