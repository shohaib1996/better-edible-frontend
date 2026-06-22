"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, Copy, Check, Tag, Percent, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUser } from "@/lib/storeUser";
import {
  useGetPublicPromotionsQuery,
  useGetStorePromoUsageQuery,
} from "@/redux/api/Promotions/promotionsApi";
import type { IPromotion, IPromotionUsage } from "@/types/promotions/promotions";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function discountLabel(type: IPromotion["type"], value: number) {
  return type === "flat" ? `$${value.toFixed(2)} off` : `${value}% off`;
}

// ─── Promo Card ──────────────────────────────────────────────────────────────

function PromoCard({ promo }: { promo: IPromotion }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!promo.code) return;
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xs border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{promo.name}</p>
          {promo.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
          )}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-xs bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 text-xs font-medium">
          {promo.type === "flat" ? <Tag className="w-3 h-3" /> : <Percent className="w-3 h-3" />}
          {discountLabel(promo.type, promo.value)}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {promo.minOrderAmount && (
          <span>Min. order: <strong className="text-foreground">${promo.minOrderAmount.toFixed(2)}</strong></span>
        )}
        {(promo.startDate || promo.endDate) && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmt(promo.startDate)} — {fmt(promo.endDate)}
          </span>
        )}
        {promo.autoApply && (
          <span className="flex items-center gap-1 text-purple-600">
            <Zap className="w-3 h-3" /> Auto-applied at checkout
          </span>
        )}
      </div>

      {promo.code && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <p className="text-xs text-muted-foreground">Promo code:</p>
          <div className="flex items-center gap-1.5">
            <code className="bg-muted px-2.5 py-1 rounded text-sm font-mono font-semibold tracking-wide">
              {promo.code}
            </code>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Available Tab ────────────────────────────────────────────────────────────

function AvailableTab({ storeId }: { storeId: string }) {
  const { data, isLoading } = useGetPublicPromotionsQuery({ storeId });
  const promotions = data?.promotions ?? [];

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-8">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading promotions…</span>
    </div>
  );

  if (!promotions.length) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Zap className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No active promotions available right now. Check back soon.</p>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {promotions.map((promo) => <PromoCard key={promo._id} promo={promo} />)}
    </div>
  );
}

// ─── Usage History Tab ────────────────────────────────────────────────────────

function UsageHistoryTab({ storeId }: { storeId: string }) {
  const { data, isLoading } = useGetStorePromoUsageQuery({ storeId, limit: 50 });
  const usages: IPromotionUsage[] = data?.usages ?? [];

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-8">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading usage history…</span>
    </div>
  );

  if (!usages.length) return (
    <p className="text-sm text-muted-foreground py-8">No promotions applied to your orders yet.</p>
  );

  return (
    <div className="flex flex-col gap-2">
      {usages.map((u) => {
        const promo = typeof u.promotionId === "object" ? u.promotionId : null;
        const promoName = promo ? promo.name : "Promotion";
        const promoCode = promo?.code;
        return (
          <div key={u._id} className="rounded-xs border bg-card px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{promoName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {promoCode && <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{promoCode}</code>}
                <span>{fmt(u.appliedAt)}</span>
                <span className="capitalize">{u.appliedBy}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-700 shrink-0">
              -${u.discountAmount.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "available" | "history";

export default function StorePromotionsPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("available");

  useEffect(() => {
    const user = getStoreUser();
    if (user?.storeId) setStoreId(user.storeId);
  }, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: "available", label: "Available Promotions" },
    { key: "history", label: "My Usage History" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Promotions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active discount offers and your promo code usage history.
        </p>
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

      {storeId ? (
        <>
          {activeTab === "available" && <AvailableTab storeId={storeId} />}
          {activeTab === "history" && <UsageHistoryTab storeId={storeId} />}
        </>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}
    </div>
  );
}
