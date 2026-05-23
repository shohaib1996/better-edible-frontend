"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Sparkles } from "lucide-react";
import { getStoreUser } from "@/lib/storeUser";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { useGetMyOrdersQuery } from "@/redux/api/PrivateLabel/storeOrderApi";
import { GummyBuilder } from "@/components/PrivateLabel/GummyBuilder";
import { SavedGummiesList } from "@/components/PrivateLabel/SavedGummiesList";
import { SubmitSummary } from "@/components/PrivateLabel/SubmitSummary";
import { ActiveDashboard } from "@/components/PrivateLabel/ActiveDashboard";

type Tab = "build" | "my-line" | "submit" | "labels" | "orders";

export default function PrivateLabelPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [active, setActive] = useState<Tab>("build");

  // Pagination state
  const [labelsPage, setLabelsPage] = useState(1);
  const [labelsLimit, setLabelsLimit] = useState(10);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);

  useEffect(() => {
    const user = getStoreUser();
    if (user) {
      setStoreId(user.storeId);
      setStoreName(user.storeName);
    }
  }, []);

  // Draft labels — no pagination, used for My Line / Submit tabs
  const {
    data: draftData,
    isLoading: isLoadingDrafts,
    refetch: refetchDrafts,
  } = useGetMyLabelsQuery(
    { storeId: storeId ?? "", status: "draft" },
    { skip: !storeId }
  );

  // Submitted labels — paginated, used for My Labels tab
  const {
    data: submittedData,
    isLoading: isLoadingSubmitted,
    refetch: refetchSubmitted,
  } = useGetMyLabelsQuery(
    { storeId: storeId ?? "", status: "submitted", page: labelsPage, limit: labelsLimit },
    { skip: !storeId }
  );

  // Orders — paginated
  const { data: ordersData, isLoading: isLoadingOrders } = useGetMyOrdersQuery(
    { storeId: storeId ?? "", page: ordersPage, limit: ordersLimit },
    { skip: !storeId }
  );

  const draftLabels = draftData?.labels ?? [];
  const submittedLabels = submittedData?.labels ?? [];
  const labelsPagination = submittedData?.pagination;
  const orders = ordersData?.orders ?? [];
  const ordersPagination = ordersData?.pagination;

  const totalSubmitted = labelsPagination?.totalItems ?? submittedLabels.length;
  const totalOrders = ordersPagination?.totalItems ?? orders.length;

  const tabs: { id: Tab; label: string; count?: number; hidden?: boolean }[] = [
    { id: "build", label: "Builder" },
    { id: "my-line", label: "My Line", count: draftLabels.length },
    { id: "submit", label: "Submit", hidden: draftLabels.length === 0 },
    { id: "labels", label: "My Labels", count: totalSubmitted || undefined, hidden: !isLoadingSubmitted && totalSubmitted === 0 },
    { id: "orders", label: "My Orders", count: totalOrders || undefined, hidden: !isLoadingOrders && totalOrders === 0 },
  ];

  function handleSaved() {
    refetchDrafts();
    setActive("my-line");
  }

  function handleSubmitted() {
    refetchDrafts();
    refetchSubmitted();
    setActive("labels");
  }

  function handleLabelsPageChange(page: number) {
    setLabelsPage(page);
  }

  function handleLabelsLimitChange(limit: number) {
    setLabelsPage(1);
    setLabelsLimit(limit);
  }

  function handleOrdersPageChange(page: number) {
    setOrdersPage(page);
  }

  function handleOrdersLimitChange(limit: number) {
    setOrdersPage(1);
    setOrdersLimit(limit);
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
        <FlaskConical className="w-10 h-10 text-white/30 dark:text-primary/30 shrink-0 hidden sm:block" />
      </div>

      {/* Tab nav */}
      <div className="flex justify-center items-center gap-1 border-b border-border pb-0">
        {tabs
          .filter((t) => !t.hidden)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
      </div>

      {/* Content */}
      <div className="w-full">
        {active === "build" && (
          <div className="rounded-xs border border-border bg-card p-5">
            <GummyBuilder storeId={storeId} onSaved={handleSaved} />
          </div>
        )}

        {active === "my-line" && (
          <div className="space-y-4">
            <SavedGummiesList
              storeId={storeId}
              labels={draftLabels}
              isLoading={isLoadingDrafts}
            />
            {draftLabels.length > 0 && (
              <button
                onClick={() => setActive("submit")}
                className="w-full rounded-xs border border-primary text-primary text-sm font-medium py-2.5 hover:bg-primary/5 transition-colors"
              >
                Review & Submit My Line →
              </button>
            )}
          </div>
        )}

        {active === "submit" && (
          <div className="rounded-xs border border-border bg-card p-5">
            <SubmitSummary
              storeId={storeId}
              labels={draftLabels}
              onSubmitted={handleSubmitted}
            />
          </div>
        )}

        {active === "labels" && (
          <ActiveDashboard
            view="labels"
            labels={submittedLabels}
            orders={orders}
            isLoadingLabels={isLoadingSubmitted}
            isLoadingOrders={isLoadingOrders}
            labelsPagination={labelsPagination}
            onLabelsPageChange={handleLabelsPageChange}
            onLabelsLimitChange={handleLabelsLimitChange}
            ordersPagination={ordersPagination}
            onOrdersPageChange={handleOrdersPageChange}
            onOrdersLimitChange={handleOrdersLimitChange}
          />
        )}

        {active === "orders" && (
          <ActiveDashboard
            view="orders"
            labels={submittedLabels}
            orders={orders}
            isLoadingLabels={isLoadingSubmitted}
            isLoadingOrders={isLoadingOrders}
            labelsPagination={labelsPagination}
            onLabelsPageChange={handleLabelsPageChange}
            onLabelsLimitChange={handleLabelsLimitChange}
            ordersPagination={ordersPagination}
            onOrdersPageChange={handleOrdersPageChange}
            onOrdersLimitChange={handleOrdersLimitChange}
          />
        )}
      </div>
    </div>
  );
}
