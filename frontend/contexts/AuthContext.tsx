"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { User } from "@/types";
import { api } from "@/lib/axios";

interface AuthContextType {
  user: User | null;
  isLogin: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken, isAuthenticated, _hasHydrated, setAuth, logout: storeLogout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hasAttemptedRefresh = useRef(false);

  useEffect(() => {
    const attemptSilentRefresh = async () => {
      if (_hasHydrated && !isAuthenticated && !hasAttemptedRefresh.current) {
        hasAttemptedRefresh.current = true;
        setIsRefreshing(true);
        try {
          const res = await api.post("/auth/refresh");
          if (res.data?.access_token) {
            const meRes = await api.get("/auth/me", {
              headers: { Authorization: `Bearer ${res.data.access_token}` }
            });
            setAuth(meRes.data, res.data.access_token);
          }
        } catch (error) {
          // No valid refresh token
          storeLogout();
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push("/login");
          }
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    attemptSilentRefresh();
  }, [_hasHydrated, isAuthenticated, pathname, router, storeLogout, setAuth]);

  // Route protection
  useEffect(() => {
    if (_hasHydrated && !isRefreshing && hasAttemptedRefresh.current) {
      if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
        router.push("/login");
      }
      if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
        router.push("/dashboard");
      }
    } else if (_hasHydrated && !isRefreshing && isAuthenticated) {
        if (pathname === "/login" || pathname === "/register") {
            router.push("/dashboard");
        }
    }
  }, [_hasHydrated, isRefreshing, isAuthenticated, pathname, router]);

  const login = (newUser: User, newAccessToken: string) => {
    setAuth(newUser, newAccessToken);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore
    }
    storeLogout();
    router.push("/login");
  };

  const isLoading = !_hasHydrated || isRefreshing;
  const isLogin = isAuthenticated;

  return (
    <AuthContext.Provider value={{ user, isLogin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
