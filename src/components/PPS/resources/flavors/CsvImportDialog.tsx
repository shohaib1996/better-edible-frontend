"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateFlavorMutation } from "@/redux/api/flavor/flavorsApi";
import { parseCsv } from "./flavorCsvParser";
import type { ParseResult } from "./flavorCsvParser";

type ImportResult = {
  name: string;
  status: "created" | "duplicate" | "error";
  message?: string;
};

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
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
    const results: ImportResult[] = [];

    for (const row of parseResult.rows) {
      try {
        await createFlavor({ name: row.name, defaultAmount: row.defaultAmount }).unwrap();
        results.push({ name: row.name, status: "created" });
      } catch (err: any) {
        const msg: string = err?.data?.message ?? "Unknown error";
        results.push({
          name: row.name,
          status: msg.toLowerCase().includes("already exists") ? "duplicate" : "error",
          message: msg,
        });
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

        {/* Format guide */}
        <div className="bg-muted/50 border border-border rounded-xs p-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <FileText className="w-3.5 h-3.5" />
            File Format Guide
          </div>
          <p>
            Upload a <span className="font-mono font-semibold">.csv</span> file with up to 2 columns:
          </p>
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

        {/* No valid rows */}
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
