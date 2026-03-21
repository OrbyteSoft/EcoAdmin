"use client";

import React, { useMemo, useEffect } from "react";
import { usePayments } from "@/contexts/PaymentContext";
import { useOrders } from "@/contexts/OrderContext";
import { useProducts } from "@/contexts/ProductContext";
import { useUsers } from "@/contexts/UserContext";
import { formatNPR } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
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
} from "recharts";

const CHART_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#ef4444"];

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
  icon: any;
  gradient: string;
}) {
  return (
    <Card
      className={`${gradient} border-0 shadow-md text-white overflow-hidden relative`}
    >
      <CardContent className="flex items-center gap-4 p-6 relative z-10">
        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
      <div className="absolute right-[-10%] bottom-[-20%] opacity-10">
        <Icon size={120} />
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { payments, isLoading: lp, fetchAllPayments } = usePayments();
  const { orders, isLoading: lo, fetchAllOrders } = useOrders();
  const { products, loading: lpr, fetchProducts } = useProducts();
  const { users, isLoading: lu, fetchAllUsers } = useUsers();

  // Trigger data refresh on mount
  useEffect(() => {
    fetchAllOrders();
    fetchAllPayments();
    fetchAllUsers();
    fetchProducts();
  }, [fetchAllOrders, fetchAllPayments, fetchAllUsers, fetchProducts]);

  const isLoading = lp || lo || lpr || lu;

  // --- Computed Analytics ---
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((acc, curr) => acc + curr.total, 0);

    const statusCounts = orders.reduce((acc: any, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyMap: Record<string, number> = {};
    orders.forEach((o) => {
      const date = new Date(o.createdAt);
      const month = date.toLocaleString("default", { month: "short" });
      monthlyMap[month] = (monthlyMap[month] || 0) + o.total;
    });

    return {
      totalRevenue,
      statusData: Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      })),
      revenueData: Object.entries(monthlyMap).map(([month, revenue]) => ({
        month,
        revenue,
      })),
      lowStock: products.filter((p) => p.stock < 10).slice(0, 5),
      recentOrders: [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6),
    };
  }, [orders, products]);

  if (isLoading && orders.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time analytics from your store.
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          Live Updates
        </Badge>
      </div>

      {/* Summary Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatNPR(stats.totalRevenue)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Total Orders"
          value={orders.length.toString()}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Total Products"
          value={products.length.toString()}
          icon={Package}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Active Users"
          value={users.length.toString()}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `रु${v / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(v: any) => [formatNPR(v), "Revenue"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Order Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  innerRadius={60}
                  outerRadius={80}
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
                <Tooltip />
                <Legend
                  iconType="circle"
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Section */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Inventory
              Alerts
            </CardTitle>
            <Badge variant="destructive">Critically Low</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {stats.lowStock.length > 0 ? (
                  stats.lowStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-muted-foreground">
                            {p.stock} left
                          </span>
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="bg-red-500 h-full"
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
                    <TableCell className="text-center text-muted-foreground py-4">
                      No inventory alerts.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold">
                        {formatNPR(o.total)}
                      </span>
                      <Badge
                        variant="outline"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
