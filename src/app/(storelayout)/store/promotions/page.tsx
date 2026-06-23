"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getStoreUser } from "@/lib/storeUser";
import { StoreAvailableTab } from "@/components/Promotions/store/StoreAvailableTab";
import { StoreUsageHistoryTab } from "@/components/Promotions/store/StoreUsageHistoryTab";

type Tab = "available" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "available", label: "Available Promotions" },
  { key: "history", label: "My Usage History" },
];

export default function StorePromotionsPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("available");

  useEffect(() => {
    const user = getStoreUser();
    if (user?.storeId) setStoreId(user.storeId);
  }, []);

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
          {activeTab === "available" && <StoreAvailableTab storeId={storeId} />}
          {activeTab === "history" && <StoreUsageHistoryTab storeId={storeId} />}
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
