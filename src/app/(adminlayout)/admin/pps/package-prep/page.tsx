"use client";

import { Package } from "lucide-react";
import PackagePrepView from "@/components/PPS/PackagePrepView";

export default function AdminPackagePrepPage() {
  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Package Prep</h1>
          <p className="text-sm text-muted-foreground">Label inventory — order, receive, apply, and print batch data</p>
        </div>
      </div>
      <PackagePrepView isAdmin={true} compact />
    </div>
  );
}
