/**
 * NotificationContext
 *
 * Single source of truth for all in-app notifications.
 * - Persists to localStorage so notifications survive page refresh
 * - Deduplicates by (type + relatedId) so polling re-runs never double-add
 * - Does NOT poll on its own — OrderContext, PaymentContext, ProductContext
 *   call addNotification directly after their own fetches
 * - Exposes connectionType so the UI can show Live / Polling / Offline
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { notificationSound } from "@/lib/notificationSound";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "order" | "payment" | "stock";
  title: string;
  message: string;
  relatedId: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  isConnected: boolean;
  connectionType: "polling" | "disconnected";
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "admin_notifications";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Contexts (Order/Payment/Product) drive the data — we're always "polling"
  const [isConnected, setIsConnected] = useState(true);
  const connectionType = "polling" as const;

  // ── Persist / restore ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setNotifications(JSON.parse(stored));
    } catch {
      // Corrupt storage — start fresh
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Could not persist notifications:", e);
    }
  }, [notifications]);

  // ── Core actions ───────────────────────────────────────────────────────────

  /**
   * Add a notification only if one with the same (type + relatedId) doesn't
   * already exist — whether read or unread. This prevents polling re-runs from
   * re-adding the same event after a page refresh.
   */
  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "createdAt">) => {
      setNotifications((prev) => {
        const alreadyExists = prev.some(
          (existing) =>
            existing.type === n.type && existing.relatedId === n.relatedId,
        );
        if (alreadyExists) return prev;

        const newNotif: Notification = {
          ...n,
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          createdAt: new Date().toISOString(),
        };

        // Toast + sound
        if (n.type === "order") {
          toast.info(`📦 ${n.title}: ${n.message}`, { duration: 5000 });
        } else if (n.type === "payment") {
          toast.success(`💳 ${n.title}: ${n.message}`, { duration: 5000 });
        } else {
          toast.warning(`⚠️ ${n.title}: ${n.message}`, { duration: 7000 });
        }

        notificationSound.play();
        setIsConnected(true);

        return [newNotif, ...prev];
      });
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        isConnected,
        connectionType,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
};
