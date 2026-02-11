"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";

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
      <DialogContent
        showCloseButton={false}
        className="max-w-none! w-full! h-full! border-0 bg-black p-0 shadow-none gap-0 m-0 rounded-none inset-0 translate-x-0 translate-y-0 left-0 top-0"
        style={{
          width: "100vw",
          height: "100vh",
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      >
        <Button
          onClick={onClose}
          className="fixed right-6 top-6 z-100 rounded-full bg-red-600 hover:bg-red-700 p-2 transition-colors shadow-2xl"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>

        <div className="absolute inset-0 w-full h-full">
          <Image
            src={image.url}
            alt={image.filename}
            fill
            className="object-contain"
            sizes="100vw"
            priority
            unoptimized
          />
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100">
          <Button
            onClick={() => handleDownloadImage(image.url, image.filename)}
            className="flex items-center gap-3 bg-white hover:bg-gray-100 text-black border-0 shadow-2xl px-10 py-4 text-lg font-semibold rounded-full"
          >
            <Download className="w-6 h-6" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
