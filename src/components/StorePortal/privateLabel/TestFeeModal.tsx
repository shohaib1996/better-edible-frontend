"use client";

export function TestFeeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(42,37,24,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="scrollbar-hidden"
        style={{
          background: "#fbf9f2",
          border: "1px solid #d6d0b4",
          borderRadius: 16,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.75rem",
          color: "#2a2518",
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
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#c45a1a",
            marginBottom: "0.4rem",
          }}
        >
          Compliance Testing
        </div>
        <h2
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          How the test fee works on layered cannabinoid gummies
        </h2>

        <div
          style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "#4a4535", marginTop: "1rem" }}
        >
          <p style={{ marginBottom: "0.9rem" }}>
            Every production batch must pass an Oregon compliance{" "}
            <strong>potency test</strong>, which costs <strong>$250 per batch</strong>.
          </p>
          <p style={{ marginBottom: "0.5rem", fontWeight: 700, color: "#166534" }}>
            No test fee — ever:
          </p>
          <ul style={{ margin: "0 0 0.9rem 1.1rem", padding: 0 }}>
            <li>
              <strong>100mg THC</strong> (THC-only, no add-ons)
            </li>
            <li>
              <strong>100mg THC + 100mg CBD</strong>
            </li>
            <li>
              Any blend ordered at <strong>3,000+ units</strong> (a full batch — we cover the
              test)
            </li>
          </ul>
          <p style={{ marginBottom: "0.5rem", fontWeight: 700, color: "#92400e" }}>
            When a $250 test fee may apply:
          </p>
          <p style={{ marginBottom: "0.9rem" }}>
            Every other layered blend ordered at <strong>under 3,000 units</strong> requires its
            own potency test — this includes CBD at 200mg or more, and anything containing CBG,
            CBN, CBC, or THCv.
          </p>
          <p
            style={{
              marginBottom: "0.9rem",
              padding: "0.75rem 1rem",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
            }}
          >
            <strong>The pool waives it.</strong> When other stores order the{" "}
            <em>same exact cannabinoid ratio</em>, your units combine. Once a ratio&apos;s
            pooled volume reaches <strong>3,000 units</strong>, one test covers the whole batch
            and <strong>no one pays the fee</strong>.
          </p>
          <p style={{ marginBottom: 0, fontSize: "0.82rem", color: "#6b6045" }}>
            If a pool doesn&apos;t fill by the time we run the batch, we&apos;ll contact you to
            either hold the order or cover the $250 test — you&apos;re never charged by surprise.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: "1.25rem",
            width: "100%",
            padding: "0.7rem",
            background: "#c45a1a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
