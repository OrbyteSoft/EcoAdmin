import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Order } from "@/types";
import { toast } from "sonner";

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  fetchAllOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<Order[]>("/orders/admin/all");
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch admin orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const updatedOrder = await api<Order>(`/orders/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));

      toast.success(`Order marked as ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
      throw error;
    }
  };

  return (
    <OrderContext.Provider
      value={{ orders, isLoading, fetchAllOrders, updateOrderStatus }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within OrderProvider");
  return context;
};
