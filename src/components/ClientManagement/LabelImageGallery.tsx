"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { ILabelImage } from "@/types";

interface LabelImageGalleryProps {
  images: ILabelImage[];
  onClose: () => void;
  initialIndex?: number;
}

export const LabelImageGallery = ({
  images,
  onClose,
  initialIndex = 0,
}: LabelImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentImage.secureUrl || currentImage.url;
    link.download = currentImage.originalFilename || "label-image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="relative bg-black">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Download Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-12 z-10 text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>

          {/* Main Image */}
          <div className="flex items-center justify-center min-h-[400px] max-h-[600px] p-4">
            <img
              src={currentImage.secureUrl || currentImage.url}
              alt={currentImage.originalFilename || "Label image"}
              className="max-w-full max-h-[580px] object-contain"
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto bg-muted">
            {images.map((img, index) => (
              <button
                key={img.publicId}
                onClick={() => setCurrentIndex(index)}
                className={`shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img.secureUrl || img.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-16 w-16 object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Image Info */}
        <div className="p-4 bg-background border-t text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <p>
              <span className="font-medium">Filename:</span>{" "}
              {currentImage.originalFilename || "Unknown"}
            </p>
            <p>
              <span className="font-medium">Format:</span>{" "}
              {currentImage.format?.toUpperCase() || "Unknown"}
            </p>
            <p>
              <span className="font-medium">Size:</span>{" "}
              {currentImage.bytes
                ? `${(currentImage.bytes / 1024).toFixed(2)} KB`
                : "Unknown"}
            </p>
            <p>
              <span className="font-medium">Uploaded:</span>{" "}
              {currentImage.uploadedAt
                ? new Date(currentImage.uploadedAt).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
