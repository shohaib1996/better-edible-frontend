"use client";

import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGetAllProductsQuery } from "@/redux/api/Products/productsApi";
import {
  useGetAdminPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} from "@/redux/api/Promotions/promotionsApi";
import type { IPromotion } from "@/types/promotions/promotions";

const STATUS_BADGE: Record<IPromotion["status"], string> = {
  draft: "bg-muted text-muted-foreground border-border",
  active: "bg-green-100 text-green-800 border-green-300",
  expired: "bg-red-100 text-red-800 border-red-300",
};

const emptyForm = {
  name: "", description: "", productId: "", productName: "",
  sku: "", creditRatePerUnit: "", startDate: "", endDate: "",
  status: "draft" as IPromotion["status"], isPublic: false,
};

export default function AdminCompanyPromotionsTab() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<IPromotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useGetAdminPromotionsQuery({ page, limit });
  const { data: productsData } = useGetAllProductsQuery(undefined);
  const [createPromotion, { isLoading: isCreating }] = useCreatePromotionMutation();
  const [updatePromotion, { isLoading: isUpdating }] = useUpdatePromotionMutation();
  const [deletePromotion, { isLoading: isDeleting }] = useDeletePromotionMutation();

  const promotions = data?.promotions ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;
  const products: any[] = productsData?.products ?? productsData ?? [];

  function setField(key: keyof typeof emptyForm, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleProductChange(productId: string) {
    const product = products.find((p: any) => p._id === productId);
    setField("productId", productId);
    setField("productName", product?.name ?? "");
    setField("sku", product?.sku ?? "");
  }

  function handleEdit(promo: IPromotion) {
    setEditingPromotion(promo);
    setForm({
      name: promo.name,
      description: promo.description,
      productId: promo.productId,
      productName: promo.productName,
      sku: promo.sku,
      creditRatePerUnit: String(promo.creditRatePerUnit),
      startDate: promo.startDate.slice(0, 10),
      endDate: promo.endDate.slice(0, 10),
      status: promo.status,
      isPublic: promo.isPublic,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setEditingPromotion(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(form.creditRatePerUnit);
    if (!form.productId) { toast.error("Select a product"); return; }
    if (isNaN(rate) || rate < 0) { toast.error("Invalid credit rate"); return; }

    const payload = {
      name: form.name || form.productName,
      description: form.description,
      productId: form.productId,
      productName: form.productName,
      sku: form.sku,
      creditRatePerUnit: rate,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      isPublic: form.isPublic,
    };

    try {
      if (editingPromotion) {
        await updatePromotion({ id: editingPromotion._id, ...payload }).unwrap();
        toast.success("Promotion updated");
      } else {
        await createPromotion(payload).unwrap();
        toast.success("Promotion created");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save promotion");
    }
  }

  async function handleDelete() {
    if (!deletingPromotion) return;
    try {
      await deletePromotion({ id: deletingPromotion.id }).unwrap();
      toast.success("Promotion deleted");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    } finally {
      setDeletingPromotion(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm && (
        <div className="flex justify-end">
          <Button size="sm" className="rounded-xs gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            Create Promotion
          </Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-xs border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{editingPromotion ? "Edit Promotion" : "New Company Promotion"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Product *</label>
              <select
                value={form.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="">Select product…</option>
                {products.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Promotion Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Summer Sale"
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
                placeholder="Auto-filled from product"
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Credits / Unit ($) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.creditRatePerUnit}
                onChange={(e) => setField("creditRatePerUnit", e.target.value)}
                placeholder="0.50"
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Brief description of the promotion…"
                rows={2}
                className="rounded-xs border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="flex items-center gap-4 sm:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as IPromotion["status"])}
                  className="rounded-xs border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setField("isPublic", e.target.checked)}
                  className="rounded-xs"
                />
                Visible to enrolled stores
              </label>
            </div>

            <div className="flex gap-2 sm:col-span-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="rounded-xs" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-xs" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                {editingPromotion ? "Save Changes" : "Create Promotion"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : promotions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No promotions yet.</p>
      ) : (
        <>
          <div className="rounded-xs border border-border bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Name</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Product</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">SKU</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">$/Unit</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Dates</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Public</TableHead>
                  <TableHead className="px-4 py-3 w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => {
                  const start = new Date(promo.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const end = new Date(promo.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <TableRow key={promo._id}>
                      <TableCell className="px-4 py-3 font-medium text-sm">{promo.name}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">{promo.productName}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{promo.sku}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-semibold">${promo.creditRatePerUnit.toFixed(2)}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{start} — {end}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={`rounded-xs text-xs ${STATUS_BADGE[promo.status]}`}>
                          {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {promo.isPublic ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => handleEdit(promo)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => setDeletingPromotion({ id: promo._id, name: promo.name })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            limitOptions={[10, 20, 50]}
          />
        </>
      )}

      <AlertDialog open={!!deletingPromotion} onOpenChange={(open) => { if (!open) setDeletingPromotion(null); }}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <span className="font-semibold text-foreground">{deletingPromotion?.name}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
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
