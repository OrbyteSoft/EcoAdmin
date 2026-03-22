import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { formatNPR, formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Eye,
  RefreshCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useOrders } from "@/contexts/OrderContext";
import { Order } from "@/types";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const ITEMS_PER_PAGE = 10;

// Status flow based on payment method
const getStatusFlow = (paymentMethod: string) => {
  if (paymentMethod === "COD") {
    return ["PENDING", "SHIPPED", "PAID", "DELIVERED"];
  }
  // KHALTI, ESEWA, STRIPE
  return ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
};

// Get allowed next statuses based on current status and payment method
const getAllowedNextStatuses = (
  currentStatus: string,
  paymentMethod: string,
) => {
  const flow = getStatusFlow(paymentMethod);
  const currentIndex = flow.indexOf(currentStatus);

  if (currentIndex === -1) return ["CANCELLED"];

  // Can go to next status in flow or CANCELLED anytime
  const allowed = [];
  if (currentIndex < flow.length - 1) {
    allowed.push(flow[currentIndex + 1]);
  }
  if (currentStatus !== "CANCELLED") {
    allowed.push("CANCELLED");
  }

  return allowed;
};

export default function Orders() {
  const { orders, isLoading, fetchAllOrders, updateOrderStatus } = useOrders();
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Auto-select order when navigated from Payments page
  useEffect(() => {
    if (location.state?.focusOrder && orders.length > 0) {
      const order = orders.find(
        (o) => o.orderNumber === location.state.focusOrder,
      );
      if (order) {
        setSelectedOrder(order);
        setPreviousStatus("PENDING");
      }
    }
  }, [location.state?.focusOrder, orders]);

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  // Apply search filter
  const searchFiltered = filtered.filter((o) => {
    const searchTerm = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(searchTerm) ||
      o.customer?.name?.toLowerCase().includes(searchTerm) ||
      o.customer?.email?.toLowerCase().includes(searchTerm) ||
      o.phone?.includes(searchTerm)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(searchFiltered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = searchFiltered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track customer orders.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order #, Customer name or email..."
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAllOrders}
              disabled={isLoading}
              className="rounded-full"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {o.customer?.name || "Guest"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={o.status}
                      onValueChange={(val) => updateOrderStatus(o.id, val)}
                    >
                      <SelectTrigger className="h-8 w-32 text-[10px] font-bold uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-xs font-bold"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNPR(o.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedOrder(o);
                        setPreviousStatus("PENDING");
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {searchFiltered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-20 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 mb-2 opacity-20" />
                      <p className="font-medium">
                        No results found
                        {search
                          ? ` for "${search}"`
                          : " matching your criteria"}
                      </p>
                      <p className="text-xs">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold">
            {searchFiltered.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + ITEMS_PER_PAGE, searchFiltered.length)}
          </span>{" "}
          of <span className="font-semibold">{searchFiltered.length}</span>{" "}
          orders
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 2),
                Math.min(totalPages, currentPage + 1),
              )
              .map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 min-w-8"
                >
                  {page}
                </Button>
              ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-6">
              <span>Order Details</span>
              <span className="text-xs font-mono text-muted-foreground">
                {selectedOrder?.orderNumber}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">
                    Customer Info
                  </p>
                  <p className="font-semibold">
                    {selectedOrder.customer?.name || "Guest"}
                  </p>
                  <p>{selectedOrder.customer?.email}</p>
                  <p>{selectedOrder.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">
                    Order Info
                  </p>
                  <p>
                    <span className="font-medium">Method:</span>{" "}
                    {selectedOrder.paymentMethod}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {selectedOrder.status}
                  </p>
                </div>
              </div>

              {/* Status Change Card */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-muted-foreground font-bold uppercase text-[10px]">
                    Update Order Status
                  </p>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-200 text-blue-900">
                    {selectedOrder?.paymentMethod === "COD"
                      ? "COD: PENDING → SHIPPED → PAID → DELIVERED"
                      : "KHALTI/ESEWA: PENDING → PAID → SHIPPED → DELIVERED"}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 items-center">
                    {/* Previous Status */}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-semibold mb-1">
                        Previous Status
                      </span>
                      <div className="px-3 py-2 rounded bg-white border border-blue-200 text-sm font-medium text-blue-700">
                        {previousStatus || "N/A"}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="text-blue-500 font-bold text-lg">→</div>
                    </div>

                    {/* Current Status */}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-semibold mb-1">
                        Current Status
                      </span>
                      <div className="px-3 py-2 rounded bg-blue-500 border border-blue-600 text-sm font-medium text-white">
                        {selectedOrder?.status}
                      </div>
                    </div>
                  </div>

                  {/* Status Change Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold">
                      Change To
                    </label>
                    <Select
                      value={selectedOrder?.status || ""}
                      onValueChange={async (newStatus) => {
                        if (
                          selectedOrder &&
                          newStatus !== selectedOrder.status
                        ) {
                          setPreviousStatus(selectedOrder.status);
                          await updateOrderStatus(selectedOrder.id, newStatus);
                          const updatedOrder = orders.find(
                            (o) => o.id === selectedOrder.id,
                          );
                          if (updatedOrder) {
                            setSelectedOrder(updatedOrder);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 bg-white border-blue-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedOrder &&
                          getAllowedNextStatuses(
                            selectedOrder.status,
                            selectedOrder.paymentMethod,
                          ).map((s) => (
                            <SelectItem
                              key={s}
                              value={s}
                              className="font-semibold"
                            >
                              {s}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {previousStatus &&
                    previousStatus !== selectedOrder?.status && (
                      <div className="text-xs text-blue-700 font-semibold p-2 rounded bg-blue-50 border border-blue-200">
                        ✓ Status updated from{" "}
                        <span className="font-bold">{previousStatus}</span> to{" "}
                        <span className="font-bold">
                          {selectedOrder?.status}
                        </span>
                      </div>
                    )}
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="space-y-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-amber-950 font-bold uppercase text-[10px] flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    Customer Notes
                  </p>
                  <p className="text-amber-900 text-sm italic">
                    "{selectedOrder.notes}"
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold border-b pb-1">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNPR(item.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNPR(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end gap-1 border-t pt-4">
                <div className="flex justify-between w-48 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatNPR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between w-48 text-sm">
                  <span className="text-muted-foreground">Tax (13%):</span>
                  <span>{formatNPR(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between w-48 text-sm border-b pb-1">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span>{formatNPR(selectedOrder.shippingFee)}</span>
                </div>
                <div className="flex justify-between w-48 text-lg font-bold text-primary pt-1">
                  <span>Total:</span>
                  <span>{formatNPR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
