import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  CreditCard,
  Ticket,
  Star,
  Settings,
  Lightbulb,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Categories", url: "/categories", icon: FolderTree },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Users", url: "/users", icon: Users },
];

const secondaryItems = [
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Brands", url: "/brands", icon: Lightbulb },
  { title: "Coupons", url: "/coupons", icon: Ticket },
  { title: "Reviews", url: "/reviews", icon: Star },
];

const settingsItems = [{ title: "Settings", url: "/settings", icon: Settings }];

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: typeof mainItems;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                  activeClassName="bg-primary/10 text-primary font-semibold"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Package className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">EcoAdmin</span>
      </div>
      <SidebarContent>
        <NavGroup label="Main" items={mainItems} />
        <NavGroup label="Commerce" items={secondaryItems} />
        <NavGroup label="System" items={settingsItems} />
      </SidebarContent>
    </Sidebar>
  );
}
