import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { api } from "@/lib/api";

// Types
interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBrandInput {
  name: string;
  slug: string;
  logoUrl?: string;
}

interface UpdateBrandInput {
  name?: string;
  slug?: string;
  logoUrl?: string;
}

interface BrandContextType {
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
  selectedBrand: Brand | null;

  // Read operations
  fetchAllBrands: () => Promise<void>;
  fetchBrandById: (id: string) => Promise<Brand | null>;
  fetchBrandBySlug: (slug: string) => Promise<Brand | null>;

  // Write operations
  createBrand: (input: CreateBrandInput) => Promise<Brand>;
  updateBrand: (id: string, input: UpdateBrandInput) => Promise<Brand>;
  deleteBrand: (id: string) => Promise<void>;

  // State management
  setSelectedBrand: (brand: Brand | null) => void;
  clearError: () => void;
}

const BrandContext = createContext<BrandContextType | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Fetch all brands
  const fetchAllBrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api<Brand[]>("/brands");
      setBrands(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch brands";
      setError(errorMessage);
      console.error("Error fetching brands:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch brand by ID
  const fetchBrandById = useCallback(
    async (id: string): Promise<Brand | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api<Brand>(`/brands/${id}`);
        setSelectedBrand(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch brand";
        setError(errorMessage);
        console.error("Error fetching brand:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Fetch brand by slug
  const fetchBrandBySlug = useCallback(
    async (slug: string): Promise<Brand | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api<Brand>(`/brands/slug/${slug}`);
        setSelectedBrand(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch brand";
        setError(errorMessage);
        console.error("Error fetching brand by slug:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Create brand
  const createBrand = useCallback(
    async (input: CreateBrandInput): Promise<Brand> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api<Brand>("/brands", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setBrands((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create brand";
        setError(errorMessage);
        console.error("Error creating brand:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Update brand
  const updateBrand = useCallback(
    async (id: string, input: UpdateBrandInput): Promise<Brand> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api<Brand>(`/brands/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        setBrands((prev) =>
          prev.map((brand) => (brand.id === id ? data : brand)),
        );
        if (selectedBrand?.id === id) {
          setSelectedBrand(data);
        }
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update brand";
        setError(errorMessage);
        console.error("Error updating brand:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBrand],
  );

  // Delete brand
  const deleteBrand = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await api(`/brands/${id}`, {
          method: "DELETE",
        });
        setBrands((prev) => prev.filter((brand) => brand.id !== id));
        if (selectedBrand?.id === id) {
          setSelectedBrand(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete brand";
        setError(errorMessage);
        console.error("Error deleting brand:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBrand],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load of all brands
  useEffect(() => {
    fetchAllBrands();
  }, [fetchAllBrands]);

  const value: BrandContextType = {
    brands,
    isLoading,
    error,
    selectedBrand,
    fetchAllBrands,
    fetchBrandById,
    fetchBrandBySlug,
    createBrand,
    updateBrand,
    deleteBrand,
    setSelectedBrand,
    clearError,
  };

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used inside BrandProvider");
  }
  return context;
}
