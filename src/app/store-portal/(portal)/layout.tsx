"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";

const navItems = [
  { label: "Dashboard", path: "/store-portal/dashboard" },
  { label: "Private Label", path: "/store-portal/private-label" },
  { label: "Orders", path: "/store-portal/orders" },
  { label: "Digital Assets", path: "/store-portal/assets" },
  { label: "Partnership Program", path: "/store-portal/partnership" },
  { label: "Promotions", path: "/store-portal/promotions" },
];

export default function StorePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<IStoreUser | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.storeId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/promotions/credits?storeId=${user.storeId}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setCreditBalance(data.balance || 0))
      .catch(() => {});
  }, [user?.storeId]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleLogout() {
    localStorage.removeItem("better-store-user");
    router.push("/store-portal/login");
  }

  const storeName = user?.storeName || "Your Store";
  const storeInitial = storeName.charAt(0).toUpperCase();
  const repName = user?.repName || "";
  const fmtCredit = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(n || 0).toFixed(2);

  function SidebarInner({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex flex-col h-full" style={{ background: "#fff" }}>
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid #e5e0c8" }}>
          <div
            className="text-xl font-bold leading-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#2a2518" }}
          >
            Better<br />Edibles
          </div>
          <div className="text-xs mt-2 font-medium tracking-widest uppercase" style={{ color: "#9a8f6e" }}>
            Store Portal
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path === "/store-portal/dashboard" && pathname === "/store-portal");
            return (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); onNav?.(); }}
                className="w-full text-left px-3 py-2.5 text-sm rounded transition-colors block"
                style={{
                  color: isActive ? "#c45a1a" : "#4a4535",
                  fontWeight: isActive ? 700 : 400,
                  background: isActive ? "#fdf3ec" : "transparent",
                  borderLeft: isActive ? "3px solid #c45a1a" : "3px solid transparent",
                  marginBottom: 2,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid #e5e0c8" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "#c45a1a", color: "#fff" }}
            >
              {storeInitial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "#2a2518" }}>{storeName}</div>
              <div className="text-xs truncate" style={{ color: "#9a8f6e" }}>{user?.email || ""}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#fdf3ec] transition-colors"
            style={{ color: "#9a8f6e" }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e8e4c9" }}>
      <div
        className="flex overflow-hidden"
        style={{ maxWidth: "1200px", margin: "0 auto", height: "100vh", background: "#e8e4c9" }}
      >
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:block shrink-0 overflow-y-auto scrollbar-hidden"
          style={{ width: "208px", borderRight: "1px solid #d6d0b4" }}
        >
          <SidebarInner />
        </aside>

        {/* Mobile overlay */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.35)" }}
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className="fixed top-0 left-0 h-full z-50 w-64 lg:hidden overflow-y-auto scrollbar-hidden"
          style={{
            transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 250ms ease-out",
            borderRight: "1px solid #d6d0b4",
          }}
        >
          <SidebarInner onNav={() => setDrawerOpen(false)} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar */}
          <header
            className="flex items-center justify-between px-4 lg:px-6 py-3 shrink-0"
            style={{ background: "#fff", borderBottom: "1px solid #d6d0b4" }}
          >
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-1.5 rounded"
                style={{ color: "#4a4535" }}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/store-portal/promotions")}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                style={{
                  background: creditBalance > 0 ? "#e3f3e3" : "#f0ecd6",
                  color: creditBalance > 0 ? "#1f7a1f" : "#9a8f6e",
                  border: "1px solid " + (creditBalance > 0 ? "#bfe0bf" : "#d6d0b4"),
                }}
              >
                Credit: {fmtCredit(creditBalance)}
              </button>
              {repName && (
                <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "#9a8f6e" }}>
                  <span>Rep:</span>
                  <span className="font-medium" style={{ color: "#4a4535" }}>{repName}</span>
                </div>
              )}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "#c45a1a", color: "#fff" }}
                title={storeName}
              >
                {storeInitial}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-hidden p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
