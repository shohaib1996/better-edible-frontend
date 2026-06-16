"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, KeyRound, Lock, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useGetRepByIdQuery,
  useResetPasswordMutation,
  useResetPinMutation,
} from "@/redux/api/Rep/repApi";

export default function DesignerProfilePage() {
  const router = useRouter();
  const [designerId, setDesignerId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u?.id || u?.repType !== "designer") {
        router.replace("/login");
        return;
      }
      setDesignerId(u.id);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const { data: rep, isLoading } = useGetRepByIdQuery(designerId, {
    skip: !designerId,
  });

  const [resetPassword, { isLoading: isPasswordLoading }] = useResetPasswordMutation();
  const [resetPin, { isLoading: isPinLoading }] = useResetPinMutation();

  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");

  async function handlePasswordChange() {
    if (!newPassword) return;
    try {
      await resetPassword({ id: designerId, password: newPassword }).unwrap();
      toast.success("Password updated");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    }
  }

  async function handlePinChange() {
    if (!newPin) return;
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    try {
      await resetPin({ id: designerId, pin: newPin }).unwrap();
      toast.success("PIN updated");
      setNewPin("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update PIN");
    }
  }

  if (!designerId || isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Designer Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            My Profile
          </h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            View your information and manage security settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal info */}
        <div className="bg-card border border-border rounded-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Personal Information
            </p>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: "Name", value: rep.name },
              { label: "Login Name", value: rep.loginName },
              { label: "Email", value: rep.email || "—" },
              { label: "Phone", value: rep.phone || "—" },
              { label: "Territory", value: rep.territory || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 flex items-center gap-3">
                <p className="text-xs text-muted-foreground w-24 shrink-0">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
            <div className="px-4 py-3 flex items-center gap-3">
              <p className="text-xs text-muted-foreground w-24 shrink-0">Status</p>
              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-xs border capitalize ${
                rep.status === "active"
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {rep.status}
              </span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="space-y-4">
          {/* Change PIN */}
          <div className="bg-card border border-border rounded-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Change PIN
              </p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pin" className="text-xs text-muted-foreground">New PIN (4 digits)</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="rounded-xs"
                />
              </div>
              <Button
                onClick={handlePinChange}
                disabled={isPinLoading || newPin.length !== 4}
                className="w-full rounded-xs"
              >
                {isPinLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update PIN
              </Button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-card border border-border rounded-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Change Password
              </p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xs"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={isPasswordLoading || !newPassword}
                className="w-full rounded-xs"
              >
                {isPasswordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
