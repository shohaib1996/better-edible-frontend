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
  LogOut,
  CalendarSync,
  Gift,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

import { useUser } from "@/redux/hooks/useAuth";

// ---------------- MENU ITEMS ---------------- //

const adminItems = [
  { title: "Reps List", url: "/admin/reps", icon: Home },
  { title: "Stores", url: "/admin/stores", icon: Inbox },
  { title: "Products", url: "/admin/products", icon: Calendar },
  { title: "Orders", url: "/admin/orders", icon: Search },
  { title: "Private Label", url: "/admin/private-label-orders", icon: Tag },
  { title: "Follow Ups", url: "/admin/follow-ups", icon: CalendarSync },
  { title: "Samples List", url: "/admin/samples", icon: Gift },
  { title: "Deliveries", url: "/admin/deliveries", icon: Truck },
];

const repItems = [
  { title: "Today's Contact", url: "/rep/today-contact", icon: ClipboardList },
  { title: "Follow Ups", url: "/rep/follow-ups", icon: Calendar },
  { title: "Orders", url: "/rep/orders", icon: Search },
  { title: "Private Label", url: "/rep/private-label-orders", icon: Tag },
  { title: "Delivery", url: "/rep/delivery", icon: Truck },
  { title: "Stores", url: "/rep/stores", icon: Briefcase },
  { title: "Sample Lists", url: "/rep/sample-lists", icon: Grid },
  // { title: "Profile", url: "/rep/profile", icon: User },
];

// ---------------- SIDEBAR COMPONENT ---------------- //

export function AppSidebar() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  if (user === undefined) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  if (user === null) return null;

  const menuItems = user.role === "superadmin" ? adminItems : repItems;

  return (
    <Sidebar collapsible="icon">
      {/* ---------------- HEADER ---------------- */}
      <SidebarHeader>
        {/* Full logo - shown when expanded */}
        <div className="gap-3 px-4 py-2 w-full h-[100px] group-data-[collapsible=icon]:hidden">
          <Image
            src="https://res.cloudinary.com/dsn66l0iv/image/upload/v1766512506/Better_Edibles_logo_tqs1pm.png"
            alt="Logo"
            width={100}
            height={100}
            className="rounded-sm object-contain w-full h-full"
          />
        </div>

        {/* Compact logo - shown when collapsed */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-2">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
            BE
          </div>
        </div>
      </SidebarHeader>

      {/* ---------------- CONTENT ---------------- */}
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

      {/* ---------------- FOOTER (Profile + Logout) ---------------- */}
      <SidebarFooter className="p-2">
        <FooterUserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

// ------------------------------------------------------------------------- //
// ------------------------- FOOTER USER MENU ------------------------------ //
// ------------------------------------------------------------------------- //

function FooterUserMenu({ user }: { user: any }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start p-2 h-auto group-data-[collapsible=icon]:justify-center"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.avatar || "/placeholder.svg"}
              alt={user?.name || "User"}
            />
            <AvatarFallback>
              {user?.name ? user?.name.charAt(0)?.toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>

          {/* Expanded Mode Content - Hidden when sidebar is collapsed */}
          <div className="flex flex-col items-start flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.email}
            </span>
          </div>

          <Settings className="w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={isMobile ? "top" : "right"}
        align={isMobile ? "end" : "end"}
        className="w-56"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>

        <DropdownMenuItem className="flex flex-col items-start">
          <span className="font-medium">{user?.name}</span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/rep/profile"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Theme</span>
            </div>
            <AnimatedThemeToggler className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center transition-colors" />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            handleLogout();
          }}
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
