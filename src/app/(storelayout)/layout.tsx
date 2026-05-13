"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, ClipboardList, LogOut, User, KeyRound, ChevronDown, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoreUser, clearStoreUser } from "@/lib/storeUser";

const NAV_ITEMS = [
  { href: "/store/assets", label: "Assets", icon: LayoutGrid },
  { href: "/store/design-requests", label: "My Requests", icon: ClipboardList },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [storeName, setStoreName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/store/login") return;
    const user = getStoreUser();
    if (!user) {
      router.replace("/store/login");
      return;
    }
    setStoreName(user.storeName);
    setEmail((user as any).email ?? null);
  }, [router, pathname]);

  function handleLogout() {
    clearStoreUser();
    router.replace("/store/login");
  }

  if (pathname === "/store/login") {
    return <>{children}</>;
  }

  const initials = storeName
    ? storeName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/store/assets" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="Better Edibles" width={36} height={36} className="rounded-xs" />
            <span className="font-bold text-base hidden sm:inline tracking-tight">Better Edibles</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xs text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xs px-2 py-1.5 hover:bg-accent transition-colors outline-none">
                <Avatar className="h-8 w-8 rounded-xs">
                  <AvatarFallback className="rounded-xs bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-sm font-medium truncate max-w-[130px]">{storeName ?? "Store"}</span>
                  {email && <span className="text-xs text-muted-foreground truncate max-w-[130px]">{email}</span>}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-xs">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{storeName ?? "Store"}</span>
                {email && <span className="text-xs font-normal text-muted-foreground">{email}</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="rounded-xs cursor-pointer gap-2">
                <Link href="/store/change-password">
                  <KeyRound className="w-4 h-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>

              {/* Theme submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="rounded-xs gap-2">
                  {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "light" ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  Appearance
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xs">
                  <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-xs gap-2 cursor-pointer">
                    <Sun className="w-4 h-4" />
                    Light
                    {theme === "light" && <span className="ml-auto text-primary text-xs font-bold">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-xs gap-2 cursor-pointer">
                    <Moon className="w-4 h-4" />
                    Dark
                    {theme === "dark" && <span className="ml-auto text-primary text-xs font-bold">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-xs gap-2 cursor-pointer">
                    <Monitor className="w-4 h-4" />
                    System
                    {theme === "system" && <span className="ml-auto text-primary text-xs font-bold">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="rounded-xs gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
