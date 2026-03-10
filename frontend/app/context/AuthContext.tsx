"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: string;
    name: string;
    email: string;
    age: number;
    sex: string;
    emergency_contact_email: string;
    latitude: string;
    longitude: string;
    created_at: Date;
    updated_at: Date;
    roles: string[];
    provider?: string;
    isverified?: boolean;
    emergency_contact_isverified?: boolean;
    doctor_status?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Routes that don't require authentication */
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

/** Session re-validation interval (5 minutes) */
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const refreshAttemptedRef = useRef(false);

    /**
     * Try to refresh the access token using the refresh cookie.
     * Returns true if refresh succeeded.
     */
    const tryRefreshToken = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/auth/refresh", { method: "POST" });
            return res.ok;
        } catch {
            return false;
        }
    }, []);

    /**
     * Check login status by calling /api/auth/profile.
     * If the access token has expired (401) and we haven't tried a refresh yet,
     * attempt a silent token refresh and retry once.
     */
    const checkLoginStatus = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/profile");

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                refreshAttemptedRef.current = false; // reset for next cycle
                return;
            }

            // Access token expired — try silent refresh with the refresh token
            if (response.status === 401 && !refreshAttemptedRef.current) {
                refreshAttemptedRef.current = true;
                const refreshed = await tryRefreshToken();

                if (refreshed) {
                    // Retry profile fetch with the new access token
                    const retry = await fetch("/api/auth/profile");
                    if (retry.ok) {
                        const userData = await retry.json();
                        setUser(userData);
                        refreshAttemptedRef.current = false;
                        return;
                    }
                }
            }

            // Both tokens expired / invalid — user is logged out
            setUser(null);
        } catch (error) {
            console.log("Authentication checking failed", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [tryRefreshToken]);

    // Initial check on mount
    useEffect(() => {
        checkLoginStatus();
    }, [checkLoginStatus]);

    // Re-validate session periodically (every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            checkLoginStatus();
        }, SESSION_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [checkLoginStatus]);

    // Re-validate session when the browser window regains focus
    useEffect(() => {
        const onFocus = () => {
            checkLoginStatus();
        };

        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [checkLoginStatus]);

    // Re-validate session on route changes
    useEffect(() => {
        if (!loading) {
            checkLoginStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Redirect to /login when session is expired on any protected route
    useEffect(() => {
        if (loading) return;
        if (!user && !PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
            router.push("/login");
        }
    }, [loading, user, pathname, router]);

    const login = async (email: string, password: string) => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            refreshAttemptedRef.current = false;
            await checkLoginStatus();
            router.push("/dashboard");
        } else {
            setUser(null);
            throw new Error("Failed to login");
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh: checkLoginStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthContextProvider");
    }
    return context;
};