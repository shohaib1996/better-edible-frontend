"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

const products = [
  {
    name: "CannaCrispy",
    tagline: "Your Favorite Snack, Elevated",
    description:
      "A delightful twist on a classic rice crispy treat — blending nostalgic flavor with clean, pure cannabis distillate.",
    highlights: [
      "Available in Original, Fruity, Chocolate, Cookies & Cream, Peanut Butter, and Strawberry",
      "Choose from Hybrid, Sativa (Super Sour Diesel), or Indica (Watermelon Zkittles)",
      "Crafted in Oregon with real ingredients and lab-tested purity",
    ],
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu6x5wiwCRL1y3_lq13aPcgacXQ29-lwvQ2Q&s",
    gradient: "from-[#4EAF6A] to-[#76C893]",
  },
  {
    name: "Fifty-One Fifty",
    tagline: "The Crispy Gummy That Packs a Punch",
    description:
      "A one-of-a-kind cannabis gummy with a crunchy shell and chewy center — scored into 10 servings for precision dosing.",
    highlights: [
      "Unique 'crispy gummy' texture — fruit roll-up exterior with sugar-dusted finish",
      "Assorted flavors including Grape, Strawberry, Banana Cream, and Watermelon",
      "Infused with high-quality distillate for consistent potency",
    ],
    image: "https://i.ytimg.com/vi/ec2jUM5susI/maxresdefault.jpg",
    gradient: "from-[#D9CBA3] to-[#A89F91]",
  },
  {
    name: "Holy Water",
    tagline: "Pure, Potent, Perfectly Balanced",
    description:
      "Our flagship nano-emulsified cannabis elixir — precise, portable, and designed for a fast, pure experience.",
    highlights: [
      "Available in 4 blends: Pure THC Bliss, Balanced Wellness, Energize & Uplift, Relax & Unwind",
      "Sugar-free, ultra-precise, and highly bioavailable",
      "Perfect for mixing with beverages or microdosing on the go",
    ],
    image:
      "https://www.pieceofholyland.com/cdn/shop/files/jordan-river-holy-water-250ml.jpg?v=1727345541",
    gradient: "from-[#76C893] to-[#4EAF6A]",
  },
];

const flavorNotes = [
  {
    title: "Citrus Zest",
    desc: "Bright and energizing notes awaken your senses.",
  },
  {
    title: "Earthy Calm",
    desc: "Grounding herbal undertones that soothe and balance.",
  },
  {
    title: "Sweet Balance",
    desc: "A harmony of natural sweetness and cannabinoid science.",
  },
  {
    title: "Cool Afterglow",
    desc: "A refreshing aftertaste that lingers in perfect calm.",
  },
];

export default function ProductCollection() {
  return (
    <section className="relative w-full bg-background text-foreground py-28 px-6 sm:px-12 md:px-20 overflow-hidden">
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
          Discover Our Creations
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed"
        >
          Three signature experiences — crafted for taste, purity, and balance.
        </motion.p>
      </div>

      {/* Product Panels */}
      <div className="grid md:grid-cols-3 gap-10 container mx-auto">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="relative flex flex-col p-6 rounded-2xl border border-border bg-card shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-xl"
            >
              <Image
                src={product.image}
                alt={product.name}
                width={600}
                height={400}
                className="rounded-xl w-full h-[260px] object-cover"
              />
              <div
                className={`absolute inset-0 bg-linear-to-t ${product.gradient} opacity-30 group-hover:opacity-40 transition-opacity duration-500`}
              />
            </motion.div>

            <div className="mt-6 space-y-3">
              <h3 className="font-heading text-2xl font-semibold">
                {product.name}
              </h3>
              <p className="text-accent font-medium">{product.tagline}</p>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {product.description}
              </p>
            </div>

            <ul className="mt-5 space-y-2 text-sm font-body text-muted-foreground">
              {product.highlights.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-accent">•</span> {point}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button className="font-body text-sm bg-linear-to-r from-[#4EAF6A] to-[#76C893] text-white hover:shadow-lg">
                Learn More <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <BorderBeam size={400} />
            {/* <BorderBeam size={200} /> */}
          </motion.div>
        ))}
      </div>

      {/* Flavor Journey */}
      <div className="mt-28 max-w-5xl mx-auto text-center">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="font-heading text-3xl sm:text-4xl font-semibold bg-clip-text text-transparent bg-linear-to-r from-[#4EAF6A] to-[#76C893]"
        >
          The Flavor Journey
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-4 text-muted-foreground font-body text-lg leading-relaxed"
        >
          Every edible is a flavor adventure — from crisp citrus to earthy calm,
          balanced to perfection.
        </motion.p>

        <div className="relative w-full max-w-6xl mx-auto mt-10">
          <motion.div className="cursor-grab active:cursor-grabbing overflow-hidden py-2">
            <motion.div
              drag="x"
              dragConstraints={{ left: -1000, right: 0 }}
              className="flex gap-6 px-2"
            >
              {flavorNotes.map((note, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="min-w-[260px] shrink-0 bg-card border border-border rounded-2xl shadow-sm p-6 text-center"
                >
                  <h4 className="font-heading text-xl text-foreground">
                    {note.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground font-body">
                    {note.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
