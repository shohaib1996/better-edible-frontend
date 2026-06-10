"use client";

import { useState } from "react";
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  FlaskConical,
  Palette,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGenerateRecipeMutation } from "@/redux/api/PrivateLabel/ppsApi";
import type { ICookItem, IAiRecipe, IAiRecipeFlavorLine } from "@/types/privateLabel/pps";

type FlavorTab = "lorann" | "extract";

interface Props {
  item: ICookItem;
  compact?: boolean;
}

function FlavorLines({
  lines,
  compact: c,
}: {
  lines: IAiRecipeFlavorLine[];
  compact?: boolean;
}) {
  if (!lines.length)
    return (
      <p className={`${c ? "text-xs" : "text-sm"} text-muted-foreground`}>
        No data
      </p>
    );
  return (
    <div className="space-y-2.5">
      {lines.map((line, i) => (
        <div key={i} className="space-y-0.5">
          <div className={`flex items-start justify-between gap-3 ${c ? "text-xs" : "text-sm"}`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{line.product}</p>
              {line.source && (
                <p className="text-xs text-muted-foreground">{line.source}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-bold tabular-nums">
                {line.gramsPerMold}g
                <span className="font-normal text-muted-foreground"> /mold</span>
              </p>
              <p className="text-muted-foreground tabular-nums">
                {line.totalGrams}g total
                {line.ratioPct != null && (
                  <span className="ml-1">· {line.ratioPct}%</span>
                )}
              </p>
            </div>
          </div>
          {line.note && (
            <p className="text-xs text-muted-foreground italic">{line.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function RecipeGuideSection({ item, compact: c }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [localRecipe, setLocalRecipe] = useState<IAiRecipe | undefined>(
    item.aiRecipe
  );
  const [generateRecipe, { isLoading }] = useGenerateRecipeMutation();

  const recipe = localRecipe ?? item.aiRecipe;
  const totalMolds = Math.ceil(item.quantity / 70);

  const [flavorTab, setFlavorTab] = useState<FlavorTab>(
    recipe?.lockedFlavorOilType ?? "lorann"
  );

  const handleGenerate = async () => {
    try {
      const result = await generateRecipe({
        cookItemId: item.cookItemId,
      }).unwrap();
      setLocalRecipe(result.aiRecipe);
      setFlavorTab(result.aiRecipe.lockedFlavorOilType ?? "lorann");
      toast.success("Recipe generated");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e.data?.message ?? "Failed to generate recipe");
    }
  };

  // ── No recipe yet ──────────────────────────────────────────────
  if (!recipe) {
    return (
      <div
        className={`mx-5 mb-3 rounded-xs border border-dashed border-primary/30 bg-primary/5 ${
          c ? "px-4 py-3" : "px-4 py-4"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className={`${c ? "w-4 h-4" : "w-5 h-5"} text-primary shrink-0`}
            />
            <div>
              <p className={`${c ? "text-xs" : "text-sm"} font-semibold`}>
                AI Recipe Guide
              </p>
              <p
                className={`${c ? "text-xs" : "text-sm"} text-muted-foreground`}
              >
                {totalMolds} mold{totalMolds !== 1 ? "s" : ""} ·{" "}
                {item.quantity.toLocaleString()} units
              </p>
            </div>
          </div>
          <Button
            size={c ? "sm" : "default"}
            onClick={handleGenerate}
            disabled={isLoading}
            className="rounded-xs shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Recipe
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ── Recipe loaded ──────────────────────────────────────────────
  return (
    <div className="mx-5 mb-3 rounded-xs border bg-muted/20 overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-2 ${
          c ? "px-4 py-2.5" : "px-4 py-3"
        }`}
      >
        {/* Left — collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
        >
          <Sparkles
            className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} text-primary shrink-0`}
          />
          <p className={`${c ? "text-xs" : "text-sm"} font-semibold`}>
            AI Recipe Guide
          </p>
          <span
            className={`${c ? "text-xs" : "text-sm"} text-muted-foreground`}
          >
            · {recipe.totalMolds} molds
          </span>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />
          )}
        </button>

        {/* Right — Regenerate button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={isLoading}
          className="rounded-xs shrink-0 h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          Regenerate
        </Button>
      </div>

      {!collapsed && (
        <div className="border-t">
          {/* ── Flavor section ── */}
          <div className={`${c ? "px-4 py-3" : "px-4 py-4"} space-y-3`}>
            {recipe.flavorNote && (
              <p className="text-xs text-muted-foreground italic">
                {recipe.flavorNote}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical
                  className={`${
                    c ? "w-3.5 h-3.5" : "w-4 h-4"
                  } text-amber-500 shrink-0`}
                />
                <p className={`${c ? "text-xs" : "text-sm"} font-semibold`}>
                  Flavor
                </p>
              </div>
              {/* Tab toggle — locked type gets Lock icon */}
              <div className="flex rounded-xs border overflow-hidden">
                {(["lorann", "extract"] as FlavorTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFlavorTab(tab)}
                    className={`${
                      c ? "text-xs px-2 py-1" : "text-xs px-3 py-1.5"
                    } font-medium transition-colors flex items-center gap-1 ${
                      flavorTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab === recipe.lockedFlavorOilType && (
                      <Lock className="w-2.5 h-2.5" />
                    )}
                    {tab === "lorann" ? "LorAnn" : "Extract"}
                  </button>
                ))}
              </div>
            </div>

            <FlavorLines
              lines={
                flavorTab === "lorann"
                  ? recipe.flavorLorann
                  : recipe.flavorExtract
              }
              compact={c}
            />

            {(flavorTab === "lorann"
              ? recipe.lorannMixingNote
              : recipe.extractMixingNote) && (
              <p
                className={`${
                  c ? "text-xs" : "text-sm"
                } text-muted-foreground italic border-t pt-2`}
              >
                {flavorTab === "lorann"
                  ? recipe.lorannMixingNote
                  : recipe.extractMixingNote}
              </p>
            )}
          </div>

          {/* ── Color section ── */}
          <div className="border-t">
            <div className={`${c ? "px-4 py-3" : "px-4 py-4"} space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Palette
                    className={`${
                      c ? "w-3.5 h-3.5" : "w-4 h-4"
                    } text-purple-500 shrink-0`}
                  />
                  <p className={`${c ? "text-xs" : "text-sm"} font-semibold`}>
                    Color Dye
                  </p>
                </div>
                {recipe.colorHexUsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-5 h-5 rounded-xs border border-border shrink-0"
                      style={{ backgroundColor: recipe.colorHexUsed }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {recipe.colorName ?? recipe.colorHexUsed}
                    </span>
                  </div>
                )}
              </div>

              {recipe.colorRecipe.length === 0 ? (
                <p className={`${c ? "text-xs" : "text-sm"} text-muted-foreground`}>
                  Generating color…
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Step 1 — mix the concentrate */}
                  <div className="rounded-xs border border-border bg-background/60 overflow-hidden">
                    <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Step 1 — Mix Concentrate
                      </p>
                    </div>
                    <div className={`px-3 ${c ? "py-2" : "py-2.5"} space-y-2`}>
                      {recipe.colorRecipe.map((line, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between gap-3 ${
                            c ? "text-xs" : "text-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className="w-4 h-4 rounded-xs shrink-0 border border-border"
                              style={{ backgroundColor: line.hex }}
                            />
                            <span className="font-semibold truncate">{line.color}</span>
                            <span className="text-muted-foreground">{line.pct}%</span>
                          </div>
                          <p className="font-bold tabular-nums shrink-0">
                            ~{line.dropsApprox} drops
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2 — add to batch */}
                  {recipe.batchColoringDrops > 0 && (
                    <div className="rounded-xs border border-purple-200 bg-purple-50 dark:border-purple-800/40 dark:bg-purple-950/20 px-3 py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Step 2 — Add to Batch
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Total concentrate drops · {recipe.totalMolds}-mold batch
                        </p>
                      </div>
                      <Badge className="rounded-xs bg-purple-600 hover:bg-purple-600 text-white text-xs font-bold shrink-0">
                        {recipe.batchColoringDrops} drops total
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {recipe.colorMixingNote && (
                <p
                  className={`${
                    c ? "text-xs" : "text-sm"
                  } text-muted-foreground italic border-t pt-2`}
                >
                  {recipe.colorMixingNote}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
