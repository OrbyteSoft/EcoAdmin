import { useState, useEffect } from "react";
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
import { Eye, RefreshCcw } from "lucide-react";
import { useOrders } from "@/contexts/OrderContext";
import { Order } from "@/types";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function Orders() {
  const { orders, isLoading, fetchAllOrders, updateOrderStatus } = useOrders();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Orders</h1>
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
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
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
              {filtered.map((o) => (
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
                      onClick={() => setSelectedOrder(o)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                  {selectedOrder.notes && (
                    <p className="text-xs mt-1 text-amber-600 italic">
                      Note: {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>

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
