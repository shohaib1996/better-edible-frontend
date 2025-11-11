"use client";

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Briefcase,
  Grid,
  User,
  ClipboardList,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { useUser } from "@/src/redux/hooks/useAuth";

const adminItems = [
  { title: "Reps List", url: "/admin/reps", icon: Home },
  { title: "Stores", url: "/admin/stores", icon: Inbox },
  { title: "Products", url: "/admin/products", icon: Calendar },
  { title: "Orders", url: "/admin/orders", icon: Search },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const repItems = [
  { title: "Today's Contact", url: "/rep/today-contact", icon: ClipboardList },
  { title: "Follow Ups", url: "/rep/follow-ups", icon: Calendar },
  { title: "Orders", url: "/rep/orders", icon: Search },
  { title: "Delivery", url: "/rep/delivery", icon: Truck },
  { title: "Stores", url: "/rep/stores", icon: Briefcase },
  { title: "Sample Lists", url: "/rep/sample-lists", icon: Grid },
  { title: "Profile", url: "/rep/profile", icon: User },
];

export function AppSidebar() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // ✅ redirect only when user is explicitly null (not undefined)
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  // ⏳ While loading user (undefined), render nothing or skeleton
  if (user === undefined) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  // ❌ If definitely no user, redirect already triggered above
  if (user === null) return null;

  const menuItems = user.role === "superadmin" ? adminItems : repItems;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={70}
            height={80}
            className="rounded-sm"
          />
          <p className="text-xl font-semibold tracking-tight">
            <span className="text-emerald-500">Better</span>{" "}
            <span>Edibles</span>
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm uppercase tracking-wide">
            {user.role === "superadmin" ? "Admin Panel" : "Rep Dashboard"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <item.icon className="w-5 h-5 opacity-80" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
