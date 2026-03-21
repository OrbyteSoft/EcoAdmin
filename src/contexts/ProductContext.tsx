"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";

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

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const normalizeProduct = (item: any): Product => {
    const rawImages = item.images || [];

    const normalizedImages: string[] = Array.isArray(rawImages)
      ? rawImages.map((img: any) => (typeof img === "string" ? img : img.url))
      : [];

    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: Number(item.price || 0),
      compareAt: item.compareAt || item.compare_at || null,
      stock: Number(item.stock || 0),
      imageUrl: item.imageUrl || item.image_url || null,
      isActive: item.isActive ?? item.is_active ?? true,
      isFeatured: item.isFeatured ?? item.is_featured ?? false,
      isBestSeller: item.isBestSeller ?? item.is_best_seller ?? false,
      isNewArrival: item.isNewArrival ?? item.is_new_arrival ?? false,
      isFlashDeal: item.isFlashDeal ?? item.is_flash_deal ?? false,
      flashDealEnd: item.flashDealEnd || item.flash_deal_end || null,
      categoryId: item.categoryId || item.category_id || null,
      images: normalizedImages,
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
    };
  };

  const fetchProducts = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        });

        const response = await api(`/products?${queryParams.toString()}`);

        // Handle various API response structures (direct array or paginated object)
        const rawData = response?.data || response || [];
        const freshTotal =
          response?.meta?.total ||
          (Array.isArray(rawData) ? rawData.length : 0);

        const sanitizedProducts = Array.isArray(rawData)
          ? rawData.map(normalizeProduct)
          : [];

        setProducts(sanitizedProducts);
        setTotal(freshTotal);
      } catch (error: any) {
        console.error("Fetch Error:", error.message);
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: any) => {
    try {
      await api("/products", { method: "POST", body: JSON.stringify(data) });
      setPage(1); // Reset to first page to see the new product
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
      // If deleting the last item on a page, move back a page
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
    } catch (error) {
      // Re-fetch anyway to ensure UI is in sync
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
  const context = useContext(ProductContext);
  if (!context)
    throw new Error("useProducts must be used within a ProductProvider");
  return context;
};
