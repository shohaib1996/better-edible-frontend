"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function CallToActionSection() {
  return (
    <section className="relative w-full bg-linear-to-b from-[#f9faf9] to-[#e8f6ef] dark:from-[#0c0c0c] dark:to-[#121212] text-foreground py-28 px-6 sm:px-12 md:px-20 overflow-hidden">
      {/* Background accent linear */}
      <div className="absolute inset-0 bg-linear-to-r dark:from-[#4EAF6A]/5 dark:via-[#76C893]/10 dark:to-[#4EAF6A]/5 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#4EAF6A] to-[#76C893]"
        >
          Find Better Edibles Near You
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-2xl mx-auto text-muted-foreground font-body text-lg leading-relaxed"
        >
          Discover our premium cannabis edibles in select dispensaries across Oregon — 
          or join our trusted retail network and bring Better Edibles to your customers.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Button
            size="lg"
            className="font-body bg-linear-to-r from-[#4EAF6A] to-[#76C893] text-white hover:opacity-90 hover:shadow-lg transition-all duration-300"
          >
            Find Dispensaries
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="font-body border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300"
          >
            Join Our Retail Network
          </Button>
        </motion.div>

        {/* Email Capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-md mx-auto mt-10 flex flex-col sm:flex-row items-center gap-3"
        >
          <Input
            type="email"
            placeholder="Enter your email to get updates"
            className="flex-1 border-border bg-background text-foreground font-body h-12"
          />
          <Button
            size="lg"
            className="bg-linear-to-r from-[#4EAF6A] to-[#76C893] text-white hover:opacity-90 hover:shadow-lg transition-all duration-300"
          >
            <Send className="h-4 w-4 mr-2" /> Subscribe
          </Button>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto mt-16 w-40 h-0.5 bg-linear-to-r from-[#4EAF6A] to-[#76C893] rounded-full"
        />
      </div>

      {/* Floating background orbs for visual depth */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2 }}
        viewport={{ once: true }}
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-linear-to-b from-[#4EAF6A]/10 to-transparent blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        viewport={{ once: true }}
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-linear-to-t from-[#76C893]/10 to-transparent blur-3xl"
      />
    </section>
  );
}
