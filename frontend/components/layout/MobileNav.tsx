"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Upload", href: "/upload", icon: "upload" },
  { name: "Shorts Factory", href: "/shorts-factory", icon: "smart_display" },
  { name: "Accounts", href: "/accounts", icon: "group" },
  { name: "Calendar", href: "/calendar", icon: "calendar_month" },
  { name: "Analytics", href: "/analytics", icon: "analytics" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const mainTabs = navItems.slice(0, 4);

  return (
    <>
      {/* Mobile Bottom Navigation Bar (< md screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-lg border-t border-outline-variant flex items-center justify-around px-2 py-1.5 shadow-2xl">
        {mainTabs.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all",
                isActive
                  ? "text-primary font-bold bg-primary/10"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                {item.icon}
              </span>
              <span className="text-[10px] truncate">{item.name}</span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all",
            drawerOpen ? "text-primary font-bold bg-primary/10" : "text-on-surface-variant"
          )}
        >
          <span className="material-symbols-outlined text-xl">menu</span>
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* Slide-out Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-surface-container-lowest h-full flex flex-col z-10 border-r border-outline-variant shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 flex items-center justify-between border-b border-outline-variant">
              <Link href="/" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                <img alt="ClipScheduler Logo" className="h-8 w-auto object-contain" src="/logo.png" />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Nav List */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                      isActive
                        ? "bg-primary-container text-white shadow-md"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-primary/20 bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{user?.name || "Admin User"}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{user?.email || "Enterprise Admin"}</p>
                </div>
                <button onClick={() => { logout(); setDrawerOpen(false); }} className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined text-xl">logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
