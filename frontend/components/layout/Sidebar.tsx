"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Upload", href: "/upload", icon: "upload" },
  { name: "Calendar", href: "/calendar", icon: "calendar_month" },
  { name: "Accounts", href: "/accounts", icon: "group" },
  { name: "Analytics", href: "/analytics", icon: "analytics" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant h-full flex flex-col z-40 hidden md:flex">
      <div className="p-cmd flex items-center gap-csm">
        <span className="font-headline-md text-headline-md text-primary tracking-tight">ClipScheduler</span>
      </div>
      <nav className="flex-1 px-csm mt-cmd space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-csm px-cmd py-csm rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary-container text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                {item.icon}
              </span>
              <span className="font-body-md">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-cmd border-t border-outline-variant bg-surface-container-low/50">
        <div className="flex items-center gap-csm">
          <div className="w-10 h-10 rounded-full border border-primary/20 bg-surface-container-high overflow-hidden flex-shrink-0">
            <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-on-surface-variant">person</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-label-md text-label-md text-on-surface truncate">{user?.name || user?.full_name || "Admin User"}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email || "Enterprise Admin"}</p>
          </div>
          <button onClick={() => logout()} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
