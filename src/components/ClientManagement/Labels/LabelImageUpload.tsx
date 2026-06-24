import { Upload, X } from "lucide-react";

interface Props {
  files: File[];
  isDragging: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: (index: number) => void;
}

export function LabelImageUpload({
  files,
  isDragging,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: Props) {
  return (
    <div>
      <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xs cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "bg-muted hover:bg-muted/80 border-border dark:border-white/20"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload
              className={`w-8 h-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
            />
            <p className={`text-sm ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
              {isDragging ? "Drop your logo here" : "Click or drag & drop to upload logo"}
            </p>
          </div>
          <input type="file" className="hidden" accept="image/*" multiple onChange={onFileChange} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded-xs"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
