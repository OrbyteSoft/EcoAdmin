import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  parentId: string | null;
  productsCount?: number;
  children?: Category[];
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CategoryContextType {
  categories: Category[]; // Flat list for table
  categoryTree: Category[]; // Hierarchical list
  meta: Meta | null;
  isLoading: boolean;

  // Operations
  fetchCategories: (params?: any) => Promise<void>;
  fetchCategoryTree: () => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined,
);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Flat List (for Admin Table)
  const fetchCategories = useCallback(
    async (params: any = { page: 1, limit: 10 }) => {
      setIsLoading(true);
      try {
        const formattedParams = Object.entries(params).map(([key, value]) => [
          key,
          String(value),
        ]);

        const queryString = new URLSearchParams(formattedParams).toString();

        const response = await api<{ data: Category[]; meta: Meta }>(
          `/categories?${queryString}`,
        );

        setCategories(response.data);
        setMeta(response.meta);
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch categories");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // 2. Fetch Tree Structure (for Parent Category dropdowns)
  const fetchCategoryTree = useCallback(async () => {
    try {
      const response = await api<{ data: Category[] }>("/categories/tree");
      setCategoryTree(response.data);
    } catch (error: any) {
      console.error("Tree fetch failed", error);
    }
  }, []);

  // 3. Create Category
  const createCategory = async (data: Partial<Category>) => {
    setIsLoading(true);
    try {
      await api("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success("Category created successfully");
      // Refresh both states
      await fetchCategories();
      await fetchCategoryTree();
    } catch (error: any) {
      toast.error(error.message || "Creation failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Update Category
  const updateCategory = async (id: string, data: Partial<Category>) => {
    setIsLoading(true);
    try {
      await api(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      toast.success("Category updated");
      await fetchCategories();
      await fetchCategoryTree();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Delete Category
  const deleteCategory = async (id: string) => {
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      toast.success("Category removed");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      await fetchCategoryTree();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        categoryTree,
        meta,
        isLoading,
        fetchCategories,
        fetchCategoryTree,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context)
    throw new Error("useCategories must be used within CategoryProvider");
  return context;
};
