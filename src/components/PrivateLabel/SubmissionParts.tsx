"use client";

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  ImageIcon,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdvanceLabelStageMutation } from "@/redux/api/PrivateLabel/storeSubmissionsApi";
import type { IStoreSubmission } from "@/redux/api/PrivateLabel/storeSubmissionsApi";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import type { LabelStage } from "@/types/privateLabel/label";
import { LABEL_STAGES } from "@/types/privateLabel/label";

// ─── Stage config ─────────────────────────────────────────────────────────────

export const STAGE_META: Record<LabelStage, { short: string; full: string; color: string }> = {
  design_in_progress:      { short: "Design",    full: "Design in Progress",      color: "bg-blue-500" },
  awaiting_store_approval: { short: "Review",    full: "Awaiting Store Approval",  color: "bg-amber-500" },
  store_approved:          { short: "Approved",  full: "Store Approved",           color: "bg-green-500" },
  submitted_to_olcc:       { short: "OLCC Sub.", full: "Submitted to OLCC",        color: "bg-purple-500" },
  olcc_approved:           { short: "OLCC ✓",   full: "OLCC Approved",            color: "bg-green-600" },
  print_order_submitted:   { short: "Print",     full: "Print Order Submitted",    color: "bg-indigo-500" },
  ready_for_production:    { short: "Ready",     full: "Ready for Production",     color: "bg-emerald-600" },
};

// ─── Stage stepper ────────────────────────────────────────────────────────────

