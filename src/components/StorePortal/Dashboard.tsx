"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import { useGetMyOrdersQuery } from "@/redux/api/PrivateLabel/storeOrderApi";
import { useGetOpenPoolsQuery } from "@/redux/api/PrivateLabel/poolApi";
import { useGetStoreByIdQuery } from "@/redux/api/Stores/stores";

const GUMMY_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663721104112/hFK3bZtNMbaPzAzvvjdqbb/portal-gummy-hero-mmXrNC6FgC4VxwvwuQyQ6d.webp";

interface Order {
  _id: string;
  orderNumber?: number;
  createdAt: string;
  totalAmount?: number;
  status?: string;
}

const statusColor: Record<string, string> = {
  submitted: "#c45a1a",
  processing: "#b5860e",
  shipped: "#2a7a4e",
  delivered: "#2a7a4e",
  cancelled: "#a33",
};

const statusLabel: Record<string, string> = {
  submitted: "Submitted",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<IStoreUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
      else router.replace("/store-portal/login");
    } catch {
      router.replace("/store-portal/login");
    }
  }, [router]);

  const { data: ordersData, isLoading: loadingOrders } = useGetMyOrdersQuery(
    { storeId: user?.storeId || "" },
    { skip: !user?.storeId }
  );

  const { data: poolsData, isLoading: loadingPools } = useGetOpenPoolsQuery();

  const { data: storeInfo } = useGetStoreByIdQuery(user?.storeId || "", { skip: !user?.storeId });

  const orders = (ordersData?.orders ?? []) as unknown as Order[];
  const openPools = poolsData?.pools ?? [];
  const recentOrders = orders.slice(0, 5);
  const totalOrders = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter((o) =>
    ["submitted", "processing"].includes((o.status || "").toLowerCase())
  ).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const storeName = user?.storeName || "Your Store";

  // Rep info: prefer live store data, fall back to what was cached at login
  const liveRep = storeInfo?.rep && typeof storeInfo.rep === "object" ? storeInfo.rep : null;
  const repName = liveRep?.name || liveRep?.fullName || user?.repName || "";
  const repEmail = liveRep?.email || user?.repEmail || "";
  const repInitials = repName
    ? repName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.repInitials || "BE";

  const stats = [
    { label: "Total Orders", value: loadingOrders ? "…" : String(totalOrders), sub: "All time", color: "#c45a1a" },
    { label: "Total Spend", value: loadingOrders ? "…" : fmt(totalSpend), sub: "All time", color: "#2a7a4e" },
    { label: "Pending", value: loadingOrders ? "…" : String(pendingOrders), sub: "In progress", color: "#b5860e" },
    { label: "Private Labels", value: "—", sub: "Coming soon", color: "#6b6045" },
  ];

  const quickActions = [
    { label: "Place a New Order", path: "/store-portal/orders" },
    { label: "Build a Private Label", path: "/store-portal/private-label" },
    { label: "Download Assets", path: "/store-portal/assets" },
    { label: "View Promotions", path: "/store-portal/promotions" },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div className="rounded-xl overflow-hidden mb-6 relative" style={{ height: 160 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GUMMY_HERO} alt="" className="w-full h-full object-cover object-center" />
        <div
          className="absolute inset-0 flex flex-col justify-center px-6 lg:px-8"
          style={{ background: "linear-gradient(to right, rgba(30,24,16,0.78) 0%, transparent 70%)" }}
        >
          <h2
            className="text-xl lg:text-2xl font-semibold text-white mb-1"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {greeting}, {storeName}.
          </h2>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.82)" }}>
            Everything your store needs, in one place.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
            <div
              className="text-2xl lg:text-3xl font-bold mb-0.5"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-xs font-semibold" style={{ color: "#2a2518" }}>{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders — 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="p-5" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#2a2518" }}
              >
                Recent Orders
              </h3>
              <button
                className="text-xs font-medium hover:underline"
                style={{ color: "#c45a1a" }}
                onClick={() => router.push("/store-portal/orders")}
              >
                View all →
              </button>
            </div>

            {loadingOrders ? (
              <div className="text-sm py-4 text-center" style={{ color: "#9a8f6e" }}>Loading orders…</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-sm py-4 text-center" style={{ color: "#9a8f6e" }}>
                No orders yet.{" "}
                <button className="underline" style={{ color: "#c45a1a" }} onClick={() => router.push("/store-portal/orders")}>
                  Place your first order →
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {recentOrders.map((o, i) => {
                  const status = (o.status || "submitted").toLowerCase();
                  return (
                    <div
                      key={o._id}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid #ede8d0" : "none" }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium" style={{ color: "#2a2518" }}>
                            #{o.orderNumber || o._id.slice(-4).toUpperCase()}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: (statusColor[status] || "#9a8f6e") + "18",
                              color: statusColor[status] || "#9a8f6e",
                            }}
                          >
                            {statusLabel[status] || o.status}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>{fmtDate(o.createdAt)}</div>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: "#2a2518" }}>
                        {o.totalAmount ? fmt(o.totalAmount) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Open Pools */}
          <Card className="p-5" style={{ background: "#fff", border: "1px solid #cdd9f0" }}>
            <div className="flex items-center justify-between mb-1">
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#2a2518" }}
              >
                Open Pools
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#eef2fb", color: "#3a5fa8" }}>
                SHARED TESTING
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "#9a8f6e" }}>
              Join a blend to split the one-time potency test. When a pool hits its target, the test fee is waived for everyone.
            </p>
            {loadingPools ? (
              <div className="text-sm py-3 text-center" style={{ color: "#9a8f6e" }}>Loading pools…</div>
            ) : openPools.length === 0 ? (
              <div className="text-xs py-3 text-center" style={{ color: "#9a8f6e" }}>
                No open pools right now. Build a cannabinoid blend to start one.
              </div>
            ) : (
              <div className="space-y-3">
                {openPools.map((p) => (
                  <div key={p.cannabinoidKey} className="rounded-lg p-3" style={{ background: "#f7f9fd", border: "1px solid #e2e9f5" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: "#2a2518" }}>{p.ratioLabel}</span>
                      <span className="text-[11px]" style={{ color: "#6b6045" }}>
                        {p.totalUnits.toLocaleString()}/{p.requiredUnits.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden mb-1" style={{ height: 8, background: "#e6ddc8" }}>
                      <div style={{ width: `${Math.min(100, p.percent)}%`, height: "100%", background: "#3a5fa8" }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "#9a8f6e" }}>
                        {p.percent}% · {p.storeCount} {p.storeCount === 1 ? "store" : "stores"} in
                      </span>
                      <button
                        onClick={() => router.push(`/store-portal/private-label?ratio=${encodeURIComponent(p.cannabinoidKey)}`)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded"
                        style={{ background: "#3a5fa8", color: "#fff" }}
                      >
                        Build this →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card className="p-5" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
            <h3
              className="text-base font-semibold mb-4"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#2a2518" }}
            >
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded text-sm text-left transition-colors hover:bg-[#fdf3ec]"
                  style={{ color: "#4a4535" }}
                >
                  <span>{a.label}</span>
                  <span style={{ color: "#c45a1a" }}>→</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Rep card */}
          {repName && (
            <Card className="p-4" style={{ background: "#2a3d2e", border: "none" }}>
              <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#5a8a6a" }}>
                Your Rep
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "#c45a1a", color: "#fff" }}
                >
                  {repInitials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "#f0ebe0" }}>{repName}</div>
                  {repEmail && (
                    <a href={`mailto:${repEmail}`} className="text-xs hover:underline truncate block" style={{ color: "#8ab89a" }}>
                      {repEmail}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
