"use client";

import { useRef, useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileUploadZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  label?: string;
}

export function FileUploadZone({ files, onChange, accept, label }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      onChange([...files, ...arr]);
    },
    [files, onChange]
  );

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      <div
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xs p-5 text-center cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        }`}
      >
        <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-1.5" />
        <p className="text-sm text-muted-foreground">
          Drag & drop or <span className="text-primary underline">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Multiple files supported</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
      />

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded-xs px-3 py-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
