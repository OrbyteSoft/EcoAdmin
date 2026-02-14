import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNPR, formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Smartphone, Globe, Banknote, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const methodIcons: Record<string, any> = { eSewa: Smartphone, Khalti: Smartphone, Stripe: Globe, COD: Banknote };
const STATUSES = ["Pending", "Success", "Failed", "Refunded"];
const METHODS = ["eSewa", "Khalti", "Stripe", "COD"];

export default function Payments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const { data, isLoading } = useQuery({ queryKey: ["payments"], queryFn: () => api<any>("/payments") });
  const payments = (Array.isArray(data) ? data : data?.data || []) as any[];

  let filtered = payments;
  if (statusFilter !== "all") filtered = filtered.filter(p => p.status === statusFilter);
  if (methodFilter !== "all") filtered = filtered.filter(p => p.method === methodFilter);

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api(`/payments/${id}/verify`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment verified"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-4"><h1 className="text-2xl font-bold">Payments</h1>{[1,2,3].map(i=><Skeleton key={i} className="h-16"/>)}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Payments</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const MethodIcon = methodIcons[p.method] || CreditCard;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id?.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MethodIcon className="h-4 w-4 text-muted-foreground" />
                        {p.method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-${p.status?.toLowerCase()} rounded px-2 py-0.5 text-xs font-medium`}>{p.status}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatNPR(p.amount || 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {p.status === "Pending" && (
                        <Button variant="ghost" size="sm" onClick={() => verifyMutation.mutate(p.id)} disabled={verifyMutation.isPending}>
                          <CheckCircle className="mr-1 h-4 w-4" /> Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
