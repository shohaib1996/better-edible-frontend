"use client";

import { useState } from "react";
import { Plus, Loader2, AlertCircle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetOilContainersQuery } from "@/redux/api/oil/oilApi";
import type { IOilContainer } from "@/types/privateLabel/pps";
import { OilContainerCard } from "./OilContainerCard";
import { NewBatchDialog } from "./NewBatchDialog";
import { RefillDialog } from "./RefillDialog";
import { CleanDialog } from "./CleanDialog";

export default function OilContainersPanel() {
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [refillTarget, setRefillTarget] = useState<IOilContainer | null>(null);
  const [cleanTarget, setCleanTarget] = useState<IOilContainer | null>(null);

  const { data, isLoading, isError } = useGetOilContainersQuery();
  const containers = data?.containers ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading containers…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive py-12 justify-center">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load containers.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {containers.length} container{containers.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" onClick={() => setShowNewBatch(true)} className="gap-1.5 rounded-xs">
            <Plus className="w-4 h-4" />
            New Batch
          </Button>
        </div>

        {containers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <FlaskConical className="w-10 h-10 opacity-40" />
            <p className="text-sm">No containers yet. Create one to get started.</p>
          </div>
        )}

        {containers.map((container: IOilContainer) => (
          <OilContainerCard
            key={container.containerId}
            container={container}
            onRefill={setRefillTarget}
            onClean={setCleanTarget}
          />
        ))}
      </div>

      <NewBatchDialog open={showNewBatch} onClose={() => setShowNewBatch(false)} />
      <RefillDialog container={refillTarget} onClose={() => setRefillTarget(null)} />
      <CleanDialog container={cleanTarget} onClose={() => setCleanTarget(null)} />
    </>
  );
}
