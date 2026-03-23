import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead, deleteNotification, clearAll } =
    useNotifications();
  const [filterType, setFilterType] = useState<"all" | "order" | "payment">(
    "all"
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.type === "order") {
      navigate(`/orders?id=${notification.relatedId}`);
    } else if (notification.type === "payment") {
      navigate(`/payments?id=${notification.relatedId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: "order" | "payment") => {
    if (type === "order") {
      return <Package className="h-4 w-4 text-blue-500" />;
    } else {
      return <CreditCard className="h-4 w-4 text-green-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-sm text-muted-foreground">
              You'll receive notifications when new orders or payments arrive
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notifications.length} total
            {notifications.some((n) => !n.read) &&
              ` • ${notifications.filter((n) => !n.read).length} unread`}
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={filterType}
            onValueChange={(v: any) => {
              setFilterType(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
            </SelectContent>
          </Select>

          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearAll()}
              className="text-destructive hover:text-destructive"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNotifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className={`cursor-pointer ${
                    !notification.read ? "bg-muted/40" : ""
                  } hover:bg-muted/50 transition-colors`}
                >
                  <TableCell>
                    {getNotificationIcon(notification.type)}
                  </TableCell>
                  <TableCell
                    className="font-medium"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.title}
                  </TableCell>
                  <TableCell
                    className="text-muted-foreground text-sm max-w-xs truncate"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.message}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={notification.read ? "outline" : "default"}
                      className="text-xs"
                    >
                      {notification.read ? "Read" : "Unread"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeleteId(notification.id)}
                      title="Delete notification"
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

      {/* PAGINATION */}
      {filteredNotifications.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startIdx + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(startIdx + itemsPerPage, filteredNotifications.length)}
            </span>{" "}
            of <span className="font-medium">{filteredNotifications.length}</span>{" "}
            notifications
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This notification will be permanently removed from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteNotification(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
