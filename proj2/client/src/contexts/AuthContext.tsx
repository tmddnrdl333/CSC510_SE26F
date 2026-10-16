import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "../services/api";

interface User {
  id: string;
  email: string;
  role: "customer" | "restaurant" | "delivery";
  profile: any;
  location?: { latitude: number; longitude: number }; // 如果後端提供
  deliveryStatus?: "free" | "busy";
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  getProfile: (email: string, password: string) => Promise<User>;
  refreshUser: () => Promise<void>; // ⭐ 加這行
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on app load
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log("User restored from localStorage:", parsedUser);
        } else {
          console.log("No user data found in localStorage");
        }
      } catch (error) {
        console.error("Error restoring auth:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, []);

  /** ⭐ Login */
  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email);
      const response = await api.post("/auth/login", { email, password });
      const { user: userData, token } = response.data;
      console.log("Login successful, user data:", userData);

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token); // JWT from the server (M1 trust layer)
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  /** ⭐ Register */
  const register = async (userData: any) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { user: newUser, token } = response.data;

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("token", token);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  };

  /** ⭐ getProfile */
  const getProfile = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/profile", { email, password });
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to get profile");
    }
  };

  /** ⭐ NEW: refreshUser() */
  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await api.get(`/users/${user.id}`);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      console.log("User refreshed:", updatedUser);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  /** ⭐ logout */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    getProfile,
    refreshUser, // ⭐ new function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
