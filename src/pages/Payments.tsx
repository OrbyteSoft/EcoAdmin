"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePayments,
  PaymentStatus,
  PaymentMethod,
} from "@/contexts/PaymentContext";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Smartphone,
  Globe,
  Banknote,
  CheckCircle,
  Search,
  User,
  Hash,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const methodIcons: Record<string, any> = {
  ESEWA: Smartphone,
  KHALTI: Smartphone,
  STRIPE: Globe,
  COD: Banknote,
};

const STATUSES: PaymentStatus[] = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];
const METHODS: PaymentMethod[] = ["ESEWA", "KHALTI", "STRIPE", "COD"];
const ITEMS_PER_PAGE = 10;

export default function Payments() {
  const { payments, isLoading, updatePaymentStatus } = usePayments();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesMethod = methodFilter === "all" || p.method === methodFilter;

      const searchTerm = search.toLowerCase().trim();
      const matchesSearch =
        searchTerm === "" ||
        p.id.toLowerCase().includes(searchTerm) ||
        (p.order?.orderNumber &&
          p.order.orderNumber.toLowerCase().includes(searchTerm)) ||
        (p.user?.email && p.user.email.toLowerCase().includes(searchTerm)) ||
        (p.user?.name && p.user.name.toLowerCase().includes(searchTerm)) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm)); // Searchable references!

      return matchesStatus && matchesMethod && matchesSearch;
    });
  }, [payments, statusFilter, methodFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = useMemo(() => {
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, startIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, methodFilter, search]);

  const handleVerify = async (id: string) => {
    await updatePaymentStatus(id, `MANUAL_ADMIN_${Date.now()}`, "SUCCESS");
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b p-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Payment Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and verify customer payments and COD orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Order #, Name, Email or Ref..."
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue placeholder="Status" />
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

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Order Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((p) => {
                const MethodIcon = methodIcons[p.method] || CreditCard;
                return (
                  <TableRow
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted w-fit px-1.5 py-0.5 rounded">
                        <Hash className="h-3 w-3" />
                        {p.id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-primary">
                          #{p.order?.orderNumber || "N/A"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateTime(p.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col overflow-hidden max-w-[180px]">
                          <span className="text-sm font-medium truncate">
                            {p.user?.name || "Guest"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {p.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MethodIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize text-xs">
                          {p.method.toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                          text-[10px] font-bold
                          ${p.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                          ${p.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                          ${p.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200" : ""}
                          ${p.status === "REFUNDED" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                        `}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {formatNPR(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setSelectedPayment(p)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {p.status === "PENDING" && p.method !== "COD" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleVerify(p.id)}
                          >
                            <CheckCircle className="mr-1.5 h-4 w-4" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-10 w-10 mb-2 opacity-20" />
                      <p className="font-medium">
                        No results found
                        {search ? ` for "${search}"` : ""}
                      </p>
                      <p className="text-xs">
                        Try checking for typos or changing filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold">
            {filtered.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}
          </span>{" "}
          of <span className="font-semibold">{filtered.length}</span> payments
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
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Payment Details</DialogTitle>
            <DialogDescription>
              Payment ID: {selectedPayment?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Payment Amount
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatNPR(selectedPayment.amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={`
                      text-sm font-bold w-fit
                      ${selectedPayment.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                      ${selectedPayment.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                      ${selectedPayment.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200" : ""}
                      ${selectedPayment.status === "REFUNDED" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                    `}
                  >
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Payment Method
                  </p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon =
                        methodIcons[selectedPayment.method] || CreditCard;
                      return <Icon className="h-5 w-5 text-muted-foreground" />;
                    })()}
                    <span className="font-medium capitalize">
                      {selectedPayment.method.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* --- 🔥 Updated Transaction ID Reference Display --- */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Payment Transaction ID Reference
                </p>
                <p className="font-mono text-sm bg-muted p-3 rounded font-bold break-all tracking-wider text-primary">
                  {selectedPayment.reference || "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Customer Information
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {selectedPayment.user?.name || "Guest"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedPayment.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {selectedPayment.user?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedPayment.order && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Associated Order
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-200"
                      onClick={() => {
                        navigate("/orders", {
                          state: {
                            focusOrder: selectedPayment.order.orderNumber,
                          },
                        });
                        setSelectedPayment(null);
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-1.5" />
                      View Order
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      #{selectedPayment.order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "View Order" to see complete order details and notes
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Payment Date
                  </p>
                  <p className="font-medium">
                    {formatDateTime(selectedPayment.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Updated
                  </p>
                  <p className="font-medium">
                    {formatDateTime(selectedPayment.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
