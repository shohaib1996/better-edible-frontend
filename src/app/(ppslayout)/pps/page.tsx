"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChefHat, Wind, Thermometer, Package, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Stage1View from "@/components/PPS/Stage1View";
import Stage2View from "@/components/PPS/Stage2View";
import Stage3View from "@/components/PPS/Stage3View";
import Stage4View from "@/components/PPS/Stage4View";

type Stage = "stage1" | "stage2" | "stage3" | "stage4";

const TABS: { id: Stage; label: string; icon: React.ElementType; short: string }[] = [
  { id: "stage1", label: "Cooking & Molding", short: "Stage 1", icon: ChefHat },
  { id: "stage2", label: "Dehydrator Loading", short: "Stage 2", icon: Wind },
  { id: "stage3", label: "Container & Label", short: "Stage 3", icon: Thermometer },
  { id: "stage4", label: "Packaging", short: "Stage 4", icon: Package },
];

export default function PPSStaffPage() {
  const router = useRouter();
  const [active, setActive] = useState<Stage>("stage1");
  const [workerName, setWorkerName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("better-user") || "{}");
      if (!u?.id) {
        router.replace("/login");
        return;
      }
      setWorkerName(u.name || u.loginName || "Worker");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("better-user");
    router.replace("/login");
  };

  // Don't render until auth check completes
  if (workerName === null) return null;

  return (
    <>
      {/* Header */}
      <header className="shrink-0 border-b bg-background grid grid-cols-3 items-center px-4 h-16">
        {/* Left — worker name */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[140px]">{workerName}</span>
        </div>

        {/* Center — logo */}
        <div className="flex justify-center">
          <Image
            src="https://www.better-edibles.com/assets/logo.png"
            alt="Better Edibles"
            width={240}
            height={64}
            className="object-contain h-14 w-auto"
            priority
          />
        </div>

        {/* Right — logout */}
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
        {active === "stage1" && <Stage1View basePath="/pps" />}
        {active === "stage2" && <Stage2View basePath="/pps" />}
        {active === "stage3" && <Stage3View basePath="/pps" />}
        {active === "stage4" && <Stage4View />}
      </div>

      {/* Bottom tab bar */}
      <nav className="shrink-0 border-t bg-background flex">
        {TABS.map(({ id, label, short, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors select-none",
                isActive
                  ? "text-primary border-t-2 border-primary -mt-px bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:block">{label}</span>
              <span className="block sm:hidden">{short}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
