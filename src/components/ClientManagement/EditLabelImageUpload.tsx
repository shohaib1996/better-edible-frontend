import { useState } from "react";
import { Upload, X } from "lucide-react";
import type { ILabelImage } from "@/types/privateLabel/label";

interface Props {
  labelImages: ILabelImage[];
  existingImages: string[];
  newFiles: File[];
  onRemoveExisting: (publicId: string) => void;
  onRemoveNew: (index: number) => void;
  onAddFiles: (files: File[]) => void;
}

export function EditLabelImageUpload({
  labelImages,
  existingImages,
  newFiles,
  onRemoveExisting,
  onRemoveNew,
  onAddFiles,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) onAddFiles(Array.from(e.target.files));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (dropped.length > 0) onAddFiles(dropped);
  }

  const keptImages = labelImages.filter((img) =>
    existingImages.includes(img.publicId),
  );

  return (
    <div className="space-y-3">
      {/* Existing images */}
      {keptImages.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Existing images</p>
          <div className="grid grid-cols-4 gap-2">
            {keptImages.map((img) => (
              <div key={img.publicId} className="relative">
                <img
                  src={img.secureUrl || img.url}
                  alt={img.originalFilename || "label"}
                  className="w-full h-20 object-cover rounded-xs border border-border"
                />
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.publicId)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New files preview */}
      {newFiles.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">New uploads</p>
          <div className="grid grid-cols-4 gap-2">
            {newFiles.map((file, idx) => (
              <div key={idx} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-xs border border-border"
                />
                <button
                  type="button"
                  onClick={() => onRemoveNew(idx)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <label
          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xs cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "bg-muted hover:bg-muted/80 border-border dark:border-white/20"
          }`}
        >
          <Upload
            className={`w-6 h-6 mb-1 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
          />
          <p className={`text-xs ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
            {isDragging ? "Drop images here" : "Click or drag to add more images"}
          </p>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}
