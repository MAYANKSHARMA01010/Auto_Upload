"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated || !accessToken) {
      router.push("/login");
    }
  }, [isAuthenticated, accessToken, router]);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background text-on-background font-body-md overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <Header />
        {children}
      </div>
    </div>
  );
}
