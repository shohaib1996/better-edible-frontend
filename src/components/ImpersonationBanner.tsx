"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [repName, setRepName] = useState("");

  useEffect(() => {
    const checkImpersonation = () => {
      const impersonating = localStorage.getItem("is-impersonating") === "true";
      setIsImpersonating(impersonating);

      if (impersonating) {
        const adminData = JSON.parse(
          localStorage.getItem("impersonating-admin") || "{}"
        );
        const repData = JSON.parse(localStorage.getItem("better-user") || "{}");

        setAdminName(adminData.name || "Admin");
        setRepName(repData.name || "Rep");
      }
    };

    checkImpersonation();
    window.addEventListener("storage", checkImpersonation);
    return () => window.removeEventListener("storage", checkImpersonation);
  }, []);

  if (!isImpersonating) return null;

  const handleExit = () => {
    // Restore admin session
    const adminSession = localStorage.getItem("impersonating-admin");
    if (adminSession) {
      localStorage.setItem("better-user", adminSession);
      localStorage.removeItem("impersonating-admin");
    }

    localStorage.removeItem("is-impersonating");

    // Hard redirect (reliable for session swap)
    window.location.href = "/admin/reps";
  };

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto flex items-center justify-between py-2 px-3">
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <span className="text-lg">🕵️</span>

          <div className="leading-tight">
            <span>You are impersonating </span>
            <strong className="font-semibold">{repName}</strong>

            <span className="mx-2 text-amber-600">•</span>

            <span className="text-amber-700">
              Admin: <strong>{adminName}</strong>
            </span>
          </div>
        </div>

        <Button
          onClick={handleExit}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-md px-3 py-1 h-8"
        >
          Exit
        </Button>
      </div>
    </div>
  );
}
