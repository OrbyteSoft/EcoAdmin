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

import { AdminLayout } from "@/components/layout/AdminLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import UsersPage from "./pages/Users";
import Payments from "./pages/Payments";
import Coupons from "./pages/Coupons";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
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

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <AuthProvider>
            <UserProvider>
              <CategoryProvider>
                <ProductProvider>
                  <OrderProvider>
                    <PaymentProvider>
                      <BrowserRouter>
                        <Routes>
                          <Route path="/login" element={<Login />} />

                          <Route element={<ProtectedRoute />}>
                            <Route element={<AdminLayout />}>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/products" element={<Products />} />
                              <Route
                                path="/categories"
                                element={<Categories />}
                              />
                              <Route path="/orders" element={<Orders />} />
                              <Route path="/users" element={<UsersPage />} />
                              <Route path="/payments" element={<Payments />} />
                              <Route path="/coupons" element={<Coupons />} />
                              <Route path="/reviews" element={<Reviews />} />
                              <Route path="/settings" element={<Settings />} />
                            </Route>
                          </Route>

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </PaymentProvider>
                  </OrderProvider>
                </ProductProvider>
              </CategoryProvider>
            </UserProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
