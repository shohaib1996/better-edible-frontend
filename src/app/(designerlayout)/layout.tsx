"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [designerName, setDesignerName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u?.id || u?.repType !== "designer") {
        router.replace("/login");
        return;
      }
      setDesignerName(u.name || u.loginName || "Designer");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("better-user");
    router.replace("/login");
  }

  if (!designerName) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Better Edibles" width={32} height={32} className="rounded-xs" />
            <span className="font-semibold text-sm hidden sm:inline">Designer Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{designerName}</span>
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
