import {
  Moon,
  Sun,
  LogOut,
  Bell,
  Package,
  CreditCard,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.type === "order") {
      navigate(`/orders?id=${notification.relatedId}`);
    } else if (notification.type === "payment") {
      navigate(`/payments?id=${notification.relatedId}`);
    } else if (notification.type === "stock") {
      navigate(`/products?id=${notification.relatedId}`);
    }
  };

  const getNotificationIcon = (type: "order" | "payment" | "stock") => {
    if (type === "order") return <Package className="h-4 w-4 text-blue-500" />;
    if (type === "payment")
      return <CreditCard className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="mr-2" />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notification Bell with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                  variant="destructive"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0">
            {/* Header */}
            <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-gradient-to-r from-muted/50 to-transparent">
              <div>
                <h3 className="font-semibold text-sm">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {notifications.length} total
                  {unreadCount > 0 && ` • ${unreadCount} unread`}
                </p>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No notifications yet
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    You'll receive updates here
                  </p>
                </div>
              ) : (
                recentNotifications.map((notif, index) => (
                  <div key={notif.id}>
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 group ${
                        !notif.read && "bg-muted/30"
                      }`}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground/70">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </button>

                    {index < recentNotifications.length - 1 && (
                      <div className="border-b border-border/50" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-3 bg-muted/20">
                <button
                  onClick={() => navigate("/notifications")}
                  className="w-full px-3 py-2 text-sm font-medium text-primary hover:text-primary hover:bg-primary/5 rounded transition-colors flex items-center justify-center gap-2"
                >
                  View All Notifications
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <span className="hidden text-sm font-medium sm:inline">
            {user.name}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
