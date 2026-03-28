"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePayments,
  PaymentStatus,
  PaymentMethod,
} from "@/contexts/PaymentContext";
import { formatNPR, formatDateTime } from "@/lib/format";
import { useExcelExport } from "@/hooks/useExcelExport";
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
  Download,
  Loader2,
  Calendar,
  FileSpreadsheet,
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

// Define payment export columns configuration
const PAYMENT_EXPORT_COLUMNS = [
  { header: "Payment ID", accessor: "id" },
  {
    header: "Order Number",
    accessor: (p: any) => p.order?.orderNumber || "N/A",
  },
  {
    header: "Date",
    accessor: (p: any) => new Date(p.createdAt).toLocaleString(),
  },
  { header: "Customer", accessor: (p: any) => p.user?.name || "Guest" },
  { header: "Email", accessor: (p: any) => p.user?.email || "N/A" },
  { header: "Method", accessor: "method" },
  { header: "Status", accessor: "status" },
  { header: "Amount (NPR)", accessor: "amount" },
  { header: "Reference", accessor: (p: any) => p.reference || "" },
];

export default function Payments() {
  const { payments, isLoading, updatePaymentStatus } = usePayments();
  const navigate = useNavigate();
  const { exportData, exportGroupedByMonth, getMonths } = useExcelExport({
    defaultFileName: "Payments_Export",
    defaultSheetName: "Payments",
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  // Get unique months from payments data
  const availableMonths = useMemo(() => {
    return getMonths(payments);
  }, [payments, getMonths]);

  // --- Excel Export Handlers ---
  const handleExportCurrentView = () => {
    const exportItems = filtered.map((p) => ({
      "Payment ID": p.id,
      "Order Number": p.order?.orderNumber || "N/A",
      Date: new Date(p.createdAt).toLocaleString(),
      Customer: p.user?.name || "Guest",
      Email: p.user?.email || "N/A",
      Method: p.method,
      Status: p.status,
      "Amount (NPR)": p.amount,
      Reference: p.reference || "",
    }));

    exportData(exportItems, {
      fileName: `Payments_CurrentView_${new Date().toLocaleString("default", { month: "short", year: "numeric" })}.xlsx`,
      sheetName: "Current_View",
    });
  };

  const handleExportAll = () => {
    exportData(payments, {
      columns: PAYMENT_EXPORT_COLUMNS,
      fileName: `Payments_All_${new Date().toLocaleString("default", { month: "short", year: "numeric" })}.xlsx`,
    });
  };

  const handleExportMonth = (month: string) => {
    const monthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.createdAt);
      const monthYear = paymentDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      return monthYear === month;
    });

    exportData(monthPayments, {
      columns: PAYMENT_EXPORT_COLUMNS,
      fileName: `Payments_${month.replace(/ /g, "_")}_${new Date().toLocaleString("default", { month: "short", year: "numeric" })}.xlsx`,
      sheetName: month.substring(0, 31),
    });
  };

  const handleExportAllMonths = () => {
    exportGroupedByMonth(
      payments,
      (p) => ({
        "Payment ID": p.id,
        "Order Number": p.order?.orderNumber || "N/A",
        Date: new Date(p.createdAt).toLocaleString(),
        Customer: p.user?.name || "Guest",
        Email: p.user?.email || "N/A",
        Method: p.method,
        Status: p.status,
        "Amount (NPR)": p.amount,
        Reference: p.reference || "",
      }),
      "Payments",
    );
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesMethod = methodFilter === "all" || p.method === methodFilter;

      let matchesMonth = true;
      if (monthFilter !== "all") {
        const paymentDate = new Date(p.createdAt);
        const monthYear = paymentDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        matchesMonth = monthYear === monthFilter;
      }

      const searchTerm = search.toLowerCase().trim();
      const matchesSearch =
        searchTerm === "" ||
        p.id.toLowerCase().includes(searchTerm) ||
        (p.order?.orderNumber &&
          p.order.orderNumber.toLowerCase().includes(searchTerm)) ||
        (p.user?.email && p.user.email.toLowerCase().includes(searchTerm)) ||
        (p.user?.name && p.user.name.toLowerCase().includes(searchTerm)) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm));

      return matchesStatus && matchesMethod && matchesMonth && matchesSearch;
    });
  }, [payments, statusFilter, methodFilter, monthFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = useMemo(() => {
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, startIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, methodFilter, monthFilter, search]);

  const handleVerify = async (id: string) => {
    try {
      setIsVerifying(id);
      await updatePaymentStatus(id, `MANUAL_ADMIN_${Date.now()}`, "SUCCESS");
    } finally {
      setIsVerifying(null);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
    const successCount = filtered.filter((p) => p.status === "SUCCESS").length;
    const pendingCount = filtered.filter((p) => p.status === "PENDING").length;
    const failedCount = filtered.filter((p) => p.status === "FAILED").length;

    return {
      totalAmount,
      successCount,
      pendingCount,
      failedCount,
      totalCount: filtered.length,
    };
  }, [filtered]);

  if (isLoading && payments.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            Payment Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and verify customer payments and COD orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Enhanced Download Dropdown */}
          <div className="relative">
            <Select
              onValueChange={(value) => {
                if (value === "current-view") {
                  handleExportCurrentView();
                } else if (value === "all") {
                  handleExportAll();
                } else if (value === "all-months") {
                  handleExportAllMonths();
                } else {
                  handleExportMonth(value);
                }
              }}
            >
              <SelectTrigger className="w-auto h-10 border-primary text-primary hover:bg-primary/5">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Report
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-view">📊 Current View</SelectItem>
                <SelectItem value="all">📁 All Payments</SelectItem>
                <SelectItem value="all-months">
                  📅 All Months (Separate Files)
                </SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    📅 {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-44 h-10">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Full Width Search Bar */}
      <div className="w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Payment ID, Order Number, Customer Name, Email, or Reference..."
            className="pl-10 h-11 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary rounded-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground uppercase font-bold">
              Total Payments
            </p>
            <p className="text-2xl font-bold">{summaryStats.totalCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 rounded-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground uppercase font-bold">
              Total Amount
            </p>
            <p className="text-2xl font-bold">
              {formatNPR(summaryStats.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-300 rounded-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground uppercase font-bold">
              Successful
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {summaryStats.successCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 rounded-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground uppercase font-bold">
              Pending
            </p>
            <p className="text-2xl font-bold text-amber-600">
              {summaryStats.pendingCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>{/* Table content remains the same */}</Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] font-bold">ID</TableHead>
                <TableHead className="font-bold">Order Details</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold">Method</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Amount</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((p) => {
                const MethodIcon = methodIcons[p.method] || CreditCard;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted w-fit px-1.5 py-0.5 border">
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
                        <div className="h-8 w-8 bg-primary/10 flex items-center justify-center border border-primary/20">
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
                        <span className="capitalize text-xs font-medium">
                          {p.method.toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                          text-[10px] font-bold px-2 py-0
                          ${p.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                          ${p.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                          ${p.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200" : ""}
                          ${p.status === "REFUNDED" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                        `}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {formatNPR(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setSelectedPayment(p)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {p.status === "PENDING" && p.method !== "COD" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isVerifying === p.id}
                            className="h-8 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs"
                            onClick={() => handleVerify(p.id)}
                          >
                            {isVerifying === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1.5 h-3 w-3" />
                            )}
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
                  <TableCell
                    colSpan={7}
                    className="text-center py-20 text-muted-foreground"
                  >
                    No transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="text-xs text-muted-foreground font-medium uppercase">
          Showing{" "}
          <span className="text-primary font-bold">
            {filtered.length === 0 ? 0 : startIndex + 1}
          </span>{" "}
          to{" "}
          <span className="text-primary font-bold">
            {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}
          </span>{" "}
          of <span className="text-primary font-bold">{filtered.length}</span>{" "}
          payments
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
                  className="h-8 min-w-8 font-bold text-xs"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-t-8 border-t-primary">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tighter">
              Payment Overview
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px]">
              Payment ID: {selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6 pt-4">
              <div className="p-6 bg-primary text-primary-foreground">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                  Total Amount
                </p>
                <p className="text-4xl font-black">
                  {formatNPR(selectedPayment.amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Status
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-sm font-black px-3 py-1 ${
                      selectedPayment.status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-muted"
                    }`}
                  >
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Method
                  </p>
                  <div className="flex items-center gap-2 font-bold uppercase text-sm">
                    {(() => {
                      const Icon =
                        methodIcons[selectedPayment.method] || CreditCard;
                      return <Icon className="h-4 w-4 text-primary" />;
                    })()}
                    {selectedPayment.method}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Transaction Reference
                </p>
                <p className="font-mono text-xs bg-muted p-4 border border-dashed border-primary/30 break-all font-bold text-primary">
                  {selectedPayment.reference || "NO_REFERENCE"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border bg-slate-50/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3 border-b pb-1">
                    Customer
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold">
                      {selectedPayment.user?.name || "Guest"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {selectedPayment.user?.email}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {selectedPayment.user?.phone || "No Phone"}
                    </p>
                  </div>
                </div>
                {selectedPayment.order && (
                  <div className="p-4 border bg-blue-50/30 border-blue-100">
                    <div className="flex items-center justify-between mb-3 border-b border-blue-100 pb-1">
                      <p className="text-[10px] font-bold text-blue-700 uppercase">
                        Order Details
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px] font-bold uppercase text-blue-600"
                        onClick={() => {
                          navigate("/orders", {
                            state: {
                              focusOrder: selectedPayment.order.orderNumber,
                            },
                          });
                          setSelectedPayment(null);
                        }}
                      >
                        Details <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <p className="text-lg font-black text-primary">
                      #{selectedPayment.order.orderNumber}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t text-[10px] font-mono text-muted-foreground uppercase">
                <span>
                  Created: {formatDateTime(selectedPayment.createdAt)}
                </span>
                <span>
                  Updated: {formatDateTime(selectedPayment.updatedAt)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
