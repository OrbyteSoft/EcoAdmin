"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: {
    id?: string;
    name: string | null;
    email?: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

interface CreateReviewDto {
  productId: string;
  rating: number;
  comment?: string;
}

interface ReviewContextType {
  productReviews: ReviewStats;
  allReviews: Review[];
  isLoading: boolean;
  fetchReviewsByProduct: (productId: string) => Promise<void>;
  fetchAllReviews: () => Promise<void>;
  addReview: (dto: CreateReviewDto) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  // Stats for specific products
  const [productReviews, setProductReviews] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
  });

  // Flat list for admin dashboard
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Reviews for a specific product (Public)
  const fetchReviewsByProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      const data = await api<ReviewStats>(`/reviews/product/${productId}`);
      setProductReviews(data);
    } catch (error: any) {
      console.error("Failed to fetch reviews:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch All Reviews (Admin Only)
  const fetchAllReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<Review[]>("/reviews");
      setAllReviews(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch all reviews");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Add Review (Authenticated)
  const addReview = async (dto: CreateReviewDto): Promise<boolean> => {
    try {
      const newReview = await api<Review>("/reviews", {
        method: "POST",
        body: JSON.stringify(dto),
      });

      setProductReviews((prev) => ({
        ...prev,
        reviews: [newReview, ...prev.reviews],
        totalReviews: prev.totalReviews + 1,
      }));

      toast.success("Review submitted!");
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  // 4. Delete Review (Authenticated / Admin)
  const deleteReview = async (reviewId: string) => {
    try {
      await api(`/reviews/${reviewId}`, {
        method: "DELETE",
      });

      // Update product-specific state
      setProductReviews((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== reviewId),
        totalReviews: Math.max(0, prev.totalReviews - 1),
      }));

      // Update admin list state
      setAllReviews((prev) => prev.filter((r) => r.id !== reviewId));

      toast.success("Review deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <ReviewContext.Provider
      value={{
        productReviews,
        allReviews,
        isLoading,
        fetchReviewsByProduct,
        fetchAllReviews,
        addReview,
        deleteReview,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context)
    throw new Error("useReviews must be used within ReviewProvider");
  return context;
};
