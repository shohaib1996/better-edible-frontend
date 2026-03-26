"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import PackagePrepView from "@/components/PPS/PackagePrepView";

export default function WorkerPackagePrepPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <button
          onClick={() => router.push("/pps?stage=3")}
          className="p-2 rounded-xs hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Package className="w-5 h-5 text-primary" />
        <span className="font-semibold text-lg">Package Prep</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
        <PackagePrepView isAdmin={false} />
      </div>
    </div>
  );
}
