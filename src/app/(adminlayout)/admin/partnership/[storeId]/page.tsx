"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Copy, Check, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useGetAllPartnershipStoresQuery,
  useApprovePartnershipMutation,
  useRejectPartnershipMutation,
} from "@/redux/api/Partnership/partnershipApi";
import AdminInventoryTab from "@/components/Partnership/admin/AdminInventoryTab";
import AdminSalesTab from "@/components/Partnership/admin/AdminSalesTab";
import AdminReplenishmentsTab from "@/components/Partnership/admin/AdminReplenishmentsTab";
import AdminBillingTab from "@/components/Partnership/admin/AdminBillingTab";
import type { IPartnershipEnrollment } from "@/types/partnership/partnership";

type Tab = "overview" | "inventory" | "sales" | "replenishments" | "billing";

const STATUS_BADGE: Record<IPartnershipEnrollment["status"], string> = {
  pending_approval: "bg-amber-100 text-amber-800 border-amber-300",
  active: "bg-green-100 text-green-800 border-green-300",
  pending_setup: "bg-blue-100 text-blue-800 border-blue-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABEL: Record<IPartnershipEnrollment["status"], string> = {
  pending_approval: "Pending Approval",
  active: "Active",
  pending_setup: "Pending Setup",
  rejected: "Rejected",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "inventory", label: "Inventory" },
  { key: "sales", label: "Sales" },
  { key: "replenishments", label: "Replenishments" },
  { key: "billing", label: "Billing" },
];

export default function AdminPartnershipStorePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useGetAllPartnershipStoresQuery();
  const [approvePartnership, { isLoading: isApproving }] = useApprovePartnershipMutation();
  const [rejectPartnership, { isLoading: isRejecting }] = useRejectPartnershipMutation();

  const enrollment = data?.stores.find((s) => {
    const id = (s.storeId as any)?._id ?? s.storeId;
    return id === storeId;
  });

  const store = enrollment ? (enrollment.storeId as any) : null;
  const storeName = store?.name ?? "Store";

  function handleCopyKey() {
    if (!enrollment?.posApiKey) return;
    navigator.clipboard.writeText(enrollment.posApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleApprove() {
    try {
      await approvePartnership({ storeId }).unwrap();
      toast.success("Partnership approved");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to approve");
    }
  }

  async function handleReject() {
    try {
      await rejectPartnership({ storeId }).unwrap();
      toast.success("Partnership rejected");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to reject");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Enrollment not found for this store.</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/admin/partnership")}
          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{storeName}</h1>
            <Badge className={`rounded-xs ${STATUS_BADGE[enrollment.status]}`}>
              {STATUS_LABEL[enrollment.status]}
            </Badge>
          </div>
          {store?.city && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {[store.city, store.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xs border bg-card p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                <Badge className={`rounded-xs ${STATUS_BADGE[enrollment.status]}`}>
                  {STATUS_LABEL[enrollment.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  POS Connection
                </p>
                {enrollment.posApiConnected ? (
                  <span className="text-green-700 text-sm font-medium">Connected</span>
                ) : (
                  <span className="text-amber-700 text-sm font-medium">Not connected</span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Requested
                </p>
                <p>
                  {new Date(enrollment.requestedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              {enrollment.approvedAt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Approved
                  </p>
                  <p>
                    {new Date(enrollment.approvedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {enrollment.approvedBy && (
                      <span className="text-muted-foreground"> by {enrollment.approvedBy}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {enrollment.notes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm">{enrollment.notes}</p>
              </div>
            )}
          </div>

          {/* POS API Key */}
          {(enrollment.status === "active" || enrollment.status === "pending_setup") &&
            enrollment.posApiKey && (
              <div className="rounded-xs border bg-card p-5 flex flex-col gap-3">
                <p className="text-sm font-semibold">POS API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-muted rounded-xs px-3 py-2.5 truncate select-all">
                    {enrollment.posApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xs shrink-0"
                    onClick={handleCopyKey}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send in the{" "}
                  <code className="bg-muted px-1 rounded-xs">X-Partnership-Key</code> header.
                </p>
              </div>
            )}

          {/* Approve / Reject */}
          {enrollment.status === "pending_approval" && (
            <div className="flex gap-2">
              <Button
                className="rounded-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                className="rounded-xs text-destructive border-destructive/40 hover:bg-destructive/5 gap-1.5"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "inventory" && <AdminInventoryTab storeId={storeId} />}
      {activeTab === "sales" && <AdminSalesTab storeId={storeId} />}
      {activeTab === "replenishments" && <AdminReplenishmentsTab storeId={storeId} />}
      {activeTab === "billing" && <AdminBillingTab storeId={storeId} />}
    </div>
  );
}
