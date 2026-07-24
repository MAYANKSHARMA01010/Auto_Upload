"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function RedirectIfAuthenticated() {
    const { isLogin, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isLogin) {
            router.replace("/dashboard");
        }
    }, [isLogin, isLoading, router]);

    return null;
}
