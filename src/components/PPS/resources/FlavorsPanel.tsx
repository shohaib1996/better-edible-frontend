"use client";

import { useState, useRef, useCallback } from "react";
import {
  Plus,
  Loader2,
  FlaskConical,
  GitMerge,
  Pencil,
  Trash2,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetFlavorsQuery,
  useCreateFlavorMutation,
  useToggleFlavorMutation,
  useUpdateFlavorMutation,
  useDeleteFlavorMutation,
} from "@/redux/api/flavor/flavorsApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import type { IFlavor } from "@/types/privateLabel/pps";

const PAGE_LIMIT_OPTIONS = [9, 18, 27, 54];
const DEFAULT_LIMIT = 9;

// ─── CSV Import Types ─────────────────────────────────────────────────────────

interface CsvRow {
  line: number;
  name: string;
  defaultAmount?: number;
}

interface CsvError {
  line: number;
  message: string;
}

interface ParseResult {
  rows: CsvRow[];
  errors: CsvError[];
}

function parseCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const rows: CsvRow[] = [];
  const errors: CsvError[] = [];

  // Skip header row if it looks like a header
  const startIndex =
    lines[0]?.toLowerCase().includes("name") ||
    lines[0]?.toLowerCase().includes("flavor")
      ? 1
      : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue; // skip blank lines

    const cols = raw.split(",").map((c) => c.trim());
    const lineNum = i + 1;

    if (cols.length > 2) {
      errors.push({ line: lineNum, message: `Too many columns (expected 1 or 2, got ${cols.length})` });
      continue;
    }

    const name = cols[0];
    if (!name) {
      errors.push({ line: lineNum, message: "Flavor name is empty" });
      continue;
    }
    if (name.length > 60) {
      errors.push({ line: lineNum, message: `Name too long (max 60 chars): "${name}"` });
      continue;
    }

    let defaultAmount: number | undefined;
    if (cols[1] !== undefined && cols[1] !== "") {
      const parsed = Number(cols[1]);
      if (isNaN(parsed) || parsed < 0) {
        errors.push({ line: lineNum, message: `Invalid amount "${cols[1]}" — must be a positive number` });
        continue;
      }
      defaultAmount = parsed;
    }

    rows.push({ line: lineNum, name, defaultAmount });
  }

  return { rows, errors };
}

// ─── CSV Import Dialog ────────────────────────────────────────────────────────

