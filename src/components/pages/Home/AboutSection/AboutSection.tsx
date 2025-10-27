"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Separator } from "@/src/components/ui/separator";
import { BorderBeam } from "@/src/components/ui/border-beam";

export default function AboutSection() {
  return (
    <section className="relative w-full bg-background text-foreground py-24 px-6 sm:px-12 md:px-20 overflow-hidden">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-linear-to-r dark:from-[#4EAF6A]/5 dark:via-[#76C893]/10 dark:to-[#4EAF6A]/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.5, margin: "0px 0px -20% 0px" }} // Delay trigger until more in view
          className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#4EAF6A] to-[#76C893]"
        >
          Where Science Meets Nature
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.5, margin: "0px 0px -20% 0px" }} // Match header
          className="mt-6 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed"
        >
          Better Edibles was born in Oregon — a state known for purity, balance,
          and craftsmanship. Our team blends cutting-edge food science with
          natural cannabis extracts to create edibles that deliver a consistent,
          elevated experience.
        </motion.p>
      </div>

      {/* Dual Image + Copy Section */}
      <div className="relative grid md:grid-cols-2 gap-16 items-center container mx-auto">
        {/* Left: Lab Science */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true, amount: 0.5, margin: "0px 0px -10% 0px" }}
          className="flex flex-col gap-5"
        >
          {/* ✅ Hover effect isolated inside this wrapper */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl shadow-lg border border-border"
          >
            <Image
              src="https://res.cloudinary.com/dsn66l0iv/image/upload/v1761225295/wmremove-transformed_li5kcb.jpg"
              alt="Cannabis science lab beaker"
              width={800}
              height={500}
              className="w-full h-[350px] md:h-[400px] lg:h-[500px] object-cover rounded-2xl transition-transform duration-500 hover:scale-110"
            />
          </motion.div>

          <h3 className="font-heading text-2xl sm:text-3xl font-semibold mt-4">
            Crafted with Precision
          </h3>
          <p className="text-muted-foreground font-body leading-relaxed">
            Each batch is nano-emulsified for optimal absorption and balanced
            flavor. Our lab specialists test for purity and consistency —
            ensuring that every edible meets the highest standards of quality
            and safety.
          </p>
        </motion.div>

        {/* Right: Nature Roots */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true, amount: 0.5, margin: "0px 0px -10% 0px" }}
          className="flex flex-col gap-5"
        >
          {/* ✅ Same hover isolation here */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl shadow-lg border border-border"
          >
            <Image
              src="https://res.cloudinary.com/dsn66l0iv/image/upload/v1761225699/wmremove-transformed_1_bgxw9q.jpg"
              alt="Oregon forest landscape"
              width={800}
              height={500}
              className="w-full h-[350px] md:h-[400px] lg:h-[500px] object-cover rounded-2xl transition-transform duration-500 hover:scale-110"
            />
          </motion.div>

          <h3 className="font-heading text-2xl sm:text-3xl font-semibold mt-4">
            Rooted in Oregon
          </h3>
          <p className="text-muted-foreground font-body leading-relaxed">
            From the misty forests to the clean waters of Oregon, nature
            inspires every flavor we craft. We believe in sustainable sourcing
            and mindful creation — because wellness starts with respect for the
            earth.
          </p>
        </motion.div>
      </div>

      {/* Subtle Separator Line */}
      <div className="relative max-w-6xl mx-auto mt-20">
        <Separator className="bg-linear-to-r from-transparent via-[#76C893]/30 to-transparent h-0.5" />
      </div>

      {/* Timeline Section */}
      <div className="mt-20 max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center">
        {[
          {
            step: "1",
            title: "Extraction",
            desc: "Premium cannabis extracts sourced responsibly for purity and potency.",
          },
          {
            step: "2",
            title: "Nano Emulsion",
            desc: "Breaking down cannabinoids into nano-particles for faster absorption.",
          },
          {
            step: "3",
            title: "Flavor Fusion",
            desc: "Blending organic ingredients into balanced, science-backed edibles.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.2 }}
            viewport={{ once: true }} // Keep as-is; it's already lower and works
            className="relative p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-[#4EAF6A] to-[#76C893] text-white font-bold shadow-md">
              {item.step}
            </div>
            <h4 className="mt-6 font-heading text-xl font-semibold">
              {item.title}
            </h4>
            <p className="mt-3 text-muted-foreground font-body text-sm leading-relaxed">
              {item.desc}
            </p>
            <BorderBeam size={150}/>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
