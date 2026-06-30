"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ALL_BACKGROUNDS } from "@/components/StorePortal/backgrounds";
import { AgeGate } from "@/components/StorePortal/AgeGate";
import { Slide, shuffle, buildSlides, LAYOUTS, INITIAL_COUNT, LOAD_MORE } from "@/components/StorePortal/Slide";

export default function StorePortalHome() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [slides, setSlides] = useState<ReturnType<typeof buildSlides>>([]);
  const shuffledBgs = useMemo(() => shuffle(ALL_BACKGROUNDS), []);
  const shuffledLayouts = useMemo(() => shuffle(LAYOUTS), []);
  const nextOffset = useRef(INITIAL_COUNT);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("age_verified") === "true") setVerified(true);
    setSlides(buildSlides(INITIAL_COUNT, 0, shuffledBgs, shuffledLayouts));
  }, [shuffledBgs, shuffledLayouts]);

  const onVerified = useCallback(() => {
    sessionStorage.setItem("age_verified", "true");
    setVerified(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
        loadingRef.current = true;
        const offset = nextOffset.current;
        const more = buildSlides(LOAD_MORE, offset, shuffledBgs, shuffledLayouts);
        nextOffset.current = offset + LOAD_MORE;
        setSlides((prev) => [...prev, ...more]);
        setTimeout(() => { loadingRef.current = false; }, 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shuffledBgs, shuffledLayouts]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes calcPulse {
          0%, 100% { box-shadow: 0 2px 16px rgba(26,122,60,0.6); }
          50% { box-shadow: 0 2px 28px rgba(26,122,60,0.9), 0 0 0 4px rgba(26,122,60,0.2); }
        }
      `}</style>

      {!verified && <AgeGate onVerified={onVerified} />}

      {verified && slides.length > 0 && (
        <div className="scrollbar-hidden" style={{ scrollSnapType: "y mandatory", overflowY: "scroll", height: "100vh", width: "100%" }}>
          {slides.map((s, i) => (
            <Slide
              key={s.key}
              bg={s.bg}
              layout={s.layout}
              isFirst={i === 0}
              onRetailer={() => router.push("/store2/login")}
              onCalculator={() => router.push("/store-portal/calculator")}
            />
          ))}
        </div>
      )}
    </>
  );
}
