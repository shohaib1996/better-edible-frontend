"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSubmitLineMutation } from "@/redux/api/PrivateLabel/storeLabelApi";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import { LineItemTable } from "./LineItemTable";
import { LogoUploader } from "./LogoUploader";
import type { LogoStatus } from "./LogoUploader";

interface Props {
  storeId: string;
  labels: IStoreDraftLabel[];
  onSubmitted: () => void;
}

export function SubmitSummary({ storeId, labels, onSubmitted }: Props) {
  const [logoStatus, setLogoStatus] = useState<LogoStatus>("use_existing");
  const [logoUrl, setLogoUrl] = useState("");
  const [submitLine, { isLoading }] = useSubmitLineMutation();

  async function handleSubmit() {
    if (labels.length === 0) {
      toast.error("Add at least one gummy before submitting");
      return;
    }
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
      setLogoStatus("use_existing");
      setLogoUrl("");
      onSubmitted();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Submission failed");
    }
  }

  return (
    <div className="space-y-5">
      <LineItemTable labels={labels} />

      <LogoUploader
        storeId={storeId}
        logoStatus={logoStatus}
        onStatusChange={setLogoStatus}
        onUploadComplete={(url) => setLogoUrl(url)}
        onRemove={() => setLogoUrl("")}
      />

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
