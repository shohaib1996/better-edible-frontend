"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoreUser } from "@/lib/storeUser";
import {
  useGetPromotionStatusQuery,
  useEnrollInPromotionsMutation,
  useGetPromotionCreditsQuery,
} from "@/redux/api/Promotions/promotionsApi";
import AvailablePromotionsTab from "@/components/Promotions/store/AvailablePromotionsTab";
import MyPromotionsTab from "@/components/Promotions/store/MyPromotionsTab";
import CreatePromotionTab from "@/components/Promotions/store/CreatePromotionTab";
import CreditBalanceWidget from "@/components/Promotions/store/CreditBalanceWidget";

type Tab = "available" | "my" | "create";

export default function PromotionsPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("available");

  useEffect(() => {
    const user = getStoreUser();
    if (user?.storeId) setStoreId(user.storeId);
  }, []);

  const { data, isLoading } = useGetPromotionStatusQuery(storeId ?? "", { skip: !storeId });
  const { data: creditData } = useGetPromotionCreditsQuery(
    { storeId: storeId ?? "" },
    { skip: !storeId || data?.enrollment?.status !== "active" }
  );

  const [enroll, { isLoading: isEnrolling }] = useEnrollInPromotionsMutation();

  const enrollment = data?.enrollment;
  const status = enrollment?.status ?? data?.status ?? "not_enrolled";
  const creditBalance = creditData?.creditBalance ?? enrollment?.creditBalance ?? 0;

  async function handleEnroll() {
    if (!storeId) return;
    try {
      await enroll({ storeId }).unwrap();
      toast.success("Application submitted — we'll review it shortly");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to submit application");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not enrolled ─────────────────────────────────────────────────────────────
  if (status === "not_enrolled" || !enrollment) {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-xs bg-primary/10 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Promotions Program</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Run promotions on Better Edibles products in your store and earn
            credits for every unit sold — applied automatically to your account.
          </p>
        </div>

        <div className="rounded-xs border bg-card p-5 flex flex-col gap-3 text-sm">
          <p className="font-semibold">How it works</p>
          <ul className="text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Apply to join the program — approval required</li>
            <li>Browse available company promotions or create your own</li>
            <li>Run the promotion in your store</li>
            <li>Log units sold at the end of the promotion period</li>
            <li>Earn credits automatically based on units sold</li>
            <li>Credits apply to your next order or partnership bill</li>
          </ul>
        </div>

        <Button
          size="lg"
          className="w-full rounded-xs h-12 text-base"
          onClick={handleEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Join Promotions Program
        </Button>
      </div>
    );
  }

  // ── Pending approval ──────────────────────────────────────────────────────────
  if (status === "pending_approval") {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Promotions Program</h1>
        <div className="rounded-xs border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5 flex flex-col gap-2">
          <p className="font-semibold text-amber-900 dark:text-amber-300">Application under review</p>
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Your application was submitted on{" "}
            {new Date(enrollment.requestedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
            We'll notify you once it's approved.
          </p>
        </div>
      </div>
    );
  }

  // ── Rejected ──────────────────────────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Promotions Program</h1>
        <div className="rounded-xs border border-destructive/40 bg-destructive/5 p-5 flex flex-col gap-2">
          <p className="font-semibold text-destructive">Application not approved</p>
          <p className="text-sm text-muted-foreground">Contact your rep for more information.</p>
          {enrollment.notes && (
            <p className="text-sm text-muted-foreground border-t pt-2 mt-1">{enrollment.notes}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Active dashboard ──────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: "available", label: "Available Promotions" },
    { key: "my", label: "My Promotions" },
    { key: "create", label: "Create Your Own" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Promotions Program</h1>
        <Badge className="rounded-xs bg-green-100 text-green-800 border-green-300">Active</Badge>
        {creditBalance > 0 && <CreditBalanceWidget balance={creditBalance} />}
      </div>

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

      {storeId && activeTab === "available" && <AvailablePromotionsTab storeId={storeId} />}
      {storeId && activeTab === "my" && <MyPromotionsTab storeId={storeId} />}
      {storeId && activeTab === "create" && <CreatePromotionTab storeId={storeId} />}
    </div>
  );
}
