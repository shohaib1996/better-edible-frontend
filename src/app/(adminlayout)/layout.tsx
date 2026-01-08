import { cookies } from "next/headers";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex max-w-7xl mx-auto w-full min-h-screen" id="layout-container">
        <AppSidebar />
        <SidebarInset className="w-full">
          <SidebarTrigger className="m-2" />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