export function StageStepper({
  label,
  onStageChange,
  isLoading,
}: {
  label: IStoreDraftLabel;
  onStageChange: (stage: LabelStage) => void;
  isLoading: boolean;
}) {
  const currentIdx = LABEL_STAGES.indexOf(label.currentStage ?? "design_in_progress");
  const prevStage = currentIdx > 0 ? LABEL_STAGES[currentIdx - 1] : null;
  const nextStage = currentIdx < LABEL_STAGES.length - 1 ? LABEL_STAGES[currentIdx + 1] : null;
  const currentMeta = STAGE_META[label.currentStage ?? "design_in_progress"];

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {/* Pipeline dots */}
      <div className="flex items-center gap-0">
        {LABEL_STAGES.map((stage: LabelStage, idx: number) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const meta = STAGE_META[stage];
          return (
            <div key={stage} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center min-w-0 flex-1">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 transition-all ${
                    done
                      ? "bg-green-500"
                      : active
                      ? `${meta.color} ring-2 ring-offset-1 ring-offset-background ring-current`
                      : "bg-muted-foreground/20"
                  }`}
                />
                <span
                  className={`text-[9px] mt-1 text-center leading-tight truncate max-w-[52px] ${
                    active
                      ? "font-semibold text-foreground"
                      : done
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {meta.short}
                </span>
              </div>
              {idx < LABEL_STAGES.length - 1 && (
                <div className={`h-px flex-1 mb-3 mx-0.5 transition-colors ${done ? "bg-green-500" : "bg-muted-foreground/20"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage badge + action buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentMeta.color}`} />
          <span className="text-xs font-medium text-foreground">{currentMeta.full}</span>
          <span className="text-xs text-muted-foreground">({currentIdx + 1}/{LABEL_STAGES.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {prevStage && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xs h-7 text-xs gap-1 px-2"
              disabled={isLoading}
              onClick={() => onStageChange(prevStage)}
            >
              <ChevronLeft className="w-3 h-3" />
              {STAGE_META[prevStage].short}
            </Button>
          )}
          {nextStage && (
            <Button
              size="sm"
              className="rounded-xs h-7 text-xs gap-1 px-3"
              disabled={isLoading}
              onClick={() => onStageChange(nextStage)}
            >
              {STAGE_META[nextStage].short}
              <ChevronRight className="w-3 h-3" />
            </Button>
          )}
          {!nextStage && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Logo section ─────────────────────────────────────────────────────────────

export function LogoSection({ logo }: { logo: IStoreSubmission["logo"] }) {
  const status = logo?.status ?? "use_existing";

  const badge = {
    uploaded:      { label: "Logo Uploaded",        icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30" },
    pending_email: { label: "Sending via Email",    icon: <Clock className="w-3.5 h-3.5" />,        cls: "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30" },
    use_existing:  { label: "Using Existing Logo",  icon: <RefreshCw className="w-3.5 h-3.5" />,    cls: "text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" },
  }[status];

  return (
    <div className="flex items-center gap-3">
      {status === "uploaded" && logo?.url ? (
        logo.url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
          <a href={logo.url} target="_blank" rel="noreferrer" className="shrink-0 group relative">
            <img src={logo.url} alt="Logo" className="w-14 h-14 rounded-xs object-contain border border-border bg-white" />
            <div className="absolute inset-0 rounded-xs bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-white" />
            </div>
          </a>
        ) : (
          <a href={logo.url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-xs border border-border bg-muted flex items-center justify-center shrink-0 hover:bg-accent transition-colors">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </a>
        )
      ) : (
        <div className="w-14 h-14 rounded-xs border border-border bg-muted flex items-center justify-center shrink-0">
          {status === "pending_email" ? <Mail className="w-6 h-6 text-muted-foreground" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-xs px-2 py-0.5 w-fit ${badge.cls}`}>
          {badge.icon}{badge.label}
        </span>
        {status === "uploaded" && logo?.url && (
          <a href={logo.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
            View file <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {status === "pending_email" && <p className="text-xs text-muted-foreground">Waiting for store to email the file</p>}
        {status === "use_existing"  && <p className="text-xs text-muted-foreground">Store confirmed logo on file</p>}
      </div>
    </div>
  );
}

// ─── Rep section ──────────────────────────────────────────────────────────────

export function RepSection({ rep }: { rep: IStoreSubmission["rep"] }) {
  if (!rep) return <p className="text-xs text-muted-foreground italic">No rep assigned</p>;
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-primary">{rep.name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{rep.name}</p>
        {rep.email
          ? <a href={`mailto:${rep.email}`} className="text-xs text-primary hover:underline truncate block">{rep.email}</a>
          : <p className="text-xs text-muted-foreground">No email</p>}
      </div>
    </div>
  );
}

// ─── Label row ────────────────────────────────────────────────────────────────

export function LabelRow({ label }: { label: IStoreDraftLabel }) {
  const [advanceStage, { isLoading }] = useAdvanceLabelStageMutation();

  async function handleStageChange(stage: LabelStage) {
    try {
      await advanceStage({ labelId: label._id, stage }).unwrap();
      toast.success(`Stage updated to "${STAGE_META[stage].full}"`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update stage");
    }
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-6">
        {/* Left — flavor + badges */}
        <div className="space-y-2 min-w-0 flex-1">
          <div className="font-medium text-sm">{label.flavorName}</div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="rounded-xs text-xs">{label.oilType === "rosin" ? "Rosin" : "BioMax"}</Badge>
            <Badge variant="outline" className="rounded-xs text-xs">{label.size === "xl" ? "XL" : "Standard"}</Badge>
            <Badge variant="outline" className="rounded-xs text-xs">
              {label.effect ? label.effect.charAt(0).toUpperCase() + label.effect.slice(1) : "Hybrid"}
            </Badge>
            <Badge variant="outline" className="rounded-xs text-xs">{label.flavorMode === "mix" ? "Mix Flavor" : "Single Flavor"}</Badge>
            {label.cannabinoids?.map((c) => (
              <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">{c.name} {c.mg}mg</Badge>
            ))}
          </div>
          {label.isRatio && (
            <div className="text-xs">
              {label.testingFeeWaived
                ? <span className="text-green-600 dark:text-green-400">Testing fee waived (3,000+ units)</span>
                : <span className="text-amber-600 dark:text-amber-400">+$250 testing fee applies</span>}
            </div>
          )}
          {label.submittedAt && (
            <p className="text-[11px] text-muted-foreground">Submitted {new Date(label.submittedAt).toLocaleString()}</p>
          )}
        </div>

        {/* Right — pricing */}
        <div className="text-right shrink-0 space-y-1">
          <div className="font-semibold text-sm">${(label.totalCost ?? 0).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{label.unitsOrdered?.toLocaleString()} units</div>
          <div className="text-xs text-muted-foreground">${(label.unitCost ?? 0).toFixed(4)}/ea</div>
          {label.productionMode && (
            <Badge variant="outline" className={`rounded-xs text-[10px] ${label.productionMode === "pool" ? "border-blue-400 text-blue-600" : "border-border"}`}>
              {label.productionMode === "pool" ? "Pool" : label.productionMode === "custom_run" ? "Custom Run" : "Standard"}
            </Badge>
          )}
        </div>
      </div>

      {/* Stage stepper */}
      <StageStepper label={label} onStageChange={handleStageChange} isLoading={isLoading} />
    </div>
  );
}
