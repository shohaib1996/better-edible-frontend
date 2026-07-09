"use client";

interface Props {
  onReset: () => void;
}

export function OrderSubmittedScreen({ onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-5"
        style={{ background: "#f0f7f2", color: "#2a7a4e" }}
      >
        ✓
      </div>
      <h2
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: "Georgia, serif", color: "#2a2518" }}
      >
        Order Submitted
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6b6045" }}>
        Your rep will confirm within 24 hours.
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded text-sm font-medium"
        style={{ background: "#c45a1a", color: "#fff" }}
      >
        Place Another Order
      </button>
    </div>
  );
}
