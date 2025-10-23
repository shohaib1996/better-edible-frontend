"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react"

export default function FooterSection() {
  const blurCircles = [
    { top: "10%", left: "5%", size: "300px", delay: 0 },
    { top: "60%", right: "10%", size: "250px", delay: 0.5 },
    { top: "30%", left: "50%", size: "200px", delay: 1 },
  ]

  return (
    <footer className="relative w-full bg-[#0c0c0c] text-[#a8d5ba] border-t border-[#1a1a1a] py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12 lg:px-20 overflow-hidden">

      <div className="container mx-auto relative z-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-12">
          {/* Left: Brand + Mission */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center lg:text-left"
          >
            <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-[#76c893] hover:text-[#4EAF6A] transition-colors duration-300">
              Better Edibles
            </h3>
            <p className="mt-2 text-sm text-[#9fb9a5] font-body">Science. Taste. Balance.</p>
            <p className="mt-3 text-xs text-[#6b6b6b] max-w-sm leading-relaxed mx-auto lg:mx-0">
              Crafted in Oregon — where nature, precision, and wellness meet.
            </p>
          </motion.div>

          {/* Center: Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
            className="flex flex-col items-center gap-4 sm:gap-6 text-sm font-body text-[#9fb9a5]"
          >
            <span className="text-xs uppercase tracking-widest text-[#6b6b6b] font-semibold">Quick Links</span>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-3">
              {["About", "Products", "Quality", "Retail Network", "Contact"].map((link, i) => (
                <motion.div key={i} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link
                    href={`#${link.toLowerCase().replace(" ", "-")}`}
                    className="hover:text-[#76c893] transition-colors duration-300 relative group"
                  >
                    {link}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#76c893] group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Socials */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <span className="text-xs uppercase tracking-widest text-[#6b6b6b] font-semibold">Follow Us</span>
            <div className="flex items-center justify-center gap-3">
              {[
                { icon: Facebook, link: "#" },
                { icon: Instagram, link: "#" },
                { icon: Linkedin, link: "#" },
                { icon: Mail, link: "mailto:info@betteredibles.com" },
              ].map(({ icon: Icon, link }, i) => (
                <motion.a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="p-2.5 rounded-full border border-[#1f1f1f] hover:border-[#76c893]/50 bg-[#1a1a1a]/50 hover:bg-[#76c893]/10 transition-all duration-300 group"
                >
                  <Icon className="h-5 w-5 text-[#9fb9a5] group-hover:text-[#76c893] transition-colors duration-300" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
          className="pt-8 sm:pt-10 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6b6b6b] font-body"
        >
          <p className="text-center sm:text-left">© {new Date().getFullYear()} Better Edibles. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            <Link href="/privacy-policy" className="hover:text-[#76c893] transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-[#76c893] transition-colors duration-300">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
