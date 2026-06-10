"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Sparkles, X, ChevronsUpDown, Search } from "lucide-react";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { useUpdateLabelRecipeDataMutation } from "@/redux/api/PrivateLabel/storeLabelApi";

const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;

interface RecipeDataModalProps {
  open: boolean;
  onClose: () => void;
  labelId: string;
  flavorName: string;
  initialFlavors?: string[];
  initialColorHex?: string;
  initialColorName?: string;
  onSuccess: () => void;
}

export function RecipeDataModal({
  open,
  onClose,
  labelId,
  flavorName,
  initialFlavors = [],
  initialColorHex = "",
  initialColorName = "",
  onSuccess,
}: RecipeDataModalProps) {
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(initialFlavors);
  const [colorHex, setColorHex] = useState(initialColorHex);
  const [colorName, setColorName] = useState(initialColorName);
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const [updateRecipeData, { isLoading: isSaving }] = useUpdateLabelRecipeDataMutation();

  const allFlavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );

  const filteredFlavors = useMemo(
    () =>
      allFlavors.filter(
        (f) =>
          !selectedFlavors.includes(f.name) &&
          f.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [allFlavors, selectedFlavors, search],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dropdownOpen]);

  async function fetchColor(flavors: string[]) {
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
        setColorHex(data.hex);
        setColorName(data.name || "");
      }
    } catch {
      toast.error("Failed to generate color");
    } finally {
      setIsColorLoading(false);
    }
  }

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= 3) return;
    const updated = [...selectedFlavors, name];
    setSelectedFlavors(updated);
    setSearch("");
    if (updated.length >= 3) setDropdownOpen(false);
    fetchColor(updated);
  }

  function handleRemoveFlavor(name: string) {
    const updated = selectedFlavors.filter((f) => f !== name);
    setSelectedFlavors(updated);
    if (updated.length > 0) fetchColor(updated);
    else { setColorHex(""); setColorName(""); }
  }

  async function handleSave() {
    if (selectedFlavors.length === 0) {
      toast.error("Please select at least one flavor");
      return;
    }
    try {
      await updateRecipeData({
        id: labelId,
        selectedFlavors,
        ...(colorHex && { gummyColorHex: colorHex, gummyColorName: colorName }),
      }).unwrap();
      toast.success("Recipe data saved");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save");
    }
  }

  const canAddMore = selectedFlavors.length < 3;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md rounded-xs bg-card border-border dark:border-white/20">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base leading-tight">AI Recipe Data</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{flavorName}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* ── Flavor picker ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Gummy Flavors</p>
              <span className="text-[10px] text-muted-foreground">{selectedFlavors.length} / 3</span>
            </div>

            {/* Custom inline dropdown — no portal, scroll works inside Dialog */}
            <div ref={dropdownRef} className="relative">
              {/* Trigger */}
              <button
                type="button"
                disabled={!canAddMore}
                onClick={() => { setDropdownOpen((v) => !v); setSearch(""); }}
                className="w-full flex items-center justify-between gap-2 rounded-xs border border-input bg-background px-3 h-10 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>{canAddMore ? "Select flavor…" : "3 flavors selected"}</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xs border border-border bg-popover shadow-md overflow-hidden">
                  {/* Search */}
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search flavors…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {/* List */}
                  <div className="max-h-48 overflow-y-auto">
                    {isLoadingFlavors ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading flavors…
                      </div>
                    ) : filteredFlavors.length === 0 ? (
                      <p className="px-3 py-2.5 text-xs text-muted-foreground italic">
                        {search ? `No results for "${search}"` : "No more flavors to add"}
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

            {/* Selected flavor chips */}
            {selectedFlavors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedFlavors.map((f) => (
                  <Badge
                    key={f}
                    variant="secondary"
                    className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 text-xs"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => handleRemoveFlavor(f)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ── Color section ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Gummy Color</p>
              {selectedFlavors.length > 0 && (
                <button
                  type="button"
                  onClick={() => fetchColor(selectedFlavors)}
                  disabled={isColorLoading}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 transition-opacity"
                >
                  {isColorLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Regenerate
                </button>
              )}
            </div>

            {isColorLoading ? (
              <div className="flex items-center gap-2 rounded-xs border border-border bg-background px-3 h-12 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Generating color from flavors…
              </div>
            ) : colorHex ? (
              <div className="flex items-center gap-3 rounded-xs border border-border bg-background px-3 py-2.5">
                <span
                  className="w-8 h-8 rounded-xs border border-border shrink-0 shadow-sm"
                  style={{ backgroundColor: colorHex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{colorName || "Custom"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{colorHex.toUpperCase()}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center rounded-xs border border-dashed border-border px-3 h-12">
                <p className="text-xs text-muted-foreground">
                  {selectedFlavors.length > 0
                    ? "Click Regenerate to auto-generate a color"
                    : "Select flavors to auto-generate a color"}
                </p>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xs">
              {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
