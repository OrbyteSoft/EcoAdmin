import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  CheckCircle2,
  Package,
  CreditCard,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bell,
  CheckCheck,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

type FilterType = "all" | "order" | "payment" | "stock";

function formatTimeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function NotifIcon({ type }: { type: "order" | "payment" | "stock" }) {
  if (type === "order") return <Package className="h-4 w-4 text-blue-500" />;
  if (type === "payment")
    return <CreditCard className="h-4 w-4 text-green-500" />;
  return <AlertTriangle className="h-4 w-4 text-amber-500" />;
}

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isConnected,
  } = useNotifications();

  // ✅ Fixed: proper generic useState with correct default value
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleRowClick = (n: (typeof notifications)[0]) => {
    markAsRead(n.id);
    if (n.type === "order") navigate(`/orders?id=${n.relatedId}`);
    else if (n.type === "payment") navigate(`/payments?id=${n.relatedId}`);
    else navigate(`/products?id=${n.relatedId}`);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {notifications.length} total
            {unreadCount > 0 && (
              <span className="ml-1 text-primary font-medium">
                · {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        <div className="bg-muted/50 px-4 py-2 rounded-lg border flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{unreadCount} Unread</span>
          <span
            className={`ml-1 h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filterType}
          onValueChange={(v: FilterType) => {
            setFilterType(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="stock">Low Stock</SelectItem>
          </SelectContent>
        </Select>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}

        {notifications.length > 0 && (
          <Button
            variant="outline"
            onClick={clearAll}
            className="text-destructive hover:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Table */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/25 mb-4" />
            <p className="font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-sm text-muted-foreground">
              New orders, payments, and stock alerts will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-10">Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((n) => (
                  <TableRow
                    key={n.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-muted/40" : ""
                    }`}
                  >
                    <TableCell>
                      <NotifIcon type={n.type} />
                    </TableCell>
                    <TableCell
                      className="font-medium"
                      onClick={() => handleRowClick(n)}
                    >
                      {n.title}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm max-w-xs truncate"
                      onClick={() => handleRowClick(n)}
                    >
                      {n.message}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(n.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={n.read ? "outline" : "default"}
                        className="text-xs"
                      >
                        {n.read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(n.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold">
              {startIdx + 1}–
              {Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            of <span className="font-semibold">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 2),
                Math.min(totalPages, currentPage + 1),
              )
              .map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={currentPage === p ? "default" : "outline"}
                  className="h-8 min-w-8"
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              ))}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteNotification(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
