"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  useGenerateGummyColorMutation,
  useGenerateGummyDetailsMutation,
} from "@/redux/api/PrivateLabel/storeLabelApi";
import {
  GUMMY_SIZES,
  OIL_TYPES,
  EFFECTS_BY_OIL,
  UNIT_OPTIONS,
  MIN_UNITS_PER_FLAVOR,
  TESTING_FEE,
  POOL_THRESHOLD,
  calcUnitPrice,
} from "@/lib/privateLabelHelpers";
import type { SelectedCannabinoid, GummyResult, LineItem } from "@/types/storePortal/privateLabel";
import { Chip, FieldLabel } from "./Chip";
import { ColorResultCard } from "./ColorResultCard";
import { CannabinoidSelects } from "./CannabinoidSelects";
import { TestFeeModal } from "./TestFeeModal";

interface GummyBuilderProps {
  initialCannabinoids?: SelectedCannabinoid[];
  onAddToLine: (item: LineItem) => void;
}

export function GummyBuilder({ initialCannabinoids = [], onAddToLine }: GummyBuilderProps) {
  const [flavorName, setFlavorName] = useState("");
  const [flavorNotes, setFlavorNotes] = useState("");
  const [showFlavorNotes, setShowFlavorNotes] = useState(false);
  const [gummySize, setGummySize] = useState("9g");
  const [oilType, setOilType] = useState("biomax");
  const [effect, setEffect] = useState("hybrid");
  const [units, setUnits] = useState(140);
  const [selectedCannabinoids, setSelectedCannabinoids] =
    useState<SelectedCannabinoid[]>(initialCannabinoids);
  const [isSour, setIsSour] = useState(false);
  const [result, setResult] = useState<GummyResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [showTestFeeModal, setShowTestFeeModal] = useState(false);

  const [generateColor] = useGenerateGummyColorMutation();
  const [generateDetails] = useGenerateGummyDetailsMutation();

  const sourAdder = isSour ? 0.1 : 0;
  const unitPrice = parseFloat(
    (calcUnitPrice(gummySize, oilType, effect, selectedCannabinoids) + sourAdder).toFixed(4),
  );
  const flavorTotal = units * unitPrice;
  const hasRatio = selectedCannabinoids.length > 0;
  const testingFeeWaived = hasRatio && units >= POOL_THRESHOLD;
  const testingFee = hasRatio && !testingFeeWaived ? TESTING_FEE : 0;

  const handleGenerate = async () => {
    if (!flavorName.trim()) {
      setGenerateError("Enter a flavor name first.");
      return;
    }
    setGenerateError("");
    setGenerating(true);
    setResult(null);
    try {
      const colorData = await generateColor({
        flavor: flavorName.trim(),
        ...(flavorNotes.trim() ? { notes: flavorNotes.trim() } : {}),
      }).unwrap();

      let lorann_components: { name: string; ratio_pct: number }[] = [];
      let flavor_story = "";
      try {
        const detailsData = await generateDetails({
          hex: colorData.hex,
          flavor: flavorName.trim(),
        }).unwrap();
        flavor_story = detailsData?.flavorRecipe?.flavor_note ?? "";
        const raw = detailsData?.flavorRecipe?.lorann?.components ?? [];
        if (raw.length > 0) {
          const total = raw.reduce((s, c) => s + (c.ratio_pct || 0), 0) || 1;
          lorann_components = raw.map((c) => ({
            name: c.name,
            ratio_pct: Math.round((c.ratio_pct / total) * 100),
          }));
        }
      } catch {
        // non-critical: color result is still usable without LorAnn details
      }
      setResult({
        hex: colorData.hex || "#E8732A",
        color_name: colorData.color_name || flavorName,
        rationale: colorData.rationale || "",
        flavor_description: flavor_story,
        lorann_components,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { data?: { message?: string } })?.data?.message ||
            "Could not generate. Please try again.";
      setGenerateError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToLine = () => {
    if (!result) {
      setGenerateError("Generate a color first.");
      return;
    }
    const activeEffect =
      (EFFECTS_BY_OIL[oilType] ?? EFFECTS_BY_OIL.biomax).some((e) => e.value === effect)
        ? effect
        : (EFFECTS_BY_OIL[oilType] ?? EFFECTS_BY_OIL.biomax)[0].value;
    onAddToLine({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      flavorName: flavorName.trim(),
      flavorNotes: flavorNotes,
      gummySize,
      oilType,
      effect: activeEffect,
      isSour,
      units,
      cannabinoids: [...selectedCannabinoids],
      unitPrice,
      color: result,
    });
    setFlavorName("");
    setFlavorNotes("");
    setShowFlavorNotes(false);
    setGummySize("9g");
    setOilType("biomax");
    setEffect("hybrid");
    setUnits(140);
    setSelectedCannabinoids([]);
    setIsSour(false);
    setResult(null);
    setGenerateError("");
  };

  return (
    <>
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ background: "#fff", border: "1px solid #d6d0b4" }}
      >
        {/* Flavor Name + Generate Color */}
        <div>
          <FieldLabel>Flavor Name *</FieldLabel>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Midnight Matinee, Ocean Breeze, Payday…"
              value={flavorName}
              onChange={(e) => {
                setFlavorName(e.target.value);
                setGenerateError("");
                if (result) setResult(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              className="flex-1 h-9 text-sm"
              style={{ background: "#fafaf7", border: "1px solid #d6d0b4", color: "#2a2518" }}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !flavorName.trim()}
              className="px-4 py-2 rounded text-sm font-medium shrink-0 transition-all active:scale-95 flex items-center gap-2"
              style={{
                background: generating || !flavorName.trim() ? "#e5e0c8" : "#c45a1a",
                color: generating || !flavorName.trim() ? "#9a8f6e" : "#fff",
                minWidth: 130,
              }}
            >
              {result && !generating && (
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: result.hex, border: "1px solid rgba(255,255,255,0.3)" }}
                />
              )}
              {generating ? "Generating…" : result ? result.color_name : "Generate Color"}
            </button>
          </div>

          {result && <ColorResultCard result={result} />}

          {generateError && (
            <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>{generateError}</p>
          )}
        </div>

        {/* Flavor Notes toggle */}
        <div>
          <button
            type="button"
            onClick={() => {
              setShowFlavorNotes((v) => !v);
              if (showFlavorNotes) setFlavorNotes("");
            }}
            className="text-xs transition-colors"
            style={{
              color: showFlavorNotes ? "#c45a1a" : "#9a8f6e",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {showFlavorNotes ? "− Let us pick the flavor" : "+ I'll pick the flavor myself"}
          </button>
          {showFlavorNotes && (
            <div className="mt-2">
              <Input
                placeholder="e.g. strawberry, watermelon, citrus"
                value={flavorNotes}
                onChange={(e) => setFlavorNotes(e.target.value)}
                className="h-9 text-sm w-full"
                style={{ background: "#fafaf7", border: "1px solid #d6d0b4", color: "#2a2518" }}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Oil · Effect · Size · Coating */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <FieldLabel>Oil Type</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {OIL_TYPES.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  sublabel={o.sublabel}
                  active={oilType === o.value}
                  onClick={() => {
                    setOilType(o.value);
                    const opts = EFFECTS_BY_OIL[o.value] ?? EFFECTS_BY_OIL.biomax;
                    if (o.value === "biomax") {
                      setEffect("hybrid");
                    } else if (opts.length === 1) {
                      setEffect(opts[0].value);
                    } else {
                      setEffect("");
                    }
                  }}
                />
              ))}
            </div>
          </div>
          {oilType && (
            <div>
              <FieldLabel>Effect</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {(EFFECTS_BY_OIL[oilType] ?? EFFECTS_BY_OIL.biomax).map((e) => (
                  <Chip
                    key={e.value}
                    label={e.label}
                    sublabel={e.sublabel}
                    active={effect === e.value}
                    onClick={() => setEffect(e.value)}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            <FieldLabel>Gummy Size</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {GUMMY_SIZES.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  sublabel={s.sublabel}
                  active={gummySize === s.value}
                  onClick={() => setGummySize(s.value)}
                />
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Coating</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                label="Sour"
                sublabel="+$0.10"
                active={isSour}
                onClick={() => setIsSour((v) => !v)}
              />
            </div>
          </div>
        </div>

        {/* Cannabinoid Add-ons */}
        <div>
          <FieldLabel>
            Cannabinoid Add-ons{" "}
            <span className="normal-case font-normal tracking-normal" style={{ color: "#b0a882" }}>
              (optional)
            </span>
          </FieldLabel>
          <CannabinoidSelects
            selectedCannabinoids={selectedCannabinoids}
            onChange={setSelectedCannabinoids}
            units={units}
            onOpenTestFeeModal={() => setShowTestFeeModal(true)}
          />
        </div>

        {/* Units per Flavor */}
        <div>
          <FieldLabel>
            Units per Flavor{" "}
            <span className="normal-case font-normal tracking-normal" style={{ color: "#b0a882" }}>
              (min {MIN_UNITS_PER_FLAVOR})
            </span>
          </FieldLabel>
          <select
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full h-9 rounded border text-sm px-2"
            style={{ background: "#f0ece0", borderColor: "#d6d0b4", color: "#4a4535" }}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u.toLocaleString()} units
              </option>
            ))}
          </select>
        </div>

        {/* Price bar + Add to Line */}
        <div
          className="flex items-center justify-between pt-3 mt-1"
          style={{ borderTop: "1px solid #e5e0c8" }}
        >
          <div>
            <span
              className="text-base font-semibold"
              style={{ color: "#2a2518", fontFamily: "Georgia, serif" }}
            >
              ${unitPrice.toFixed(2)}
              <span className="text-sm font-normal ml-0.5" style={{ color: "#9a8f6e" }}>
                /unit
              </span>
            </span>
            <span className="text-sm ml-3" style={{ color: "#6b6045" }}>
              × {units.toLocaleString()} ={" "}
              <span style={{ color: "#c45a1a", fontWeight: 600 }}>
                ${flavorTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
            {testingFee > 0 && (
              <span className="text-xs ml-2" style={{ color: "#92400e" }}>
                + $250 testing
              </span>
            )}
          </div>
          <button
            onClick={handleAddToLine}
            disabled={!result}
            className="px-5 py-2 rounded text-sm font-semibold transition-all active:scale-[0.97]"
            style={{
              background: !result ? "#e5e0c8" : "#c45a1a",
              color: !result ? "#9a8f6e" : "#fff",
            }}
          >
            + Add to My Line
          </button>
        </div>
        {!result && (
          <p className="text-xs -mt-2" style={{ color: "#9a8f6e" }}>
            Generate a color above before adding this flavor to your line.
          </p>
        )}
      </div>

      {showTestFeeModal && <TestFeeModal onClose={() => setShowTestFeeModal(false)} />}
    </>
  );
}
