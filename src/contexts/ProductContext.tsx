/**
 * ProductContext
 *
 * Fetches paginated products and polls every 30 s for low-stock changes.
 * Fires a "stock" notification when a product's stock drops below the threshold
 * and we haven't already notified for that product ID in this session.
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { api } from "@/lib/api";
import { useNotifications } from "./NotificationContext";

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAt: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFlashDeal: boolean;
  flashDealEnd: string | null;
  categoryId: string | null;
  brandId: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductContextType {
  products: Product[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (page: number) => void;
  fetchProducts: (search?: string) => Promise<void>;
  createProduct: (data: any) => Promise<void>;
  updateProduct: (id: string, data: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, stock: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const LOW_STOCK_THRESHOLD = 10;
// Products poll less frequently — stock doesn't change as fast as orders
const STOCK_POLL_INTERVAL = 30_000;

const normalizeProduct = (item: any): Product => {
  const rawImages = item.images || [];
  const normalizedImages: string[] = Array.isArray(rawImages)
    ? rawImages.map((img: any) => (typeof img === "string" ? img : img.url))
    : [];

  return {
    id: item.id,
    sku: item.sku ?? null,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: Number(item.price || 0),
    compareAt: item.compareAt ?? item.compare_at ?? null,
    stock: Number(item.stock || 0),
    imageUrl: item.imageUrl ?? item.image_url ?? null,
    isActive: item.isActive ?? item.is_active ?? true,
    isFeatured: item.isFeatured ?? item.is_featured ?? false,
    isBestSeller: item.isBestSeller ?? item.is_best_seller ?? false,
    isNewArrival: item.isNewArrival ?? item.is_new_arrival ?? false,
    isFlashDeal: item.isFlashDeal ?? item.is_flash_deal ?? false,
    flashDealEnd: item.flashDealEnd ?? item.flash_deal_end ?? null,
    categoryId: item.categoryId ?? item.category_id ?? null,
    brandId: item.brandId ?? item.brand_id ?? null,
    images: normalizedImages,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { addNotification } = useNotifications();

  // Track which product IDs we've already fired a low-stock notification for
  const notifiedStockIdsRef = useRef<Set<string>>(new Set());
  const stockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Main paginated fetch (used by the Products page) ──────────────────────
  const fetchProducts = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search ? { search } : {}),
        });

        const response = await api(`/products?${params}`);
        const rawData = response?.data ?? response ?? [];
        const freshTotal =
          response?.meta?.total ??
          (Array.isArray(rawData) ? rawData.length : 0);

        const normalized = Array.isArray(rawData)
          ? rawData.map(normalizeProduct)
          : [];

        setProducts(normalized);
        setTotal(freshTotal);
      } catch (error: any) {
        console.error("fetchProducts error:", error.message);
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Background stock poll (all products, unpaginated) ─────────────────────
  const checkLowStock = useCallback(async () => {
    try {
      // Fetch all products for the stock check — use a high limit or a
      // dedicated endpoint if your backend supports it
      const response = await api("/products?page=1&limit=500");
      const rawData = response?.data ?? response ?? [];
      const all: Product[] = Array.isArray(rawData)
        ? rawData.map(normalizeProduct)
        : [];

      all.forEach((product) => {
        if (
          product.stock < LOW_STOCK_THRESHOLD &&
          !notifiedStockIdsRef.current.has(product.id)
        ) {
          addNotification({
            type: "stock",
            title: `Low stock: ${product.name}`,
            message: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} remaining`,
            relatedId: product.id,
            read: false,
          });
          // Remember we notified — don't re-fire until stock is replenished
          notifiedStockIdsRef.current.add(product.id);
        }

        // If stock was replenished above threshold, allow future re-notification
        if (product.stock >= LOW_STOCK_THRESHOLD) {
          notifiedStockIdsRef.current.delete(product.id);
        }
      });
    } catch (e) {
      // Non-fatal — stock check is best-effort
      console.warn("Low-stock check failed:", e);
    }
  }, [addNotification]);

  useEffect(() => {
    // Run once on mount then on interval
    checkLowStock();
    stockIntervalRef.current = setInterval(checkLowStock, STOCK_POLL_INTERVAL);
    return () => {
      if (stockIntervalRef.current) clearInterval(stockIntervalRef.current);
    };
  }, [checkLowStock]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const createProduct = async (data: any) => {
    try {
      await api("/products", { method: "POST", body: JSON.stringify(data) });
      setPage(1);
      await fetchProducts();
    } catch (error: any) {
      throw new Error(error.message || "Failed to create product");
    }
  };

  const updateProduct = async (id: string, data: any) => {
    try {
      await api(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await fetchProducts();
    } catch (error: any) {
      throw new Error(error.message || "Failed to update product");
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchProducts();
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete product");
    }
  };

  const updateStock = async (id: string, stock: number) => {
    try {
      await api(`/products/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
      await fetchProducts();
    } catch {
      await fetchProducts();
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        total,
        loading,
        page,
        setPage,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        updateStock,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
};
