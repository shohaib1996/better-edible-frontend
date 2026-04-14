"use client";

import { Package } from "lucide-react";
import PackagePrepView from "@/components/PPS/package-prep/PackagePrepView";

export default function AdminPackagePrepPage() {
  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xs bg-primary/10 shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Package Prep</h1>
            <p className="text-sm text-muted-foreground">Label inventory — order, receive, apply, and print batch data</p>
          </div>
        </div>
      </div>
      <PackagePrepView isAdmin={true} compact />
    </div>
  );
}
