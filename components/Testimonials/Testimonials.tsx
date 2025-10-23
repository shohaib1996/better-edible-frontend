"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Maya R.",
    role: "Customer — Portland, OR",
    rating: 5,
    text: "CannaCrispy made my Friday so chill — perfect balance and the Strawberry flavor actually tastes like real fruit.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Jordan K.",
    role: "Retail Partner — Eugene, OR",
    rating: 5,
    text: "Customers love Fifty-One Fifty — the texture is unique and the flavor variety keeps them coming back.",
    avatar:
      "https://images.unsplash.com/photo-1545996124-5f93b6b28b8e?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Sofia L.",
    role: "Frequent User — Seattle, WA",
    rating: 4,
    text: "Holy Water is a game-changer for microdosing. Predictable and clean — no sugar crash or heavy taste.",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Ethan P.",
    role: "Cannabis Enthusiast — Bend, OR",
    rating: 5,
    text: "Fifty-One Fifty’s mystery flavor is always a fun surprise. The quality and consistency are top-notch.",
    avatar:
      "https://images.unsplash.com/photo-1502767089025-6572583495b0?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Luna S.",
    role: "Retail Buyer — Portland, OR",
    rating: 5,
    text: "Holy Water flies off shelves — customers appreciate the purity and precise dosing.",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Devon W.",
    role: "Customer — San Diego, CA",
    rating: 4,
    text: "CannaCrispy gives that nostalgic treat vibe but elevated — love the Fruity Pebbles one.",
    avatar:
      "https://images.unsplash.com/photo-1603415526960-f7e0328a3f59?q=80&w=400&auto=format&fit=crop",
  },
];

export default function Testimonials() {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.2 });

  // Auto-scroll animation using Framer Motion controls
  useEffect(() => {
    if (isInView) {
      controls.start({
        x: ["0%", "-50%"],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40, // adjust for speed
            ease: "linear",
          },
        },
      });
    }
  }, [isInView, controls]);

  const renderCard = (t: any, i: number) => (
    <motion.div
      key={i}
      whileHover={{ scale: 1.03, y: -4 }}
      className="flex flex-col gap-3 p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 min-w-[280px] sm:min-w-[320px] lg:min-w-[360px]"
    >
      <div className="flex items-center gap-3">
        <Image
          src={t.avatar}
          alt={t.name}
          width={56}
          height={56}
          className="rounded-full object-cover shadow-sm"
        />
        <div>
          <h4 className="font-heading font-semibold text-lg">{t.name}</h4>
          <p className="text-sm text-muted-foreground">{t.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`h-4 w-4 ${
              idx < t.rating ? "text-accent" : "text-muted-foreground"
            }`}
            fill={idx < t.rating ? "currentColor" : "none"}
          />
        ))}
      </div>

      <p className="text-muted-foreground font-body text-sm leading-relaxed mt-1">
        “{t.text}”
      </p>
    </motion.div>
  );

  return (
    <section
      ref={ref}
      className="relative bg-background text-foreground py-28 px-6 sm:px-12 md:px-20 overflow-hidden"
    >
      {/* Background Gradient */}
     <div className="absolute inset-0 bg-linear-to-r dark:from-[#4EAF6A]/5 dark:via-[#76C893]/10 dark:to-[#4EAF6A]/5 pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#4EAF6A] to-[#76C893]"
        >
          What People Are Saying
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed"
        >
          Honest reactions from our community — authentic, diverse, and true to the Better Edibles experience.
        </motion.p>
      </div>

      {/* Infinite Auto Slider */}
      <div className="relative overflow-hidden">
        <motion.div
          animate={controls}
          className="flex gap-6" // doubled width for seamless looping
        >
          {/* Repeat cards twice for continuous loop illusion */}
          {testimonials.concat(testimonials).map((t, i) => renderCard(t, i))}
        </motion.div>

        {/* Fading edges for luxury look */}
        <div className="absolute left-0 top-0 h-full w-16 bg-linear-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-16 bg-linear-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