function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<
    { name: string; status: "created" | "duplicate" | "error"; message?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [createFlavor] = useCreateFlavorMutation();

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setParseResult(parseCsv(text));
      setImportResults([]);
    };
    reader.readAsText(file);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (importing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!importing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    setImporting(true);
    const results: typeof importResults = [];

    for (const row of parseResult.rows) {
      try {
        await createFlavor({ name: row.name, defaultAmount: row.defaultAmount }).unwrap();
        results.push({ name: row.name, status: "created" });
      } catch (err: any) {
        const msg: string = err?.data?.message ?? "Unknown error";
        if (msg.toLowerCase().includes("already exists")) {
          results.push({ name: row.name, status: "duplicate", message: msg });
        } else {
          results.push({ name: row.name, status: "error", message: msg });
        }
      }
    }

    setImportResults(results);
    setImporting(false);

    const created = results.filter((r) => r.status === "created").length;
    const failed = results.filter((r) => r.status !== "created").length;
    if (created > 0) toast.success(`${created} flavor${created !== 1 ? "s" : ""} imported`);
    if (failed > 0) toast.error(`${failed} flavor${failed !== 1 ? "s" : ""} skipped`);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setParseResult(null);
      setImportResults([]);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    setOpen(v);
  };

  const validRows = parseResult?.rows ?? [];
  const csvErrors = parseResult?.errors ?? [];
  const doneImporting = importResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xs bg-accent text-white hover:bg-accent/90">
          <Upload className="w-4 h-4 mr-1" />
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-xs max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hidden">
        <DialogHeader>
          <DialogTitle>Import Flavors from CSV</DialogTitle>
        </DialogHeader>

        {/* Guidance box */}
        <div className="bg-muted/50 border border-border rounded-xs p-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <FileText className="w-3.5 h-3.5" />
            File Format Guide
          </div>
          <p>Upload a <span className="font-mono font-semibold">.csv</span> file with up to 2 columns:</p>
          <div className="font-mono bg-background border border-border rounded-xs px-3 py-2 space-y-0.5">
            <p className="text-muted-foreground">flavor name, amount (optional)</p>
            <p>Watermelon, 12</p>
            <p>Mango</p>
            <p>Strawberry Lemon, 8.5</p>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-semibold text-foreground">Column 1</span> — Flavor name (required)</li>
            <li><span className="font-semibold text-foreground">Column 2</span> — Default amount in grams per mold (optional)</li>
            <li>A header row is optional and will be auto-detected</li>
            <li>Blank lines are ignored</li>
            <li>Duplicate flavors will be skipped, not overwritten</li>
          </ul>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !importing && fileRef.current?.click()}
          className={[
            "border-2 border-dashed rounded-xs px-4 py-6 flex flex-col items-center gap-2 text-center transition-colors",
            importing ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : fileName
              ? "border-green-500/50 bg-green-500/5"
              : "border-border hover:border-primary/50 hover:bg-muted/40",
          ].join(" ")}
        >
          <Upload
            className={[
              "w-6 h-6",
              isDragging ? "text-primary" : fileName ? "text-green-600" : "text-muted-foreground",
            ].join(" ")}
          />
          {fileName ? (
            <p className="text-xs font-medium text-green-700">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                {isDragging ? "Drop your CSV here" : "Drag & drop your CSV here"}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </>
          )}
          {fileName && (
            <p className="text-xs text-muted-foreground">Click to choose a different file</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
            disabled={importing}
          />
        </div>

        {/* Parse errors */}
        {csvErrors.length > 0 && (
          <div className="border border-destructive/30 bg-destructive/5 rounded-xs p-3 space-y-1">
            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {csvErrors.length} row{csvErrors.length !== 1 ? "s" : ""} with errors (will be skipped)
            </p>
            <ul className="space-y-0.5">
              {csvErrors.map((e) => (
                <li key={e.line} className="text-xs text-destructive">
                  Line {e.line}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Valid rows preview */}
        {validRows.length > 0 && !doneImporting && (
          <div className="border border-border rounded-xs overflow-hidden">
            <p className="text-xs font-medium px-3 py-2 bg-muted border-b border-border">
              {validRows.length} valid row{validRows.length !== 1 ? "s" : ""} ready to import
            </p>
            <div className="max-h-40 overflow-y-auto scrollbar-hidden divide-y divide-border">
              {validRows.map((r) => (
                <div key={r.line} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">
                    {r.defaultAmount !== undefined ? `${r.defaultAmount}g` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import results */}
        {doneImporting && (
          <div className="border border-border rounded-xs overflow-hidden">
            <p className="text-xs font-medium px-3 py-2 bg-muted border-b border-border">
              Import Results
            </p>
            <div className="max-h-40 overflow-y-auto scrollbar-hidden divide-y divide-border">
              {importResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="font-medium">{r.name}</span>
                  {r.status === "created" ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> Imported
                    </span>
                  ) : r.status === "duplicate" ? (
                    <span className="text-amber-600">Already exists</span>
                  ) : (
                    <span className="text-destructive">Error: {r.message}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No valid rows after parsing */}
        {parseResult && validRows.length === 0 && !doneImporting && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No valid rows found in the file. Please check the format and try again.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {doneImporting ? (
            <Button className="w-full rounded-xs" onClick={() => handleClose(false)}>
              Done
            </Button>
          ) : (
            <Button
              className="w-full rounded-xs"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Import {validRows.length > 0 ? `${validRows.length} Flavor${validRows.length !== 1 ? "s" : ""}` : ""}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditFlavorDialog({ flavor }: { flavor: IFlavor }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(flavor.name);
  const [defaultAmount, setDefaultAmount] = useState(
    flavor.defaultAmount !== undefined ? String(flavor.defaultAmount) : "",
  );
  const [updateFlavor, { isLoading }] = useUpdateFlavorMutation();

  const handleSave = async () => {
    try {
      await updateFlavor({
        flavorId: flavor.flavorId,
        name: name.trim() || undefined,
        defaultAmount: defaultAmount !== "" ? Number(defaultAmount) : undefined,
      }).unwrap();
      toast.success("Flavor updated");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Edit flavor"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-xs">
        <DialogHeader>
          <DialogTitle>Edit Flavor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xs"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              Default Amount (g per mold)
            </Label>
            <Input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="Optional"
              className="rounded-xs"
            />
          </div>
          <Button
            className="w-full rounded-xs"
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function FlavorsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDefaultAmount, setNewDefaultAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<IFlavor | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading } = useGetFlavorsQuery({ page, limit });
  const [createFlavor, { isLoading: isCreating }] = useCreateFlavorMutation();
  const [toggleFlavor] = useToggleFlavorMutation();
  const [deleteFlavor] = useDeleteFlavorMutation();

  const flavors = data?.flavors ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const baseFlavors = flavors.filter((f) => !f.isBlend);
  const blendFlavors = flavors.filter((f) => f.isBlend);

  const flavorMap = new Map(flavors.map((f) => [f.flavorId, f.name]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await createFlavor({
        name: newName.trim(),
        defaultAmount:
          newDefaultAmount !== "" ? Number(newDefaultAmount) : undefined,
      }).unwrap();
      toast.success(`Flavor "${res.flavor.name}" created`);
      setNewName("");
      setNewDefaultAmount("");
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create flavor");
    }
  };

  const handleToggle = async (flavor: IFlavor) => {
    try {
      const res = await toggleFlavor(flavor.flavorId).unwrap();
      toast.success(
        `"${res.flavor.name}" ${res.flavor.isActive ? "activated" : "deactivated"}`,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update flavor");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFlavor(deleteTarget.flavorId).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      if (flavors.length === 1 && page > 1) setPage(page - 1);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete flavor");
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-medium">Flavors ({totalItems})</h3>
          <p className="text-sm text-muted-foreground">
            {baseFlavors.length} base · {blendFlavors.length} blend{blendFlavors.length !== 1 ? "s" : ""} on this page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xs">
                <Plus className="w-4 h-4 mr-1" />
                Add Flavor
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xs">
              <DialogHeader>
                <DialogTitle>Add New Flavor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-1 block">Flavor Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Watermelon"
                    className="rounded-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">
                    Default Amount (g per mold) — optional
                  </Label>
                  <Input
                    type="number"
                    value={newDefaultAmount}
                    onChange={(e) => setNewDefaultAmount(e.target.value)}
                    placeholder="e.g. 12"
                    className="rounded-xs"
                  />
                </div>
                <Button
                  className="w-full rounded-xs"
                  onClick={handleCreate}
                  disabled={isCreating || !newName.trim()}
                >
                  {isCreating && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Create Flavor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading flavors…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && flavors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FlaskConical className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            No flavors yet. Add your first flavor above.
          </p>
        </div>
      )}

      {/* Base Flavors */}
      {!isLoading && baseFlavors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Base Flavors
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {baseFlavors.map((flavor) => (
              <FlavorCard
                key={flavor._id}
                flavor={flavor}
                onToggle={() => handleToggle(flavor)}
                onDelete={() => setDeleteTarget(flavor)}
                flavorMap={flavorMap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blends */}
      {!isLoading && blendFlavors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5" />
            Blends
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blendFlavors.map((flavor) => (
              <FlavorCard
                key={flavor._id}
                flavor={flavor}
                onToggle={() => handleToggle(flavor)}
                onDelete={() => setDeleteTarget(flavor)}
                flavorMap={flavorMap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalItems > 0 && (
        <GlobalPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          limitOptions={PAGE_LIMIT_OPTIONS}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flavor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Flavor Card ──────────────────────────────────────────────────────────────

function FlavorCard({
  flavor,
  onToggle,
  onDelete,
  flavorMap,
}: {
  flavor: IFlavor;
  onToggle: () => void;
  onDelete: () => void;
  flavorMap: Map<string, string>;
}) {
  return (
    <Card className="rounded-xs py-0">
      <CardContent className="px-3 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {flavor.isBlend && (
                <GitMerge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <p className="font-medium text-sm truncate">{flavor.name}</p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {flavor.flavorId}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <EditFlavorDialog flavor={flavor} />
            <button
              type="button"
              className="p-1 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete flavor"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <Badge
              variant="outline"
              className={
                flavor.isActive
                  ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                  : "bg-muted text-muted-foreground border-border text-xs"
              }
            >
              {flavor.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Blend parents */}
        {flavor.isBlend && flavor.blendOf.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flavor.blendOf.map((id) => (
              <span
                key={id}
                className="text-xs bg-muted px-2 py-0.5 rounded-xs text-muted-foreground"
              >
                {flavorMap.get(id) ?? id}
              </span>
            ))}
          </div>
        )}

        {/* Default amount */}
        {flavor.defaultAmount !== undefined && (
          <p className="text-xs text-muted-foreground">
            Default:{" "}
            <span className="font-semibold text-foreground">
              {flavor.defaultAmount}g
            </span>{" "}
            / mold
          </p>
        )}

        {/* Toggle button */}
        <Button
          size="sm"
          variant="outline"
          className={
            flavor.isActive
              ? "w-full rounded-xs text-xs h-7 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "w-full rounded-xs text-xs h-7 border-green-500/40 text-green-600 hover:bg-green-500/10 hover:text-green-600"
          }
          onClick={onToggle}
        >
          {flavor.isActive ? "Deactivate" : "Activate"}
        </Button>
      </CardContent>
    </Card>
  );
}
