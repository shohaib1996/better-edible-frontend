"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChefHat, Wind, Thermometer, Package, LogOut, User, Sun, Moon, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Stage1View from "@/components/PPS/stage1/Stage1View";
import Stage2View from "@/components/PPS/stage2/Stage2View";
import Stage3View from "@/components/PPS/stage3/Stage3View";
import Stage4View from "@/components/PPS/stage4/Stage4View";
import PackagePrepView from "@/components/PPS/package-prep/PackagePrepView";
import { isAdminUser } from "@/lib/ppsUser";

type Stage = "stage1" | "stage2" | "stage3" | "stage4" | "package-prep";

const TABS: { id: Stage; label: string; icon: React.ElementType; short: string }[] = [
  { id: "stage1", label: "Cooking & Molding", short: "Stage 1", icon: ChefHat },
  { id: "stage2", label: "Dehydrator Loading", short: "Stage 2", icon: Wind },
  { id: "stage3", label: "Container & Label", short: "Stage 3", icon: Thermometer },
  { id: "stage4", label: "Packaging", short: "Stage 4", icon: Package },
  { id: "package-prep", label: "Package Prep", short: "Pkg Prep", icon: Tag },
];

function stageFromParam(param: string | null): Stage {
  const map: Record<string, Stage> = { "1": "stage1", "2": "stage2", "3": "stage3", "4": "stage4" };
  return map[param ?? ""] ?? "stage1";
}

export default function PPSStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<Stage>(() => {
    const p = searchParams.get("stage");
    if (p === "package-prep") return "package-prep";
    return stageFromParam(p);
  });
  const [workerName, setWorkerName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

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

  // Restore persisted theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("pps-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("pps-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pps-theme", "light");
    }
  };

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
      <header className="shrink-0 border-b bg-background grid grid-cols-3 items-center px-4 h-20">
        {/* Left — worker name */}
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <User className="w-6 h-6 shrink-0" />
          <span className="truncate max-w-[160px] text-xl font-semibold">{workerName}</span>
        </div>

        {/* Center — logo */}
        <div className="flex justify-center">
          <Image
            src="https://www.better-edibles.com/assets/logo.png"
            alt="Better Edibles"
            width={260}
            height={72}
            className="object-contain h-16 w-auto dark:invert"
            priority
          />
        </div>

        {/* Right — theme toggle + logout */}
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="shrink-0 h-11 w-11 text-muted-foreground hover:text-foreground"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 px-3"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-lg font-semibold">Logout</span>
          </Button>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">
        {active === "stage1" && <Stage1View basePath="/pps" />}
        {active === "stage2" && <Stage2View basePath="/pps" />}
        {active === "stage3" && <Stage3View basePath="/pps" />}
        {active === "stage4" && <Stage4View basePath="/pps" />}
        {active === "package-prep" && <PackagePrepView isAdmin={isAdminUser()} />}
      </div>

      {/* Bottom tab bar */}
      <nav className="shrink-0 border-t bg-background flex">
        {TABS.map(({ id, label, short, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActive(id);
                const param = id === "package-prep" ? "package-prep" : id.replace("stage", "");
                router.replace(`/pps?stage=${param}`);
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-4 font-semibold transition-colors select-none",
                isActive
                  ? "text-primary border-t-2 border-primary -mt-px bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-7 h-7" />
              <span className="hidden sm:block text-lg">{label}</span>
              <span className="block sm:hidden text-lg">{short}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
