"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, ClipboardList, LogOut } from "lucide-react";
import { getStoreUser, clearStoreUser } from "@/lib/storeUser";

const NAV_ITEMS = [
  { href: "/store/assets", label: "Assets", icon: LayoutGrid },
  { href: "/store/design-requests", label: "My Requests", icon: ClipboardList },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/store/login") return;
    const user = getStoreUser();
    if (!user) {
      router.replace("/store/login");
      return;
    }
    setStoreName(user.storeName);
  }, [router, pathname]);

  function handleLogout() {
    clearStoreUser();
    router.replace("/store/login");
  }

  if (pathname === "/store/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/store/assets" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="Better Edibles" width={32} height={32} className="rounded-xs" />
            <span className="font-semibold text-sm hidden sm:inline">Better Edibles</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {storeName && (
              <span className="text-xs text-muted-foreground hidden md:inline">{storeName}</span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
