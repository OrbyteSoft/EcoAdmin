import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNPR, formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

export default function Orders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => api<any>("/orders") });
  const orders = (Array.isArray(data) ? data : data?.data || []) as any[];
  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-4"><h1 className="text-2xl font-bold">Orders</h1>{[1,2,3].map(i=><Skeleton key={i} className="h-16"/>)}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id?.slice(0, 8)}</TableCell>
                  <TableCell>{o.user?.name || o.userName || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell>
                    <Select
                      value={o.status}
                      onValueChange={status => updateStatus.mutate({ id: o.id, status })}
                    >
                      <SelectTrigger className="h-7 w-28">
                        <span className={`status-${o.status?.toLowerCase()} rounded px-2 py-0.5 text-xs font-medium`}>{o.status}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNPR(o.total || 0)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(o)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Order #{selectedOrder?.id?.slice(0, 8)}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> {selectedOrder.user?.name || "—"}</div>
                <div><span className="text-muted-foreground">Status:</span>{" "}
                  <span className={`status-${selectedOrder.status?.toLowerCase()} rounded px-2 py-0.5 text-xs font-medium`}>{selectedOrder.status}</span>
                </div>
                <div><span className="text-muted-foreground">Subtotal:</span> {formatNPR(selectedOrder.subtotal || 0)}</div>
                <div><span className="text-muted-foreground">Tax (13%):</span> {formatNPR(selectedOrder.tax || 0)}</div>
                <div><span className="text-muted-foreground">Shipping:</span> {formatNPR(selectedOrder.shippingFee || 0)}</div>
                <div className="font-bold"><span className="text-muted-foreground">Total:</span> {formatNPR(selectedOrder.total || 0)}</div>
              </div>
              {selectedOrder.items?.length > 0 && (
                <>
                  <h3 className="font-semibold">Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{item.product?.name || item.productName || "—"}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatNPR(item.price || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
