"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Detect scroll for background switch
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Products", href: "#products" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center px-2 justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Better Edibles Logo"
            width={100}
            height={50}
            className="object-contain dark:invert"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative font-body text-sm transition-colors duration-300 ${
                scrolled
                  ? "text-foreground hover:text-accent"
                  : "text-white dark:text-gray-200 hover:text-accent"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <AnimatedThemeToggler className="cursor-pointer text-accent" />
          <Button
            size="lg"
            className="relative overflow-hidden bg-linear-to-r from-[#4EAF6A] to-[#76C893] text-white font-body hover:opacity-90 shadow-md"
          >
            <span className="relative z-10 flex items-center gap-2">
              Retailer Access
            </span>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
  
        <Button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden hover:text-accent transition-colors bg-accent text-white"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background/10 dark:bg-background/90 backdrop-blur-lg border-t border-border"
          >
            <div className="flex flex-col items-center gap-4 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`font-body text-base transition-colors ${
                    scrolled
                      ? "text-foreground hover:text-accent"
                      : "text-white dark:text-gray-200 hover:text-accent"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Button
                size="sm"
                className="bg-linear-to-r from-[#4EAF6A] to-[#76C893] text-white font-body hover:opacity-90"
              >
                Retailer Access
              </Button>
              <AnimatedThemeToggler className="cursor-pointer text-accent" />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
