"use client";

import { useState } from "react";
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
  CreditCard,
  Smartphone,
  Globe,
  Banknote,
  CheckCircle,
  Search,
  User,
  Hash,
} from "lucide-react";

const methodIcons: Record<string, any> = {
  ESEWA: Smartphone,
  KHALTI: Smartphone,
  STRIPE: Globe,
  COD: Banknote,
};

const STATUSES: PaymentStatus[] = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];
const METHODS: PaymentMethod[] = ["ESEWA", "KHALTI", "STRIPE", "COD"];

export default function Payments() {
  const { payments, isLoading, updatePaymentStatus } = usePayments();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = payments.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesMethod = methodFilter === "all" || p.method === methodFilter;

    // Comprehensive Search Logic
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm) || // Search by Payment UUID
      p.order?.orderNumber.toLowerCase().includes(searchTerm) || // Search by Order Number
      p.user?.email.toLowerCase().includes(searchTerm) || // Search by Email
      p.user?.name?.toLowerCase().includes(searchTerm); // Search by Name

    return matchesStatus && matchesMethod && matchesSearch;
  });

  const handleVerify = async (id: string) => {
    await updatePaymentStatus(id, `MANUAL_ADMIN_${Date.now()}`, "SUCCESS");
  };

  if (isLoading) {
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
              placeholder="Search by ID, Order #, Name or Email..."
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
              {filtered.map((p) => {
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
                      {p.status === "PENDING" && (
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
                        No results found for "{search}"
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
    </div>
  );
}
