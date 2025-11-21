"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function HeroSection() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Background Video */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        src="https://res.cloudinary.com/dsn66l0iv/video/upload/v1761223267/Black_Abstract_Coming_Soon_Video_tqjorl.webm"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/90 dark:from-black/80 dark:via-black/50 dark:to-black/90 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 sm:px-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight font-heading"
        >
          <TypingAnimation> Elevating the Cannabis Experience</TypingAnimation>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-gray-200 font-medium leading-relaxed font-heading"
        >
          Science meets taste — redefine your edible experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.6 }}
          className="mt-10"
        >
          <ShinyButton className="bg-accent hover:bg-accent/90 font-semibold text-base px-5 py-4 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <span className="flex">
              Explore Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </span>
          </ShinyButton>
        </motion.div>
      </div>

      {/* Floating subtle particles */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <motion.div
          className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-accent blur-md opacity-40"
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 h-3 w-3 rounded-full bg-accent blur-lg opacity-30"
          animate={{
            y: [0, 15, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>
    </section>
  );
}
