"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { ILabel } from "@/types";

interface Props {
  labelImages: ILabel["labelImages"];
  flavorName: string;
  existingImages: string[];
  newFiles: File[];
  onRemoveExisting: (publicId: string) => void;
  onRemoveNew: (index: number) => void;
  onAddFiles: (files: File[]) => void;
}

export function LabelImageUpload({
  labelImages,
  flavorName,
  existingImages,
  newFiles,
  onRemoveExisting,
  onRemoveNew,
  onAddFiles,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onAddFiles(Array.from(e.target.files));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) onAddFiles(files);
  };

  return (
    <div className="space-y-4">
      {/* Existing images */}
      {labelImages.length > 0 && (
        <div>
          <Label>Existing Logo</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {labelImages.map((img) => (
              <div key={img.publicId} className="relative group">
                <img
                  src={img.secureUrl || img.url}
                  alt={flavorName}
                  className="w-full h-20 object-cover rounded-md"
                />
                {existingImages.includes(img.publicId) ? (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(img.publicId)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">Removed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload new */}
      <div>
        <Label>Upload Logo</Label>
        <div
          className="mt-2"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label
            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xs cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "bg-muted hover:bg-muted/80 border-border dark:border-white/20"
            }`}
          >
            <div className="flex flex-col items-center justify-center py-4">
              <Upload className={`w-6 h-6 mb-1 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className={`text-xs ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
                {isDragging ? "Drop your logo here" : "Click or drag & drop to upload logo"}
              </p>
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </label>
        </div>

        {newFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {newFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New ${index + 1}`}
                  className="w-full h-20 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => onRemoveNew(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
