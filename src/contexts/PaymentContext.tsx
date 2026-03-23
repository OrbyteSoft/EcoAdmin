"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
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
  order?: {
    orderNumber: string;
  };
  user?: {
    name: string | null;
    email: string;
  };
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

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const previousPaymentsRef = useRef<Payment[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addNotification } = useNotifications();

  const fetchAllPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<Payment[]>("/payments/admin/all");

      // Check for new payments
      const previousIds = new Set(previousPaymentsRef.current.map(p => p.id));
      const newPayments = data.filter(p => !previousIds.has(p.id));

      // Add notifications for new payments
      newPayments.forEach(payment => {
        addNotification({
          type: "payment",
          title: `Payment - ${payment.method}`,
          message: `New payment received - ${payment.status} (₹${payment.amount})`,
          relatedId: payment.id,
          read: false,
        });
      });

      setPayments(data);
      previousPaymentsRef.current = data;
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch admin payments");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const updatePaymentStatus = async (
    id: string,
    reference: string,
    status: PaymentStatus,
  ) => {
    try {
      const updatedPayment = await api<Payment>(`/payments/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ reference, status }),
      });

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? updatedPayment : p)),
      );

      toast.success(`Payment status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment status");
      throw error;
    }
  };

  // Set up polling for new payments every 5 seconds
  useEffect(() => {
    fetchAllPayments();

    pollingIntervalRef.current = setInterval(() => {
      fetchAllPayments();
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchAllPayments]);

  return (
    <PaymentContext.Provider
      value={{ payments, isLoading, fetchAllPayments, updatePaymentStatus }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (!context)
    throw new Error("usePayments must be used within PaymentProvider");
  return context;
};
