"use client";

import { useState } from "react";
import { Send, ImageIcon, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSubmitLineMutation } from "@/redux/api/PrivateLabel/storeLabelApi";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

interface Props {
  storeId: string;
  labels: IStoreDraftLabel[];
  onSubmitted: () => void;
}

type LogoStatus = "uploaded" | "pending_email" | "use_existing";

const LOGO_OPTIONS: { value: LogoStatus; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "use_existing",
    label: "Use existing logo",
    description: "We already have your logo on file.",
    icon: <RefreshCw className="w-4 h-4" />,
  },
  {
    value: "pending_email",
    label: "Send logo via email",
    description: "I'll email the logo file after submitting.",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    value: "uploaded",
    label: "I'll upload it",
    description: "Upload logo URL or send a file link.",
    icon: <ImageIcon className="w-4 h-4" />,
  },
];

export function SubmitSummary({ storeId, labels, onSubmitted }: Props) {
  const [logoStatus, setLogoStatus] = useState<LogoStatus>("use_existing");
  const [logoUrl, setLogoUrl] = useState("");
  const [submitLine, { isLoading }] = useSubmitLineMutation();

  const grandTotal = labels.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);
  const testingFeeTotal = labels.reduce((sum, l) => sum + (l.testingFeeWaived ? 0 : (l.testingFee ?? 0)), 0);

  async function handleSubmit() {
    if (labels.length === 0) {
      toast.error("Add at least one gummy before submitting");
      return;
    }
    // auto-derive production mode per label
    const productionChoices = labels.map((l) => ({
      labelId: l._id,
      productionMode: l.isRatio && !l.testingFeeWaived ? "custom_run" : "standard",
    }));
    try {
      const res = await submitLine({
        storeId,
        logoStatus,
        logoUrl: logoStatus === "uploaded" ? logoUrl : undefined,
        productionChoices,
      }).unwrap();
      toast.success(res.message ?? "Line submitted successfully");
      onSubmitted();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Submission failed");
    }
  }

  return (
    <div className="space-y-5">
      {/* Line item table */}
      <div className="rounded-xs border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Flavor
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Units
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Unit Cost
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {labels.map((label) => (
              <tr key={label._id} className="bg-card">
                <td className="px-4 py-3">
                  <div className="font-medium">{label.flavorName}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
                      {label.oilType === "rosin" ? "Rosin" : "BioMax"}
                    </Badge>
                    <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
                      {label.size === "xl" ? "XL" : "Standard"}
                    </Badge>
                    <Badge variant="outline" className="rounded-xs text-[10px] px-1.5 py-0">
                      {label.effect.charAt(0).toUpperCase() + label.effect.slice(1)}
                    </Badge>
                    {label.cannabinoids.map((c) => (
                      <Badge key={c.name} variant="secondary" className="rounded-xs text-[10px] px-1.5 py-0">
                        {c.name} {c.mg}mg
                      </Badge>
                    ))}
                  </div>
                  {label.isRatio && !label.testingFeeWaived && (
                    <div className="text-[11px] text-amber-600 mt-1">
                      +$250 testing fee
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {label.unitsOrdered.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  ${(label.unitCost ?? 0).toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  ${(label.totalCost ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted/50">
            {testingFeeTotal > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
                  Testing fees (ratio products)
                </td>
                <td className="px-4 py-2 text-right text-sm font-medium text-amber-700 dark:text-amber-400">
                  +${testingFeeTotal}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="px-4 py-3 font-semibold text-sm">
                Grand Total
              </td>
              <td className="px-4 py-3 text-right font-bold text-base">
                ${(grandTotal + testingFeeTotal).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Logo section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Logo
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LOGO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLogoStatus(opt.value)}
              className={`flex flex-col items-start gap-1 rounded-xs border p-3 text-left transition-all ${
                logoStatus === opt.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                {opt.icon}
                {opt.label}
              </div>
              <p className="text-xs leading-snug">{opt.description}</p>
            </button>
          ))}
        </div>

        {logoStatus === "uploaded" && (
          <input
            type="url"
            placeholder="Paste logo URL (Dropbox, Drive, etc.)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="mt-1 w-full h-9 rounded-xs border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}
      </div>

      {/* What happens next */}
      <div className="rounded-xs bg-muted/40 border border-border px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm mb-1">What happens after you submit?</p>
        <p>1. Our design team creates your label artwork.</p>
        <p>2. You review and approve the design.</p>
        <p>3. Label is submitted to OLCC for approval.</p>
        <p>4. Once approved, it goes into production.</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || labels.length === 0}
        className="rounded-xs w-full gap-2"
      >
        <Send className="w-4 h-4" />
        {isLoading ? "Submitting…" : `Submit My Line (${labels.length} SKU${labels.length !== 1 ? "s" : ""})`}
      </Button>
    </div>
  );
}
