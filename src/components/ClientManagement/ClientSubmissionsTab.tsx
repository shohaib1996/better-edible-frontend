"use client";

import { Loader2, FlaskConical, User } from "lucide-react";
import { useGetClientSubmissionsQuery } from "@/redux/api/PrivateLabel/storeSubmissionsApi";
import { LogoSection, RepSection, LabelRow } from "@/components/PrivateLabel/SubmissionParts";

interface Props {
  clientId: string;
}

export function ClientSubmissionsTab({ clientId }: Props) {
  const { data, isLoading } = useGetClientSubmissionsQuery(clientId, {
    refetchOnMountOrArgChange: true,
  });

  const submission = data?.submissions?.[0] ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (!submission || submission.labels.length === 0) {
    return (
      <div className="rounded-xs border border-dashed border-border p-12 text-center text-muted-foreground">
        <FlaskConical className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No submissions yet</p>
        <p className="text-sm mt-1">Store-submitted gummy lines will appear here once the store submits their line.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Logo + Rep */}
      <div className="rounded-xs border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">Logo</p>
            <LogoSection logo={submission.logo} />
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Assigned Rep
            </p>
            <RepSection rep={submission.rep} />
          </div>
        </div>
      </div>

      {/* SKU list */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-[11px]">
          {submission.labels.length} Submitted SKU{submission.labels.length !== 1 ? "s" : ""}
          {submission.totalValue > 0 && (
            <span className="ml-2 normal-case text-foreground font-bold tracking-normal text-sm">
              — ${submission.totalValue.toFixed(2)} total
            </span>
          )}
        </h3>
        <div className="rounded-xs border border-border bg-card overflow-hidden divide-y divide-border">
          {submission.labels.map((label) => (
            <LabelRow key={label._id} label={label} />
          ))}
        </div>
      </div>
    </div>
  );
}
