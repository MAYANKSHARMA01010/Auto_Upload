"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLogin, isLoading } = useAuth();

  if (isLoading || !isLogin) {
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
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
