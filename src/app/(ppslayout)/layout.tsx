import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const PPSLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="h-dvh w-screen overflow-hidden flex flex-col bg-background overscroll-none"
      style={{ touchAction: "pan-x pan-y" }}
    >
      {children}
    </div>
  );
};

export default PPSLayout;
