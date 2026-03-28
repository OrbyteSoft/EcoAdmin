/**
 * PaymentContext
 *
 * Polls /payments/admin/all every 15 s.
 * Fires addNotification only for brand-new payment IDs.
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
import { toast } from "sonner";
import { useNotifications } from "./NotificationContext";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMethod = "ESEWA" | "KHALTI" | "STRIPE" | "COD";

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
  order?: { orderNumber: string };
  user?: { name: string | null; email: string };
}

interface PaymentContextType {
  payments: Payment[];
  isLoading: boolean;
  fetchAllPayments: () => Promise<void>;
  updatePaymentStatus: (
    id: string,
    reference: string,
    status: PaymentStatus,
  ) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const POLL_INTERVAL = 15_000;

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllPayments = useCallback(async () => {
    if (!initialLoadDoneRef.current) setIsLoading(true);

    try {
      const data = await api<Payment[]>("/payments/admin/all");

      if (initialLoadDoneRef.current) {
        data.forEach((payment) => {
          if (!seenIdsRef.current.has(payment.id)) {
            addNotification({
              type: "payment",
              title: `Payment — ${payment.method}`,
              message: `New ${payment.status} payment of Rs. ${payment.amount}`,
              relatedId: payment.id,
              read: false,
            });
          }
        });
      }

      data.forEach((p) => seenIdsRef.current.add(p.id));
      setPayments(data);
      initialLoadDoneRef.current = true;
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch payments");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchAllPayments();
    intervalRef.current = setInterval(fetchAllPayments, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAllPayments]);

  const updatePaymentStatus = async (
    id: string,
    reference: string,
    status: PaymentStatus,
  ) => {
    try {
      const updated = await api<Payment>(`/payments/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ reference, status }),
      });
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(`Payment status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment status");
      throw error;
    }
  };

  return (
    <PaymentContext.Provider
      value={{ payments, isLoading, fetchAllPayments, updatePaymentStatus }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayments = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayments must be used within PaymentProvider");
  return ctx;
};
