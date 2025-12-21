"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AgeVerificationModal = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleYes = () => {
    setIsOpen(false);
  };

  const handleNo = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Better Edibles"
              width={200}
              height={80}
              className="object-contain"
            />
          </div>

          <DialogTitle className="text-center text-2xl font-bold">
            You must be 21 years or older to enter this site others.
          </DialogTitle>
          <DialogDescription className="text-center text-3xl font-bold text-gray-900 py-4">
            I am 21+ years old
          </DialogDescription>
        </DialogHeader>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <Button
            onClick={handleYes}
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-6 text-lg"
          >
            Yes
          </Button>
          <Button
            onClick={handleNo}
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-6 text-lg"
          >
            No
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationModal;
