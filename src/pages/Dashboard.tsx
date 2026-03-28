"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { usePayments } from "@/contexts/PaymentContext";
import { useOrders } from "@/contexts/OrderContext";
import { useProducts } from "@/contexts/ProductContext";
import { useUsers } from "@/contexts/UserContext";
import { formatNPR } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const CHART_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#ef4444"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  sub,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  gradient: string;
  sub?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card
      className={`${gradient} border-0 shadow-md text-white overflow-hidden relative`}
    >
      <CardContent className="flex items-center gap-4 p-6 relative z-10">
        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80 truncate">
            {title}
          </p>
          <p className="text-2xl font-bold truncate">{value}</p>
          {sub && <p className="text-xs opacity-70 mt-0.5 truncate">{sub}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.value >= 0 ? (
                <ArrowUpRight className="h-3 w-3 opacity-80" />
              ) : (
                <ArrowDownRight className="h-3 w-3 opacity-80" />
              )}
              <span className="text-xs opacity-80">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
      <div className="absolute right-[-10%] bottom-[-20%] opacity-10 pointer-events-none">
        <Icon size={120} />
      </div>
    </Card>
  );
}

// ── Mini Payment Stat ─────────────────────────────────────────────────────────
function PaymentStatPill({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: any;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
      <div className={`rounded-lg p-2 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

// ── Section Skeleton ──────────────────────────────────────────────────────────
function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatNPR(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { payments, isLoading: lp, fetchAllPayments } = usePayments();
  const { orders, isLoading: lo, fetchAllOrders } = useOrders();
  const { products, loading: lpr, fetchProducts } = useProducts();
  const { users, isLoading: lu, fetchAllUsers } = useUsers();

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAllOrders(),
      fetchAllPayments(),
      fetchAllUsers(),
      fetchProducts(),
    ]);
    setLastRefreshed(new Date());
    setRefreshing(false);
  }, [fetchAllOrders, fetchAllPayments, fetchAllUsers, fetchProducts]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = lp || lo || lpr || lu;

  // ── Analytics ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Revenue
    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((acc, o) => acc + (o.total ?? 0), 0);

    // Payment breakdown
    const successPayments = payments.filter((p) => p.status === "SUCCESS");
    const pendingPayments = payments.filter((p) => p.status === "PENDING");
    const failedPayments = payments.filter((p) => p.status === "FAILED");
    const totalCollected = successPayments.reduce(
      (acc, p) => acc + (p.amount ?? 0),
      0,
    );

    // Conversion
    const conversionRate =
      orders.length > 0
        ? Math.round(
            (orders.filter((o) => o.status !== "CANCELLED").length /
              orders.length) *
              100,
          )
        : 0;

    // Order status distribution
    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Monthly revenue + payments combined (last 6 months)
    const monthlyMap: Record<string, { revenue: number; collected: number }> =
      {};

    orders.forEach((o) => {
      const month = new Date(o.createdAt).toLocaleString("default", {
        month: "short",
      });
      if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, collected: 0 };
      monthlyMap[month].revenue += o.total ?? 0;
    });

    payments
      .filter((p) => p.status === "SUCCESS")
      .forEach((p) => {
        const month = new Date(p.createdAt).toLocaleString("default", {
          month: "short",
        });
        if (!monthlyMap[month])
          monthlyMap[month] = { revenue: 0, collected: 0 };
        monthlyMap[month].collected += p.amount ?? 0;
      });

    const combinedChart = Object.entries(monthlyMap).map(([month, values]) => ({
      month,
      ...values,
    }));

    // Payment method distribution
    const methodCounts = payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + 1;
      return acc;
    }, {});
    const paymentMethodData = Object.entries(methodCounts).map(
      ([name, value]) => ({ name, value }),
    );

    // Low stock
    const lowStock = products
      .filter((p) => p.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    // Recent orders
    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);

    // Top products by mention in payments (proxy: most recent active products)
    const topProducts = [...products]
      .filter((p) => p.isActive)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    return {
      totalRevenue,
      totalCollected,
      conversionRate,
      successPayments: successPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      statusData: Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      })),
      combinedChart,
      paymentMethodData,
      lowStock,
      recentOrders,
      topProducts,
    };
  }, [orders, products, payments]);

  // ── Full-page skeleton only on very first load ────────────────────────────
  if (isLoading && orders.length === 0 && payments.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <Skeleton className="lg:col-span-4 h-[350px] rounded-xl" />
          <Skeleton className="lg:col-span-3 h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Last updated:{" "}
            <span className="font-medium">
              {lastRefreshed.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            Live Updates
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Primary Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatNPR(stats.totalRevenue)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          sub={`${formatNPR(stats.totalCollected)} collected`}
        />
        <StatCard
          title="Total Orders"
          value={orders.length.toString()}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          sub={`${stats.conversionRate}% conversion rate`}
        />
        <StatCard
          title="Total Products"
          value={products.length.toString()}
          icon={Package}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          sub={`${stats.lowStock.length} low stock alerts`}
        />
        <StatCard
          title="Active Users"
          value={users.length.toString()}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      {/* ── Payment Summary Pills ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <PaymentStatPill
          label="Successful Payments"
          value={`${stats.successPayments} — ${formatNPR(stats.totalCollected)}`}
          color="bg-emerald-500"
          icon={CheckCircle2}
        />
        <PaymentStatPill
          label="Pending Payments"
          value={stats.pendingPayments}
          color="bg-amber-500"
          icon={Clock}
        />
        <PaymentStatPill
          label="Failed Payments"
          value={stats.failedPayments}
          color="bg-red-500"
          icon={XCircle}
        />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue vs Collected */}
        <Card className="lg:col-span-4 border-none shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Revenue vs Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SectionSkeleton rows={5} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.combinedChart}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCollected"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `रु${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Legend iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorCollected)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status Donut */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Order Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SectionSkeleton rows={4} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Method Breakdown */}
        <Card className="border-none shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SectionSkeleton rows={3} />
            ) : stats.paymentMethodData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No payment data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={stats.paymentMethodData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Transactions"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  >
                    {stats.paymentMethodData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Inventory Alerts
            </CardTitle>
            {stats.lowStock.length > 0 && (
              <Badge variant="destructive">
                {stats.lowStock.length} Critical
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SectionSkeleton rows={4} />
            ) : (
              <Table>
                <TableBody>
                  {stats.lowStock.length > 0 ? (
                    stats.lowStock.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`text-sm font-medium ${
                                p.stock === 0
                                  ? "text-red-600"
                                  : p.stock < 5
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {p.stock === 0
                                ? "Out of stock"
                                : `${p.stock} left`}
                            </span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.stock === 0
                                    ? "bg-red-600"
                                    : p.stock < 5
                                      ? "bg-amber-500"
                                      : "bg-yellow-400"
                                }`}
                                style={{
                                  width: `${Math.min(p.stock * 10, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground py-8">
                        ✅ All products have sufficient stock.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SectionSkeleton rows={5} />
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          #{o.orderNumber || o.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {formatNPR(o.total)}
                        </span>
                        <Badge
                          variant={
                            o.status === "DELIVERED"
                              ? "default"
                              : o.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px] uppercase"
                        >
                          {o.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent orders.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Active Products */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Top Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SectionSkeleton rows={5} />
            ) : (
              <div className="space-y-3">
                {stats.topProducts.length > 0 ? (
                  stats.topProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                        #{i + 1}
                      </span>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-9 w-9 rounded-md object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNPR(p.price)}
                        </p>
                      </div>
                      <Badge
                        variant={p.stock < 5 ? "destructive" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {p.stock} in stock
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active products.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
