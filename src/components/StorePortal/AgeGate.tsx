"use client";

const CORMORANT = "'Cormorant Garamond', serif";
const DM_SANS = "'DM Sans', sans-serif";
const GOLD = "#C8975A";

export function AgeGate({ onVerified }: { onVerified: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#FAF8F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <p style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: "1.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#0F0E0C", marginBottom: "0.5rem" }}>
        Better Edibles
      </p>
      <div style={{ width: 32, height: 1, background: GOLD, margin: "0 auto 2rem" }} />
      <h1 style={{ fontFamily: CORMORANT, fontWeight: 400, fontSize: "clamp(1.5rem, 6vw, 2.25rem)", color: "#0F0E0C", marginBottom: "1rem", lineHeight: 1.2 }}>
        Are you 21 or older?
      </h1>
      <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.8rem", color: "rgba(15,14,12,0.55)", maxWidth: 320, lineHeight: 1.7, marginBottom: "2.5rem" }}>
        You must be 21 years of age or older to enter. This site contains information about cannabis products sold legally under applicable recreational cannabis law.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onVerified}
          style={{ fontFamily: DM_SANS, fontWeight: 400, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#FAF8F4", background: "#0F0E0C", border: "none", padding: "0.9rem 2.5rem", cursor: "pointer" }}
        >
          Yes, I&apos;m 21+
        </button>
        <button
          onClick={() => { window.location.href = "https://google.com"; }}
          style={{ fontFamily: DM_SANS, fontWeight: 400, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#0F0E0C", background: "none", border: "1px solid rgba(15,14,12,0.25)", padding: "0.9rem 2.5rem", cursor: "pointer" }}
        >
          No, Exit
        </button>
      </div>
      <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.15em", color: "rgba(15,14,12,0.35)", marginTop: "2rem", textTransform: "uppercase" }}>
        By entering you agree to our Terms of Service and Privacy Policy.<br />OLCC Licensed · Recreational Cannabis
      </p>
    </div>
  );
}
