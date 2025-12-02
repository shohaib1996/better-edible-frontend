"use client";

import { use } from "react";
import { useGetRepByIdQuery } from "@/redux/api/Rep/repApi";
import { RepNotesTable } from "@/components/Notes/RepNotesTable";
import { Loader2 } from "lucide-react";

export default function RepNotesPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = use(params);

  // Fetch rep information for display
  const { data: rep, isLoading: repLoading } = useGetRepByIdQuery(repId);

  if (repLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Rep not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{rep.name}'s Notes</h1>
        <p className="text-muted-foreground mt-1">
          Territory: {rep.territory || "N/A"}
        </p>
      </div>

      {/* Notes Table Component handles all data fetching and pagination */}
      <RepNotesTable repId={repId} />
    </div>
  );
}
