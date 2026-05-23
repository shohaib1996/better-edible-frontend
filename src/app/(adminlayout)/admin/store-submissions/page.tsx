"use client";

import { FlaskConical, MapPin, DollarSign, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetStoreSubmissionsQuery } from "@/redux/api/PrivateLabel/storeSubmissionsApi";

export default function StoreSubmissionsPage() {
  const { data, isLoading } = useGetStoreSubmissionsQuery();
  const submissions = data?.submissions ?? [];

  return (
    <div className="p-6 space-y-5">
      {/* Hero */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Private Label
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            Store Submissions
          </h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${submissions.length} store${submissions.length !== 1 ? "s" : ""} with submitted gummy lines`}
          </p>
        </div>
        <FlaskConical className="w-10 h-10 text-white/30 dark:text-primary/30 shrink-0 hidden sm:block" />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xs border border-border bg-card h-40 animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xs border border-dashed border-border p-12 text-center text-muted-foreground">
          <FlaskConical className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm mt-1">Store gummy lines will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {submissions.map((sub) => (
            <div key={sub.storeId} className="rounded-xs border border-border bg-card overflow-hidden">
              {/* Store header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 bg-muted/30">
                <div className="min-w-0">
                  <h2 className="font-semibold text-base truncate">{sub.storeName}</h2>
                  {(sub.city || sub.state) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {[sub.city, sub.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>{sub.labels.length} SKU{sub.labels.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>${sub.totalValue.toFixed(2)}</span>
                  </div>
                  {sub.earliestSubmission && (
                    <span className="text-xs text-muted-foreground">
                      Submitted {new Date(sub.earliestSubmission).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Gummy SKUs */}
              <div className="divide-y divide-border">
                {sub.labels.map((label) => (
                  <div key={label._id} className="px-5 py-4 flex items-start justify-between gap-6">
                    <div className="space-y-2 min-w-0">
                      <div className="font-medium text-sm">{label.flavorName}</div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="rounded-xs text-xs">
                          {label.oilType === "rosin" ? "Rosin" : "BioMax"}
                        </Badge>
                        <Badge variant="outline" className="rounded-xs text-xs">
                          {label.size === "xl" ? "XL" : "Standard"}
                        </Badge>
                        <Badge variant="outline" className="rounded-xs text-xs">
                          {label.effect
                            ? label.effect.charAt(0).toUpperCase() + label.effect.slice(1)
                            : "Hybrid"}
                        </Badge>
                        <Badge variant="outline" className="rounded-xs text-xs">
                          {label.flavorMode === "mix" ? "Mix Flavor" : "Single Flavor"}
                        </Badge>
                        {label.cannabinoids?.map((c) => (
                          <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">
                            {c.name} {c.mg}mg
                          </Badge>
                        ))}
                      </div>
                      {label.isRatio && (
                        <div className="text-xs">
                          {label.testingFeeWaived ? (
                            <span className="text-green-600">Testing fee waived (3,000+ units)</span>
                          ) : (
                            <span className="text-amber-600">+$250 testing fee applies</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="font-semibold text-sm">
                        ${(label.totalCost ?? 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {label.unitsOrdered?.toLocaleString()} units
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${(label.unitCost ?? 0).toFixed(4)}/ea
                      </div>
                      {label.productionMode && (
                        <Badge
                          variant="outline"
                          className={`rounded-xs text-[10px] ${
                            label.productionMode === "pool"
                              ? "border-blue-400 text-blue-600"
                              : "border-border"
                          }`}
                        >
                          {label.productionMode === "pool"
                            ? "Pool"
                            : label.productionMode === "custom_run"
                            ? "Custom Run"
                            : "Standard"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
