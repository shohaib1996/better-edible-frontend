"use client";

import { useGetPoolQuery } from "@/redux/api/PrivateLabel/poolApi";

interface PoolModalProps {
  poolKey: string;
  poolRatioLabel: string;
  onClose: () => void;
}

export function PoolModal({ poolKey, poolRatioLabel, onClose }: PoolModalProps) {
  const { data: poolData, isLoading } = useGetPoolQuery(poolKey);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(42,37,24,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 400,
          padding: "1.5rem",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#9a8f6e",
            fontSize: "1.25rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          className="text-[10px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: "#3a5fa8" }}
        >
          Pool Progress
        </div>
        <div className="text-base font-bold mb-3" style={{ color: "#2a2518" }}>
          {poolRatioLabel || poolKey}
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-sm" style={{ color: "#9a8f6e" }}>
            Loading…
          </div>
        ) : poolData?.pool ? (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: "#6b6045" }}>Units in pool</span>
              <span className="font-bold" style={{ color: "#3a5fa8" }}>
                {poolData.pool.totalUnits.toLocaleString()} /{" "}
                {poolData.pool.requiredUnits.toLocaleString()}
              </span>
            </div>
            <div
              className="rounded-full overflow-hidden h-2 mb-3"
              style={{ background: "#eef2fb" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (poolData.pool.totalUnits / poolData.pool.requiredUnits) * 100)}%`,
                  background: "#3a5fa8",
                }}
              />
            </div>
            <div className="text-xs" style={{ color: "#9a8f6e" }}>
              {poolData.pool.entries.length} store
              {poolData.pool.entries.length !== 1 ? "s" : ""} participating · Status:{" "}
              <span style={{ color: "#2a2518", fontWeight: 500 }}>{poolData.pool.status}</span>
            </div>
            <div
              className="mt-3 rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "#eef2fb", color: "#3a5fa8" }}
            >
              When this pool reaches {poolData.pool.requiredUnits.toLocaleString()} units, the
              $250 testing fee is waived for all participating stores.
            </div>
          </>
        ) : (
          <div className="py-4 text-sm text-center" style={{ color: "#9a8f6e" }}>
            No active pool found for this blend yet.
          </div>
        )}
      </div>
    </div>
  );
}
