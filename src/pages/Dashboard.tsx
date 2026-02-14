import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHART_COLORS = ["hsl(172,66%,50%)", "hsl(38,92%,50%)", "hsl(270,70%,55%)", "hsl(142,71%,45%)", "hsl(0,84%,60%)"];

function StatCard({ title, value, icon: Icon, gradient }: { title: string; value: string; icon: any; gradient: string }) {
  return (
    <Card className={`${gradient} border-0 shadow-lg`}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-xl bg-white/20 p-3">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: orders, isLoading: lo } = useQuery({ queryKey: ["orders"], queryFn: () => api<any>("/orders") });
  const { data: products, isLoading: lp } = useQuery({ queryKey: ["products"], queryFn: () => api<any>("/products") });
  const { data: users, isLoading: lu } = useQuery({ queryKey: ["users"], queryFn: () => api<any>("/users") });

  const isLoading = lo || lp || lu;

  // Compute stats
  const orderList = Array.isArray(orders) ? orders : orders?.data || [];
  const productList = Array.isArray(products) ? products : products?.data || [];
  const userList = Array.isArray(users) ? users : users?.data || [];

  const totalRevenue = orderList.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalOrders = orderList.length;
  const totalProducts = productList.length;
  const totalUsers = userList.length;

  // Order status distribution
  const statusCounts: Record<string, number> = {};
  orderList.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Payment method distribution
  const methodCounts: Record<string, number> = {};
  orderList.forEach((o: any) => {
    const m = o.payment?.method || o.paymentMethod || "Unknown";
    methodCounts[m] = (methodCounts[m] || 0) + 1;
  });
  const methodData = Object.entries(methodCounts).map(([name, value]) => ({ name, value }));

  // Monthly revenue (simple aggregation)
  const monthlyMap: Record<string, number> = {};
  orderList.forEach((o: any) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + (o.total || 0);
  });
  const monthlyRevenue = Object.entries(monthlyMap).sort().slice(-6).map(([month, revenue]) => ({ month, revenue }));

  // Monthly orders count
  const monthlyOrderMap: Record<string, number> = {};
  orderList.forEach((o: any) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyOrderMap[key] = (monthlyOrderMap[key] || 0) + 1;
  });
  const monthlyOrders = Object.entries(monthlyOrderMap).sort().slice(-6).map(([month, count]) => ({ month, count }));

  // Low stock products
  const lowStock = productList.filter((p: any) => p.stock < 10).slice(0, 5);

  // Recent orders
  const recentOrders = [...orderList].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatNPR(totalRevenue)} icon={DollarSign} gradient="gradient-card-revenue" />
        <StatCard title="Total Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} gradient="gradient-card-orders" />
        <StatCard title="Total Products" value={totalProducts.toLocaleString()} icon={Package} gradient="gradient-card-products" />
        <StatCard title="Total Users" value={totalUsers.toLocaleString()} icon={Users} gradient="gradient-card-users" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `रु${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatNPR(v)} />
                <Bar dataKey="revenue" fill="hsl(172,66%,50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Orders</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(38,92%,50%)" strokeWidth={3} dot={{ fill: "hsl(38,92%,50%)", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Order Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                  {methodData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock & Recent Orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{p.stock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id?.slice(0, 8)}</TableCell>
                    <TableCell>
                      <span className={`status-${o.status?.toLowerCase()} rounded px-2 py-0.5 text-xs font-medium`}>
                        {o.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNPR(o.total || 0)}</TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No orders yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
