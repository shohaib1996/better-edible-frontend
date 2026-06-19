"use client";

import { useState, useEffect } from "react";
import { Handshake, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoreUser } from "@/lib/storeUser";
import {
  useGetPartnershipStatusQuery,
  useJoinPartnershipMutation,
} from "@/redux/api/Partnership/partnershipApi";
import InventoryTab from "@/components/Partnership/store/InventoryTab";
import SalesTab from "@/components/Partnership/store/SalesTab";
import BillingTab from "@/components/Partnership/store/BillingTab";

type Tab = "inventory" | "sales" | "billing";

export default function PartnershipPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = getStoreUser();
    if (user?.storeId) setStoreId(user.storeId);
  }, []);

  const { data, isLoading } = useGetPartnershipStatusQuery(storeId ?? "", {
    skip: !storeId,
  });

  const [joinPartnership, { isLoading: isJoining }] = useJoinPartnershipMutation();

  const enrollment = data?.enrollment;
  const status = enrollment?.status ?? data?.status ?? "not_enrolled";

  async function handleJoin() {
    if (!storeId) return;
    try {
      await joinPartnership({ storeId }).unwrap();
      toast.success("Application submitted — we'll review it shortly");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to submit application");
    }
  }

  function handleCopyKey() {
    if (!enrollment?.posApiKey) return;
    navigator.clipboard.writeText(enrollment.posApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not enrolled ────────────────────────────────────────────────────────────
  if (status === "not_enrolled" || !enrollment) {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-xs bg-primary/10 flex items-center justify-center">
            <Handshake className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Partnership Program</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Carry Better Edibles branded products in your store on a consignment
            basis. Pay only for what you sell — billed monthly based on POS
            data.
          </p>
        </div>

        <div className="rounded-xs border bg-card p-5 flex flex-col gap-3 text-sm">
          <p className="font-semibold">How it works</p>
          <ul className="text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>We place branded inventory in your store at no upfront cost</li>
            <li>Your POS system reports daily sales via our API</li>
            <li>We bill you monthly only for units sold</li>
            <li>Our driver replenishes stock and reconciles inventory</li>
          </ul>
        </div>

        <Button
          size="lg"
          className="w-full rounded-xs h-12 text-base"
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Handshake className="w-4 h-4 mr-2" />
          )}
          Join Partnership Program
        </Button>
      </div>
    );
  }

  // ── Pending approval ─────────────────────────────────────────────────────────
  if (status === "pending_approval") {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Partnership Program</h1>
        <div className="rounded-xs border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5 flex flex-col gap-2">
          <p className="font-semibold text-amber-900 dark:text-amber-300">
            Application under review
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Your application was submitted on{" "}
            {new Date(enrollment.requestedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            . Our team will reach out to confirm program fit.
          </p>
        </div>
      </div>
    );
  }

  // ── Rejected ─────────────────────────────────────────────────────────────────
  if (status === "rejected") {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Partnership Program</h1>
        <div className="rounded-xs border border-destructive/40 bg-destructive/5 p-5 flex flex-col gap-2">
          <p className="font-semibold text-destructive">Application not approved</p>
          <p className="text-sm text-muted-foreground">
            Contact your rep for more information.
          </p>
          {enrollment.notes && (
            <p className="text-sm text-muted-foreground border-t pt-2 mt-1">
              {enrollment.notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Pending setup ────────────────────────────────────────────────────────────
  if (status === "pending_setup") {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col gap-5">
        <h1 className="text-2xl font-bold">Partnership Program</h1>
        <div className="rounded-xs border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-5 flex flex-col gap-2">
          <p className="font-semibold text-green-800 dark:text-green-300">
            You're approved!
          </p>
          <p className="text-sm text-green-700 dark:text-green-400">
            Share your POS API key with your point-of-sale provider to connect
            your store. Your full dashboard unlocks once the first sale is
            received.
          </p>
        </div>

        <div className="rounded-xs border bg-card p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold">Your POS API Key</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted rounded-xs px-3 py-2.5 truncate select-all">
              {enrollment.posApiKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xs shrink-0"
              onClick={handleCopyKey}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Send this key in the{" "}
            <code className="bg-muted px-1 rounded-xs">X-Partnership-Key</code>{" "}
            header with every POS sales request.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">POS Connection:</span>
          {enrollment.posApiConnected ? (
            <Badge className="rounded-xs bg-green-100 text-green-800 border-green-300">
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-xs text-amber-700 border-amber-400">
              Not yet connected
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // ── Active ───────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: "inventory", label: "Inventory" },
    { key: "sales", label: "Sales" },
    { key: "billing", label: "Billing" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Partnership Program</h1>
        <Badge className="rounded-xs bg-green-100 text-green-800 border-green-300">
          Active
        </Badge>
      </div>

      {!enrollment.posApiConnected && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3 text-sm text-amber-800">
          <strong>POS not connected.</strong> Make sure your POS provider is
          sending sales data using your API key.
        </div>
      )}

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {storeId && activeTab === "inventory" && <InventoryTab storeId={storeId} />}
      {storeId && activeTab === "sales" && <SalesTab storeId={storeId} />}
      {storeId && activeTab === "billing" && <BillingTab storeId={storeId} />}
    </div>
  );
}
