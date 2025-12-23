"use client";

import { useEffect } from "react";

export function SidebarPositionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const updateSidebarPosition = () => {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        const container = document.getElementById('layout-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const leftPosition = Math.max(0, rect.left);
          document.documentElement.style.setProperty(
            "--sidebar-left",
            `${leftPosition}px`
          );
          console.log('Sidebar left position:', leftPosition);
        }
      });
    };

    // Initial update with delay to ensure layout is complete
    const timer = setTimeout(updateSidebarPosition, 100);

    // Update on resize
    window.addEventListener("resize", updateSidebarPosition);

    // Also use ResizeObserver for more reliable updates
    const container = document.getElementById('layout-container');
    let observer: ResizeObserver | null = null;

    if (container) {
      observer = new ResizeObserver(updateSidebarPosition);
      observer.observe(container);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSidebarPosition);
      if (observer) observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
