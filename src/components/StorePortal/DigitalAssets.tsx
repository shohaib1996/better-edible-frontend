"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { IStoreUser } from "@/types/storeAuth/storeAuth";
import { useGetDigitalAssetsQuery } from "@/redux/api/DigitalAssets/digitalAssetsApi";
import { useGetActiveProductLinesQuery } from "@/redux/api/ProductLines/productLinesApi";
import { useGetDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import type { IDesignRequest } from "@/types/designRequests/designRequests";
import type { AssetCategory } from "@/types/digitalAssets/digitalAssets";

const categoryColors: Record<string, { bg: string; text: string }> = {
  productimage: { bg: "#fdf3ec", text: "#c45a1a" },
  flyer:        { bg: "#f0f7f2", text: "#2a7a4e" },
  banner:       { bg: "#fdf8ec", text: "#b5860e" },
  logo:         { bg: "#f0f0f8", text: "#5a5a9e" },
  social:       { bg: "#fdf3ec", text: "#c45a1a" },
  video:        { bg: "#f0f7f2", text: "#2a7a4e" },
  document:     { bg: "#fdf8ec", text: "#b5860e" },
  default:      { bg: "#f5f2e8", text: "#6b6045" },
};

function getCategoryColor(cat?: string) {
  const key = (cat || "").toLowerCase().replace(/\s+/g, "");
  return categoryColors[key] || categoryColors.default;
}

function fmtDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function categoryIcon(cat?: string) {
  const k = (cat || "").toLowerCase();
  if (k.includes("video")) return "🎬";
  if (k.includes("flyer") || k.includes("print")) return "🖨";
  if (k.includes("social")) return "📱";
  if (k.includes("logo")) return "✦";
  if (k.includes("banner")) return "🖼";
  if (k.includes("product")) return "📦";
  return "🖼";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  "revision-requested": "Revision",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:              { bg: "#f5f2e8", text: "#6b6045", dot: "#9a8f6e" },
  "in-progress":        { bg: "#fdf8ec", text: "#b5860e", dot: "#e8a832" },
  "revision-requested": { bg: "#fdf3ec", text: "#c45a1a", dot: "#e07040" },
  completed:            { bg: "#f0f7f2", text: "#2a7a4e", dot: "#3a9a5e" },
};

function FilterRow({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => { if (active !== opt) onChange(opt); }}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            background: active === opt ? "#2a2518" : "#f0ece0",
            color: active === opt ? "#f5f2e8" : "#4a4535",
            border: "1px solid",
            borderColor: active === opt ? "#2a2518" : "#d6d0b4",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RequestCard({ req }: { req: IDesignRequest }) {
  const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
  const label = STATUS_LABELS[req.status] || req.status;
  return (
    <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: "#fff", border: "1px solid #d6d0b4" }}>
      <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: sc.dot, minHeight: 40 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug mb-1.5" style={{ color: "#2a2518" }}>
          {req.description || "(No description)"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.text }}>
            {label}
          </span>
          {req.requestType && (
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: "#f5f2e8", color: "#6b6045", border: "1px solid #d6d0b4" }}
            >
              {req.requestType}
            </span>
          )}
          {req.productLine && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f0ece0", color: "#4a4535" }}>
              {req.productLine}
            </span>
          )}
          {req.revisionCount && req.revisionCount > 0 ? (
            <span className="text-xs" style={{ color: "#c45a1a" }}>
              ↺ {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs" style={{ color: "#9a8f6e" }}>{fmtDate(req.createdAt)}</p>
        {req.requestId && (
          <p className="text-[10px] mt-0.5" style={{ color: "#c0b89a" }}>{req.requestId}</p>
        )}
      </div>
    </div>
  );
}

export function DigitalAssetsPage() {
  const [user, setUser] = useState<IStoreUser | null>(null);
  const [activeTab, setActiveTab] = useState<"assets" | "requests">("assets");
  const [activeProduct, setActiveProduct] = useState("");
  const [activeType, setActiveType] = useState("");
  const didInitProduct = useRef(false);
  const didInitType = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-store-user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const { data: assetsData, isLoading: loadingAssets, isError: assetError } =
    useGetDigitalAssetsQuery({ status: "active" });

  const { data: productLinesData } = useGetActiveProductLinesQuery();

  const { data: requestsData, isLoading: loadingRequests, isError: requestError } =
    useGetDesignRequestsQuery(
      { storeId: user?.storeId || "", limit: 100 },
      { skip: activeTab !== "requests" || !user?.storeId }
    );

  const assets = assetsData?.assets ?? [];
  const productLines = productLinesData?.productLines ?? [];
  const requests = requestsData?.requests ?? [];

  const productOptions = productLines.map((l) => l.name);
  const typeOptions = Array.from(
    new Set(assets.map((a) => a.category).filter((v): v is AssetCategory => !!v && v.trim() !== ""))
  ).sort();

  useEffect(() => {
    if (didInitProduct.current || productOptions.length === 0) return;
    setActiveProduct(productOptions[0]);
    didInitProduct.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productOptions.length]);

  useEffect(() => {
    if (didInitType.current || typeOptions.length === 0) return;
    setActiveType(typeOptions[0]);
    didInitType.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeOptions.length]);

  const filtered = assets.filter(
    (a) =>
      (activeProduct === "" || (a.productLine || "") === activeProduct) &&
      (activeType === "" || (a.category || "") === activeType)
  );

  const reqCounts = {
    pending:    requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    revision:   requests.filter((r) => r.status === "revision-requested").length,
    completed:  requests.filter((r) => r.status === "completed").length,
  };

  const handleDownload = (asset: { title: string; fileUrl?: string }) => {
    if (!asset.fileUrl) return;
    const a = document.createElement("a");
    a.href = asset.fileUrl;
    a.download = asset.title;
    a.target = "_blank";
    a.click();
  };

  return (
    <div>
      {/* Tab nav */}
      <div className="flex items-center gap-1 mb-5" style={{ borderBottom: "2px solid #e5e0c8" }}>
        {(
          [
            { id: "assets" as const, label: "Asset Library" },
            { id: "requests" as const, label: "My Requests", count: requests.length || undefined },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderBottom: activeTab === t.id ? "2px solid #c45a1a" : "2px solid transparent",
              marginBottom: -2,
              color: activeTab === t.id ? "#2a2518" : "#9a8f6e",
            }}
          >
            {t.label}
            {"count" in t && t.count !== undefined && t.count > 0 && (
              <span
                className="rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                style={{ background: "#c45a1a", color: "#fff" }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Asset Library ── */}
      {activeTab === "assets" && (
        <>
          <div className="mb-4">
            <p className="text-sm" style={{ color: "#6b6045" }}>
              Download and use these assets for your store marketing, social media, and signage — no restrictions.
            </p>
          </div>

          {!loadingAssets && (productOptions.length > 0 || typeOptions.length > 0) && (
            <div className="space-y-2 mb-5">
              {productOptions.length > 0 && (
                <FilterRow options={productOptions} active={activeProduct} onChange={setActiveProduct} />
              )}
              {typeOptions.length > 0 && (
                <FilterRow options={typeOptions} active={activeType} onChange={setActiveType} />
              )}
            </div>
          )}

          {loadingAssets && (
            <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>Loading assets…</div>
          )}

          {assetError && (
            <div
              className="text-sm py-4 px-4 rounded"
              style={{ background: "#fdf0ec", color: "#c45a1a", border: "1px solid #f0c4a8" }}
            >
              Could not load assets. Please try again.
            </div>
          )}

          {!loadingAssets && !assetError && filtered.length === 0 && (
            <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
              No assets found{activeProduct !== "" || activeType !== "" ? " for the selected filters" : ""}.
            </div>
          )}

          {!loadingAssets && !assetError && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((asset) => {
                const catColor = getCategoryColor(asset.category);
                const displayDate = fmtDate(asset.updatedAt || asset.createdAt);
                return (
                  <Card
                    key={asset._id}
                    className="p-4 flex flex-col"
                    style={{ background: "#fff", border: "1px solid #d6d0b4" }}
                  >
                    {asset.previewUrl ? (
                      <div className="w-full h-36 rounded overflow-hidden mb-3 bg-[#f5f2e8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.previewUrl}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full h-36 rounded mb-3 flex items-center justify-center"
                        style={{ background: catColor.bg }}
                      >
                        <span className="text-4xl">{categoryIcon(asset.category)}</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold leading-snug" style={{ color: "#2a2518" }}>
                          {asset.title}
                        </h4>
                        {asset.category && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                            style={{ background: catColor.bg, color: catColor.text }}
                          >
                            {asset.category}
                          </span>
                        )}
                      </div>
                      {asset.productLine && (
                        <p
                          className="text-[10px] mb-1 font-medium uppercase tracking-wide"
                          style={{ color: "#9a8f6e" }}
                        >
                          {asset.productLine}
                        </p>
                      )}
                      {asset.description && (
                        <p
                          className="text-xs mb-2 leading-relaxed line-clamp-2"
                          style={{ color: "#6b6045" }}
                        >
                          {asset.description}
                        </p>
                      )}
                      {displayDate && (
                        <p className="text-xs" style={{ color: "#9a8f6e" }}>
                          {displayDate}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownload(asset)}
                      disabled={!asset.fileUrl}
                      className="mt-3 w-full py-2 rounded text-sm font-medium transition-colors"
                      style={{
                        background: asset.fileUrl ? "#c45a1a" : "#e5e0c8",
                        color: asset.fileUrl ? "#fff" : "#9a8f6e",
                        cursor: asset.fileUrl ? "pointer" : "not-allowed",
                      }}
                    >
                      {asset.fileUrl ? "↓ Download" : "Unavailable"}
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── My Requests ── */}
      {activeTab === "requests" && (
        <div className="space-y-5">
          <p className="text-sm" style={{ color: "#6b6045" }}>
            {loadingRequests
              ? "Loading…"
              : `${requests.length} total request${requests.length !== 1 ? "s" : ""}`}
          </p>

          {!loadingRequests && requests.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Pending",     count: reqCounts.pending,    dot: "#9a8f6e", text: "#6b6045" },
                { label: "In Progress", count: reqCounts.inProgress, dot: "#e8a832", text: "#b5860e" },
                { label: "Revision",    count: reqCounts.revision,   dot: "#e07040", text: "#c45a1a" },
                { label: "Completed",   count: reqCounts.completed,  dot: "#3a9a5e", text: "#2a7a4e" },
              ].map(({ label, count, dot, text }) => (
                <div
                  key={label}
                  className="rounded-lg px-4 py-3 flex items-center gap-3"
                  style={{ background: "#fff", border: "1px solid #d6d0b4" }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
                  <div>
                    <p className="text-lg font-bold leading-none" style={{ color: text }}>{count}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9a8f6e" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadingRequests && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg px-4 py-4 flex items-center gap-4 animate-pulse"
                  style={{ background: "#fff", border: "1px solid #d6d0b4" }}
                >
                  <div className="w-1 h-12 rounded-full" style={{ background: "#e5e0c8" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded w-2/3" style={{ background: "#e5e0c8" }} />
                    <div className="h-3 rounded w-1/3" style={{ background: "#e5e0c8" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {requestError && (
            <div
              className="text-sm py-4 px-4 rounded"
              style={{ background: "#fdf0ec", color: "#c45a1a", border: "1px solid #f0c4a8" }}
            >
              Could not load requests. Please try again.
            </div>
          )}

          {!loadingRequests && !requestError && requests.length === 0 && (
            <div className="text-sm py-12 text-center" style={{ color: "#9a8f6e" }}>
              No design requests yet. Contact your rep to get started.
            </div>
          )}

          {!loadingRequests && !requestError && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((req) => (
                <RequestCard key={req._id} req={req} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
