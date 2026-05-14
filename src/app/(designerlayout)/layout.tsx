"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Palette } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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

  const initials = designerName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Better Edibles"
              width={48}
              height={36}
              className="rounded-xs"
            />
            <div className="hidden sm:flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-sm">Designer Portal</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Avatar chip */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-muted border border-border">
              <div className="w-6 h-6 rounded-xs bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold leading-none">
                {initials}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {designerName}
              </span>
            </div>

            <AnimatedThemeToggler className="flex items-center justify-center w-8 h-8 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors [&>svg]:w-4 [&>svg]:h-4" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs text-sm text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Logout</span>
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
