"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  User,
  Sun,
  Moon,
  ChefHat,
  Wind,
  Thermometer,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Stage1View from "@/components/PPS/Stage1View";
import Stage2View from "@/components/PPS/Stage2View";
import Stage3View from "@/components/PPS/Stage3View";
import Stage4View from "@/components/PPS/Stage4View";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { useMidnightLogout } from "@/lib/useMidnightLogout";

const STAGE_META: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    repType: "production" | "packaging";
  }
> = {
  "1": { label: "Cooking & Molding", icon: ChefHat, repType: "production" },
  "2": { label: "Dehydrator Loading", icon: Wind, repType: "production" },
  "3": { label: "Container & Label", icon: Thermometer, repType: "packaging" },
  "4": { label: "Packaging", icon: Package, repType: "packaging" },
};

export default function LockedStagePage({
  params,
}: {
  params: Promise<{ stageNum: string }>;
}) {
  const { stageNum } = use(params);
  const router = useRouter();

  const [workerSelected, setWorkerSelected] = useState(false);
  const [workerName, setWorkerName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const meta = STAGE_META[stageNum];

  useEffect(() => {
    if (!meta) router.replace("/pps");
  }, [meta, router]);

  useEffect(() => {
    const saved = localStorage.getItem("pps-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const handleMidnightLogout = useCallback(() => {
    localStorage.removeItem("better-user");
    setWorkerName(null);
    setWorkerSelected(false);
  }, []);
  useMidnightLogout(handleMidnightLogout);

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

  const handleSelectWorker = (rep: {
    _id: string;
    name: string;
    repType: string;
  }) => {
    localStorage.setItem(
      "better-user",
      JSON.stringify({
        id: rep._id,
        name: rep.name,
        repType: rep.repType,
      })
    );
    setWorkerName(rep.name);
    setWorkerSelected(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("better-user");
    setWorkerName(null);
    setWorkerSelected(false);
  };

  if (!meta) return null;

  return (
    <>
      {/* Header */}
      <header className="shrink-0 border-b bg-background grid grid-cols-3 items-center px-4 h-20">
        {/* Left — worker name */}
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          {workerSelected && workerName ? (
            <>
              <User className="w-6 h-6 shrink-0" />
              <span className="truncate max-w-[160px] text-xl font-semibold">
                {workerName}
              </span>
            </>
          ) : (
            <span />
          )}
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
          {workerSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 px-3"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-lg font-semibold">Logout</span>
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      {workerSelected ? (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">
          {stageNum === "1" && (
            <Stage1View basePath={`/pps/stage/${stageNum}`} />
          )}
          {stageNum === "2" && (
            <Stage2View basePath={`/pps/stage/${stageNum}`} />
          )}
          {stageNum === "3" && (
            <Stage3View basePath={`/pps/stage/${stageNum}`} />
          )}
          {stageNum === "4" && (
            <Stage4View basePath={`/pps/stage/${stageNum}`} />
          )}
        </div>
      ) : (
        <NamePicker stageNum={stageNum} meta={meta} onSelect={handleSelectWorker} />
      )}
      {/* NO bottom tab bar */}
    </>
  );
}

function NamePicker({
  stageNum,
  meta,
  onSelect,
}: {
  stageNum: string;
  meta: {
    label: string;
    icon: React.ElementType;
    repType: "production" | "packaging";
  };
  onSelect: (rep: { _id: string; name: string; repType: string }) => void;
}) {
  const { data, isLoading, isError } = useGetAllRepsQuery();
  const Icon = meta.icon;

  const workers = (data ?? []).filter(
    (r: any) => r.repType === meta.repType && r.status === "active"
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Stage title */}
        <div className="flex items-center gap-3">
          <Icon className="w-10 h-10 text-primary shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
              Stage {stageNum}
            </p>
            <h1 className="text-3xl font-bold leading-tight">{meta.label}</h1>
          </div>
        </div>

        {/* Prompt */}
        <p className="text-2xl font-semibold text-muted-foreground">
          Who are you?
        </p>

        {/* Worker list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-destructive text-lg text-center py-12">
            Failed to load workers. Check your connection.
          </p>
        ) : workers.length === 0 ? (
          <p className="text-muted-foreground text-lg text-center py-12">
            No workers assigned to this stage.
            <br />
            Ask your manager to set up your account.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {workers.map((rep: any) => (
              <button
                key={rep._id}
                onClick={() => onSelect(rep)}
                className={cn(
                  "w-full h-16 rounded-xs border bg-card text-2xl font-semibold text-left px-5",
                  "hover:bg-primary/5 hover:border-primary transition-colors",
                  "active:scale-[0.98]"
                )}
              >
                {rep.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
