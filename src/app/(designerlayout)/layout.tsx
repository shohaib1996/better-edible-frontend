"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Palette, User, ChevronDown, ClipboardList, ImageIcon } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [designerName, setDesignerName] = useState<string | null>(null);
  const pathname = usePathname();

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

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center">
            {[
              { href: "/designer", label: "Requests", icon: ClipboardList },
              { href: "/designer/digital-assets", label: "Digital Assets", icon: ImageIcon },
            ].map(({ href, label, icon: Icon }) => {
              const active = href === "/designer" ? pathname === "/designer" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-muted border border-border hover:border-primary/40 transition-colors outline-none">
                <div className="w-6 h-6 rounded-xs bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold leading-none shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {designerName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xs">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold truncate">{designerName}</p>
                <p className="text-[10px] text-muted-foreground">Designer</p>
              </div>
              <Link href="/designer/profile">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-xs">
                  <User className="w-3.5 h-3.5" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <div className="flex items-center justify-between px-2 py-1.5 text-sm gap-2">
                <span className="text-muted-foreground">Theme</span>
                <AnimatedThemeToggler className="flex items-center justify-center w-7 h-7 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors [&>svg]:w-3.5 [&>svg]:h-3.5" />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive rounded-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
