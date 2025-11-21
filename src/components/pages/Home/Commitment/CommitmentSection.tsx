"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { motion } from "framer-motion";
import { FlaskConical, Leaf, Droplet, WheatOff, Recycle } from "lucide-react";

const commitments = [
  {
    icon: FlaskConical,
    title: "Lab Tested",
    desc: "Every batch undergoes rigorous third-party testing for purity and potency.",
  },
  {
    icon: WheatOff,
    title: "Gluten-Free",
    desc: "Formulated without gluten — made for everyone to enjoy safely.",
  },
  {
    icon: Droplet,
    title: "Sugar-Free Options",
    desc: "For a guilt-free experience, our Holy Water line is 100% sugar-free.",
  },
  {
    icon: Leaf,
    title: "Organic Ingredients",
    desc: "Sourced from trusted farms using sustainable, organic growing practices.",
  },
  {
    icon: Recycle,
    title: "Sustainable Practices",
    desc: "From packaging to sourcing, we strive for minimal environmental impact.",
  },
];

export default function CommitmentSection() {
  return (
    <section className="relative w-full bg-background text-foreground py-28 px-6 sm:px-12 md:px-20 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-linear-to-r dark:from-[#4EAF6A]/5 dark:via-[#76C893]/10 dark:to-[#4EAF6A]/5 pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#4EAF6A] to-[#76C893]"
        >
          Commitment to Quality
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed"
        >
          We craft every product with precision, purity, and care — ensuring
          Better Edibles consistently meets the highest standards of wellness
          and trust.
        </motion.p>
      </div>

      {/* Icons Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 container mx-auto text-center">
        {commitments.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3 },
            }}
            // ✅ Make this parent relative
            className="relative flex flex-col items-center p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            {/* 🌿 Border Beam — goes first inside relative parent */}
            <BorderBeam size={150} />

            {/* 🌿 Actual content */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-[#4EAF6A]/10 to-[#76C893]/10 mb-5">
                <item.icon className="h-8 w-8 text-accent" />
              </div>
              <h4 className="font-heading text-lg font-semibold text-foreground">
                {item.title}
              </h4>
              <p className="mt-3 text-sm text-muted-foreground font-body leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
