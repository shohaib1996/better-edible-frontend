"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, Sparkles, User, ArrowLeft } from "lucide-react";
import { getStoreUser } from "@/lib/storeUser";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { GummyBuilder } from "@/components/PrivateLabel/GummyBuilder";
import { SavedGummiesList } from "@/components/PrivateLabel/SavedGummiesList";
import { SubmitSummary } from "@/components/PrivateLabel/SubmitSummary";

export default function PrivateLabelPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    const user = getStoreUser();
    if (user) {
      setStoreId(user.storeId);
      setStoreName(user.storeName);
    }
  }, []);

  const {
    data: draftData,
    isLoading: isLoadingDrafts,
    refetch: refetchDrafts,
  } = useGetMyLabelsQuery(
    { storeId: storeId ?? "", status: "draft" },
    { skip: !storeId }
  );

  const draftLabels = draftData?.labels ?? [];

  function handleSaved() {
    refetchDrafts();
  }

  function handleSubmitted() {
    refetchDrafts();
    router.push("/store/private-label/account?myacc=label");
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Private Label
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            Gummy Builder
          </h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            {storeName ? `Build your custom gummy line for ${storeName}` : "Build your custom gummy line"}
          </p>
        </div>
        <div className="relative shrink-0 flex flex-col items-end gap-2.5">
          <Link href="/store/private-label/account">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-accent hover:bg-accent/30 dark:bg-white/10 dark:hover:bg-white/15 text-white text-xs font-semibold border border-white/25 dark:border-white/15 transition-colors whitespace-nowrap">
              <User className="w-3.5 h-3.5" />
              My Account
            </button>
          </Link>
          <FlaskConical className="w-9 h-9 text-white/25 dark:text-primary/25 hidden sm:block" />
        </div>
      </div>

      {showSubmit ? (
        /* ── Submit view ── */
        <div className="space-y-4">
          <button
            onClick={() => setShowSubmit(false)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Builder
          </button>
          <div className="rounded-xs border border-border bg-card p-5">
            <SubmitSummary
              storeId={storeId}
              labels={draftLabels}
              onSubmitted={handleSubmitted}
            />
          </div>
        </div>
      ) : (
        /* ── Builder view ── */
        <div className="space-y-5">
          {/* My Line */}
          <div className="rounded-xs border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">My Line</span>
                {draftLabels.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                    {draftLabels.length}
                  </span>
                )}
              </div>
              {draftLabels.length > 0 && (
                <button
                  onClick={() => setShowSubmit(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Review & Submit →
                </button>
              )}
            </div>
            <div className="p-5">
              <SavedGummiesList
                storeId={storeId}
                labels={draftLabels}
                isLoading={isLoadingDrafts}
              />
            </div>
          </div>

          {/* Builder */}
          <div className="rounded-xs border border-border bg-card p-5">
            <GummyBuilder storeId={storeId} onSaved={handleSaved} />
          </div>
        </div>
      )}
    </div>
  );
}
