"use client";

interface ProfitInputsProps {
  volumeMode: "day" | "month";
  volumeInput: string;
  priceInput: string;
  captureInput: string;
  onVolumeMode: (mode: "day" | "month") => void;
  onVolumeInput: (v: string) => void;
  onPriceInput: (v: string) => void;
  onCaptureInput: (v: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 1rem",
  background: "rgba(255,255,255,0.07)",
  border: "1.5px solid rgba(200,151,90,0.3)",
  borderRadius: 10,
  color: "#fff",
  fontSize: "1.1rem",
  fontWeight: 600,
  outline: "none",
  boxSizing: "border-box",
};

export function ProfitInputs({
  volumeMode,
  volumeInput,
  priceInput,
  captureInput,
  onVolumeMode,
  onVolumeInput,
  onPriceInput,
  onCaptureInput,
}: ProfitInputsProps) {
  return (
    <>
      {/* Volume */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
            How many 100mg gummies do you sell?
          </label>
          <div
            style={{
              display: "flex",
              gap: 3,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 8,
              padding: 3,
              marginLeft: "0.75rem",
              flexShrink: 0,
            }}
          >
            {(["day", "month"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onVolumeMode(m)}
                style={{
                  padding: "0.3rem 0.6rem",
                  border: "none",
                  borderRadius: 6,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  background: volumeMode === m ? "#1a7a3c" : "transparent",
                  color: volumeMode === m ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                /{m === "day" ? "Day" : "Mo"}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          min={0}
          placeholder={volumeMode === "day" ? "e.g. 10" : "e.g. 200"}
          value={volumeInput}
          onChange={(e) => onVolumeInput(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Retail price */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "0.5rem",
          }}
        >
          Your retail price per gummy (after tax)
        </label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.4)",
              pointerEvents: "none",
            }}
          >
            $
          </span>
          <input
            type="number"
            min={0}
            step={0.25}
            placeholder="6.00"
            value={priceInput}
            onChange={(e) => onPriceInput(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "1.75rem" }}
          />
        </div>
      </div>

      {/* Capture % */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "0.5rem",
          }}
        >
          What % of your gummy volume would Better Edibles capture?
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            placeholder="20"
            value={captureInput}
            onChange={(e) => onCaptureInput(e.target.value)}
            style={{ ...inputStyle, paddingRight: "2.5rem" }}
          />
          <span
            style={{
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.4)",
              pointerEvents: "none",
            }}
          >
            %
          </span>
        </div>
      </div>
    </>
  );
}
