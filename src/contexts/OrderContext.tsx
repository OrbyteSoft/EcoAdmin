/**
 * OrderContext
 *
 * Polls /orders/admin/all every 15 s.
 * Fires addNotification only for brand-new order IDs (not seen in previous fetch).
 * Uses a seenIdsRef that persists across re-renders so we never double-notify.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
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

// How often to poll (ms)
const POLL_INTERVAL = 15_000;

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Track IDs we have already notified about — persists in memory across polls
  const seenIdsRef = useRef<Set<string>>(new Set());
  // True after the very first fetch completes — we don't notify on initial load
  const initialLoadDoneRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllOrders = useCallback(async () => {
    // Only show the full-screen loader on first load
    if (!initialLoadDoneRef.current) setIsLoading(true);

    try {
      const data = await api<Order[]>("/orders/admin/all");

      if (initialLoadDoneRef.current) {
        // Subsequent polls — notify for IDs we haven't seen before
        data.forEach((order) => {
          if (!seenIdsRef.current.has(order.id)) {
            addNotification({
              type: "order",
              title: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
              message: `New order received — ${order.status ?? "PENDING"}`,
              relatedId: order.id,
              read: false,
            });
          }
        });
      }

      // Always mark all current IDs as seen
      data.forEach((o) => seenIdsRef.current.add(o.id));

      setOrders(data);
      initialLoadDoneRef.current = true;
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Start polling on mount, clear on unmount
  useEffect(() => {
    fetchAllOrders();
    intervalRef.current = setInterval(fetchAllOrders, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAllOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const updated = await api<Order>(`/orders/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      toast.success(`Order marked as ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
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
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
