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
      <div className="max-w-2xl mx-auto py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Partnership Program</h1>
          <p className="text-sm text-muted-foreground mt-1">Follow the steps below to connect your POS system.</p>
        </div>

        <div className="rounded-xs border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 px-4 py-3 flex items-center gap-3">
          <Check className="w-4 h-4 text-green-700 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            You're approved! Complete the steps below to go live.
          </p>
        </div>

        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</div>
            <div className="flex-1 w-px bg-border" />
          </div>
          <div className="flex flex-col gap-3 pb-6 flex-1">
            <p className="font-semibold text-sm pt-1">Copy your API key</p>
            <p className="text-sm text-muted-foreground">This key identifies your store. Keep it private — treat it like a password.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted rounded-xs px-3 py-2.5 break-all select-all">
                {enrollment.posApiKey}
              </code>
              <Button variant="outline" size="sm" className="rounded-xs shrink-0" onClick={handleCopyKey}>
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</div>
            <div className="flex-1 w-px bg-border" />
          </div>
          <div className="flex flex-col gap-3 pb-6 flex-1">
            <p className="font-semibold text-sm pt-1">Share integration details with your POS provider</p>
            <p className="text-sm text-muted-foreground">
              Forward the following to your POS vendor or IT person. They need to send a request to our endpoint once per day with the day's sales.
            </p>
            <div className="rounded-xs border bg-card p-4 flex flex-col gap-3 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-sans text-xs font-medium uppercase tracking-wide">Endpoint</span>
                <span className="text-foreground break-all">POST https://api.better-edibles.com/api/partnership/pos/sales</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-sans text-xs font-medium uppercase tracking-wide">Required header</span>
                <span className="text-foreground">X-Partnership-Key: <span className="text-primary">{enrollment.posApiKey?.slice(0, 8)}…</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-sans text-xs font-medium uppercase tracking-wide">Request body (JSON)</span>
                <pre className="text-foreground bg-muted rounded-xs p-3 overflow-x-auto leading-relaxed">{`{
  "date": "2026-06-19",
  "items": [
    { "sku": "B052", "unitsSold": 12 }
  ]
}`}</pre>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">SKU values</span> are provided by Better Edibles when inventory is placed in your store. The request is idempotent — re-sending the same date overwrites, it won't duplicate.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">3</div>
            <div className="flex-1 w-px bg-border" />
          </div>
          <div className="flex flex-col gap-3 pb-6 flex-1">
            <p className="font-semibold text-sm pt-1">Test the connection</p>
            <p className="text-sm text-muted-foreground">
              Ask your POS provider to send a test request. The response will look like this when it works:
            </p>
            <pre className="text-xs font-mono bg-muted rounded-xs p-3 overflow-x-auto">{`{ "success": true, "processed": 2, "skipped": 0 }`}</pre>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">processed</span> = items matched to your inventory.{" "}
              <span className="font-medium text-foreground">skipped</span> = SKUs not found (usually means the SKU doesn't match what Better Edibles provided).
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold flex items-center justify-center">4</div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <p className="font-semibold text-sm pt-1">Dashboard activates automatically</p>
            <p className="text-sm text-muted-foreground">
              Once the first successful request is received, your status flips to <span className="font-medium text-green-700">Active</span> and your full Inventory, Sales, and Billing dashboard unlocks. No action needed on your end.
            </p>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-muted-foreground">Current status:</span>
              <Badge variant="outline" className="rounded-xs text-amber-700 border-amber-400">Waiting for first connection</Badge>
            </div>
          </div>
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
