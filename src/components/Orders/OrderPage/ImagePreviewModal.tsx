"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ImagePreviewModalProps {
  image: {
    url: string;
    filename: string;
  } | null;
  onClose: () => void;
}

export const ImagePreviewModal = ({
  image,
  onClose,
}: ImagePreviewModalProps) => {
  if (!image) return null;

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      // Fetch the image as a blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <span className="truncate">{image.filename}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[400px]">
          <img
            src={image.url}
            alt={image.filename}
            className="max-w-full max-h-[600px] object-contain"
          />
        </div>
        <DialogFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => handleDownloadImage(image.url, image.filename)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
