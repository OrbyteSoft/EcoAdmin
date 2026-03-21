import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

interface UserContextType {
  users: User[];
  isLoading: boolean;
  fetchAllUsers: () => Promise<void>;
  createUser: (data: any) => Promise<void>; // Added this
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<User[]>("/users");
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = async (data: any) => {
    try {
      const newUser = await api<User>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setUsers((prev) => [...prev, newUser]);
      toast.success("User created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
      throw error;
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      const updatedUser = await api<User>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      toast.success("User updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Update failed");
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api(`/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        isLoading,
        fetchAllUsers,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUsers must be used within a UserProvider");
  return context;
};
