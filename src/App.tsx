import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { UserProvider } from "@/contexts/UserContext";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import { AdminLayout } from "@/components/layout/AdminLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Orders from "./pages/Orders";
import UsersPage from "./pages/Users";
import Payments from "./pages/Payments";
import Coupons from "./pages/Coupons";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">Verifying Session</p>
        <p className="text-xs text-muted-foreground animate-pulse">
          Please wait while we secure your connection...
        </p>
      </div>
    </div>
  </div>
);

// Redirects authenticated admins away from the login page
const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  // Already logged in as admin → go straight to dashboard
  if (user && user.role === "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Blocks unauthenticated or non-admin users from protected pages
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public: redirect to dashboard if already authenticated */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected: require ADMIN role */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* BrowserRouter wraps everything so useNavigate works anywhere */}
          <BrowserRouter>
            <AuthProvider>
              <NotificationProvider>
                <UserProvider>
                  <CategoryProvider>
                    <ProductProvider>
                      <BrandProvider>
                        <OrderProvider>
                          <PaymentProvider>
                            <AppRoutes />
                          </PaymentProvider>
                        </OrderProvider>
                      </BrandProvider>
                    </ProductProvider>
                  </CategoryProvider>
                </UserProvider>
              </NotificationProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
