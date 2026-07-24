"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";

export function Header() {
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-outline-variant bg-surface-container-lowest/90 backdrop-blur-md z-30 flex-shrink-0">
      {/* Left controls: Sleek icon button toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? "Show Sidebar" : "Hide Sidebar (Full Screen)"}
          className="p-2 rounded-xl border border-outline-variant bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">
            side_navigation
          </span>
        </button>
      </div>

      {/* Right controls: Browser Fullscreen toggle & New Upload */}
      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Toggle Browser Fullscreen"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all"
        >
          <span className="material-symbols-outlined text-lg">
            {isFullscreen ? "fullscreen_exit" : "fullscreen"}
          </span>
          <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
        </button>

        <Link
          href="/upload"
          className="bg-primary-container text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_12px_rgba(79,70,229,0.25)]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Upload
        </Link>
      </div>
    </header>
  );
}
