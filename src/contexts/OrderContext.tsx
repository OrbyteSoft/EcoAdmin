import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Order } from "@/types";
import { toast } from "sonner";
import { useNotifications } from "./NotificationContext";

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
  const previousOrdersRef = useRef<Order[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addNotification } = useNotifications();

  const fetchAllOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<Order[]>("/orders/admin/all");

      // Check for new orders
      const previousIds = new Set(previousOrdersRef.current.map(o => o.id));
      const newOrders = data.filter(o => !previousIds.has(o.id));

      // Add notifications for new orders
      newOrders.forEach(order => {
        addNotification({
          type: "order",
          title: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
          message: `New order received - ${order.status || "Pending"}`,
          relatedId: order.id,
          read: false,
        });
      });

      setOrders(data);
      previousOrdersRef.current = data;
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch admin orders");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

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

  // Set up polling for new orders every 5 seconds
  useEffect(() => {
    fetchAllOrders();

    pollingIntervalRef.current = setInterval(() => {
      fetchAllOrders();
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchAllOrders]);

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
