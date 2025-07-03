import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthResponse, Error, RegisterData>;
  isAuthenticated: boolean;
};

type LoginData = {
  phone: string;
  password: string;
};

type RegisterData = {
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthResponse = {
  user: User;
  token: string;
  message: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get stored token
  const getToken = () => localStorage.getItem('auth_token');
  const setToken = (token: string) => localStorage.setItem('auth_token', token);
  const removeToken = () => localStorage.removeItem('auth_token');

  // Setup axios interceptor for token
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Set default authorization header for future requests
      // This will be handled in apiRequest function
    }
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      
      try {
        const res = await apiRequest("/api/auth/me", "GET");
        const data = await res.json();
        return data.user;
      } catch (error) {
        console.error('Auth verification failed:', error);
        removeToken();
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthResponse> => {
      const res = await apiRequest("/api/auth/login", "POST", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }
      return await res.json();
    },
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<AuthResponse> => {
      const res = await apiRequest("/api/auth/register", "POST", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }
      return await res.json();
    },
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Registration successful",
        description: `Welcome to CakesBuy!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      removeToken();
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}