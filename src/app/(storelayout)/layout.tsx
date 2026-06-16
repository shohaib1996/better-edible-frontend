"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutGrid,
  FlaskConical,
  LogOut,
  KeyRound,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoreUser, clearStoreUser } from "@/lib/storeUser";
import { useChangePasswordMutation } from "@/redux/api/StoreAuth/storeAuthApi";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/store/assets", label: "Digital Assets", icon: LayoutGrid },
  { href: "/store/private-label", label: "Private Label", icon: FlaskConical },
];

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [storeName, setStoreName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changePassword, { isLoading: isChanging }] = useChangePasswordMutation();

  useEffect(() => {
    if (pathname === "/store/login") return;
    const user = getStoreUser();
    if (!user) {
      router.replace("/store/login");
      return;
    }
    setStoreName(user.storeName);
    setEmail((user as any).email ?? null);
    setContactId((user as any).contactId ?? null);
  }, [router, pathname]);

  function resetPwModal() {
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setPwOpen(false);
  }

  async function handleChangePassword() {
    if (!contactId) return;
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      await changePassword({ contactId, currentPassword: currentPw, newPassword: newPw }).unwrap();
      toast.success("Password updated successfully");
      resetPwModal();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update password");
    }
  }

  function handleLogout() {
    clearStoreUser();
    router.replace("/store/login");
  }

  if (pathname === "/store/login") {
    return <>{children}</>;
  }

  const initials = storeName
    ? storeName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/store/assets"
            className="flex items-center gap-2.5 shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Better Edibles"
              width={48}
              height={36}
              className="rounded-xs"
            />
            <span className="font-bold text-base hidden sm:inline tracking-tight">
              Better Edibles
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                pathname.startsWith(href) ||
                (href === "/store/assets" && pathname.startsWith("/store/design-requests"));
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
              <button className="flex items-center gap-2 rounded-xs px-2 py-1.5 hover:bg-muted/60 transition-colors outline-none group">
                <Avatar className="h-8 w-8 rounded-xs">
                  <AvatarFallback className="rounded-xs bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-sm font-medium truncate max-w-[130px]">
                    {storeName ?? "Store"}
                  </span>
                  {email && (
                    <span className="text-xs text-muted-foreground truncate max-w-[130px]">
                      {email}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-xs">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">
                  {storeName ?? "Store"}
                </span>
                {email && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {email}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="rounded-xs cursor-pointer gap-2"
                onClick={() => setPwOpen(true)}
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </DropdownMenuItem>

              {/* Theme submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="rounded-xs gap-2">
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4" />
                  ) : theme === "light" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                  Appearance
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xs">
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="rounded-xs gap-2 cursor-pointer"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                    {theme === "light" && (
                      <span className="ml-auto text-primary text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="rounded-xs gap-2 cursor-pointer"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                    {theme === "dark" && (
                      <span className="ml-auto text-primary text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="rounded-xs gap-2 cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" />
                    System
                    {theme === "system" && (
                      <span className="ml-auto text-primary text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
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

      {/* Change Password Modal */}
      <Dialog open={pwOpen} onOpenChange={(o) => { if (!o) resetPwModal(); }}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] rounded-xs bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Change Password
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="rounded-xs pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="rounded-xs pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                  className="rounded-xs pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xs flex-1"
                onClick={resetPwModal}
                disabled={isChanging}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xs flex-1"
                onClick={handleChangePassword}
                disabled={isChanging || !currentPw || !newPw || !confirmPw}
              >
                {isChanging ? "Saving…" : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
