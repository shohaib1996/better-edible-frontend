"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Loader2, RefreshCw, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;
const MAX_FLAVORS = 3;

interface Flavor { flavorId: string; name: string; }

interface Props {
  selectedFlavors: string[];
  onSelectedFlavorsChange: (flavors: string[]) => void;
  gummyColorHex: string;
  onGummyColorHexChange: (hex: string) => void;
  gummyColorName: string;
  onGummyColorNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  allFlavors: Flavor[];
  isLoadingFlavors: boolean;
}

export function LabelAIRecipeSection({
  selectedFlavors, onSelectedFlavorsChange,
  gummyColorHex, onGummyColorHexChange,
  gummyColorName, onGummyColorNameChange,
  onColorChange,
  allFlavors, isLoadingFlavors,
}: Props) {
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [flavorDropdownOpen, setFlavorDropdownOpen] = useState(false);
  const [flavorSearch, setFlavorSearch] = useState("");
  const flavorDropdownRef = useRef<HTMLDivElement>(null);
  const flavorSearchRef = useRef<HTMLInputElement>(null);

  const filteredFlavors = useMemo(
    () => allFlavors.filter(
      (f) => !selectedFlavors.includes(f.name) &&
        f.name.toLowerCase().includes(flavorSearch.toLowerCase()),
    ),
    [allFlavors, selectedFlavors, flavorSearch],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (flavorDropdownRef.current && !flavorDropdownRef.current.contains(e.target as Node)) {
        setFlavorDropdownOpen(false);
        setFlavorSearch("");
      }
    }
    if (flavorDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [flavorDropdownOpen]);

  useEffect(() => {
    if (flavorDropdownOpen) setTimeout(() => flavorSearchRef.current?.focus(), 50);
  }, [flavorDropdownOpen]);

  async function fetchColorForFlavors(flavors: string[]) {
    if (flavors.length === 0) return;
    setIsColorLoading(true);
    try {
      const res = await fetch(COLOR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavor: flavors.join(", ") }),
      });
      const data = await res.json();
      if (data?.hex && /^#[0-9A-Fa-f]{6}$/.test(data.hex)) {
        onGummyColorHexChange(data.hex);
        onGummyColorNameChange(data.name || "");
        if (data.name) onColorChange(data.name);
      }
    } catch {
      toast.error("Failed to generate color");
    } finally {
      setIsColorLoading(false);
    }
  }

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= MAX_FLAVORS) return;
    onSelectedFlavorsChange([...selectedFlavors, name]);
    setFlavorSearch("");
    if (selectedFlavors.length + 1 >= MAX_FLAVORS) setFlavorDropdownOpen(false);
  }

  function handleRemoveFlavor(name: string) {
    onSelectedFlavorsChange(selectedFlavors.filter((f) => f !== name));
  }

  return (
    <div className="rounded-xs border border-primary/30 bg-primary/5 dark:bg-primary/10 p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Recipe Data</p>
      </div>

      {/* Gummy Flavors */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Gummy Flavors</Label>
          <span className="text-[10px] text-muted-foreground">{selectedFlavors.length} / {MAX_FLAVORS}</span>
        </div>
        <p className="text-xs text-muted-foreground">Actual production flavor(s) — used for AI recipe generation</p>

        {selectedFlavors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedFlavors.map((f) => (
              <Badge key={f} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                {f}
                <button type="button" onClick={() => handleRemoveFlavor(f)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div ref={flavorDropdownRef} className="relative">
          <button
            type="button"
            disabled={selectedFlavors.length >= MAX_FLAVORS}
            onClick={() => { setFlavorDropdownOpen((v) => !v); setFlavorSearch(""); }}
            className="w-full flex items-center justify-between gap-2 rounded-xs border border-border bg-card px-3 h-10 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>
              {selectedFlavors.length >= MAX_FLAVORS
                ? `${MAX_FLAVORS} flavor${MAX_FLAVORS > 1 ? "s" : ""} selected`
                : "Select flavor…"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>

          {flavorDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xs border border-border bg-popover shadow-md overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  ref={flavorSearchRef}
                  type="text"
                  placeholder="Search flavors…"
                  value={flavorSearch}
                  onChange={(e) => setFlavorSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {isLoadingFlavors ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading flavors…
                  </div>
                ) : filteredFlavors.length === 0 ? (
                  <p className="px-3 py-2.5 text-xs text-muted-foreground italic">
                    {flavorSearch ? `No results for "${flavorSearch}"` : "No more flavors to add"}
                  </p>
                ) : (
                  filteredFlavors.map((f) => (
                    <button
                      key={f.flavorId}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleAddFlavor(f.name)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {f.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gummy Color */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Gummy Color</Label>
          <Button
            type="button" size="sm" variant="outline"
            disabled={selectedFlavors.length === 0 || isColorLoading}
            onClick={() => fetchColorForFlavors(selectedFlavors)}
            className="rounded-xs h-7 text-xs gap-1.5 border-border dark:border-white/20 bg-card"
          >
            {isColorLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {gummyColorHex ? "Regenerate" : "Generate Color"}
          </Button>
        </div>
        {isColorLoading ? (
          <div className="flex items-center gap-2 rounded-xs border border-border bg-background px-3 h-12 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Generating color from flavors…
          </div>
        ) : gummyColorHex ? (
          <div className="flex items-center gap-3 rounded-xs border border-border bg-card px-3 py-2.5">
            <span
              className="w-8 h-8 rounded-xs border border-border shrink-0 shadow-sm"
              style={{ backgroundColor: gummyColorHex }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{gummyColorName || "Custom"}</p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{gummyColorHex.toUpperCase()}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center rounded-xs border border-dashed border-primary/30 bg-card px-3 h-12">
            <p className="text-xs text-muted-foreground">
              {selectedFlavors.length > 0
                ? "Click Regenerate to auto-generate a color"
                : "Select flavors above to auto-generate a color"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
