import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { cookies } from "next/headers";

import { ImpersonationBanner } from "@/components/ImpersonationBanner";

const RepLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex max-w-7xl mx-auto w-full" id="layout-container">
        <AppSidebar />
        <SidebarInset>
          <ImpersonationBanner />
          <SidebarTrigger className="m-2" />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default RepLayout;
