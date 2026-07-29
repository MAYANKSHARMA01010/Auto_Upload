"use client";

import { useState, useEffect, useCallback } from "react";
import { Manifest, ManifestSummary } from "@/types";
import { fetchManifests, fetchManifest } from "@/lib/manifests";

import { ShortsList } from "@/components/studio/ShortsList";
import { VideoPlayer916 } from "@/components/studio/VideoPlayer916";
import { MetadataStudio } from "@/components/studio/MetadataStudio";
import { useAuthStore } from "@/stores/authStore";

// ── Error Banner ──────────────────────────────────────────────────────────────
function ScanErrorBanner({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-container border border-outline-variant flex items-center justify-center mb-5 shadow-lg">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">video_library</span>
      </div>
      <h2 className="text-base font-bold text-on-surface mb-2">No Shorts Found</h2>
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-4">{error}</p>
      <div className="rounded-xl bg-surface-container border border-outline-variant px-4 py-3 text-left max-w-sm">
        <p className="text-[11px] text-on-surface-variant font-medium mb-2">Expected path:</p>
        <code className="text-[10px] text-primary break-all leading-relaxed">
          /Users/mayanksharma/Downloads/New_Projects/<br />
          shorts-factory/packages/ClipPilot/data/
        </code>
      </div>
      <p className="text-[11px] text-on-surface-variant mt-4 opacity-70">
        Run your shorts-factory pipeline to generate videos, then refresh.
      </p>
    </div>
  );
}

// ── Empty State for Column 2+3 ────────────────────────────────────────────────
function SelectAShort() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-12">
      <div
        className="rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center max-w-full"
        style={{ width: 200, height: 320 }}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">smart_display</span>
          <p className="text-xs text-on-surface-variant max-w-[140px] leading-relaxed">
            Select a short from the library to begin editing
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShortsFactoryPage() {
  const { accessToken } = useAuthStore();

  const [manifests, setManifests] = useState<ManifestSummary[]>([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanError, setScanError] = useState<string | undefined>();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeManifest, setActiveManifest] = useState<Manifest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Mobile view tab state: 'library' | 'preview' | 'metadata'
  const [mobileTab, setMobileTab] = useState<"library" | "preview" | "metadata">("library");

  // Scan on mount
  useEffect(() => {
    (async () => {
      setScanLoading(true);
      const { manifests: list, error } = await fetchManifests(accessToken ?? undefined);
      setManifests(list);
      setScanError(error);
      setScanLoading(false);
    })();
  }, [accessToken]);

  // Load detail when selection changes
  const handleSelect = useCallback(async (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setActiveManifest(null);
    setDetailLoading(true);
    // Automatically switch to preview on mobile devices when a video is selected
    setMobileTab("preview");
    const data = await fetchManifest(id, accessToken ?? undefined);
    setActiveManifest(data);
    setDetailLoading(false);
  }, [selectedId, accessToken]);

  // Handle cover frame capture — update manifest assets
  const handleCoverCapture = useCallback((ts: number) => {
    if (!activeManifest) return;
    setActiveManifest((prev) => prev
      ? { ...prev, assets: { ...prev.assets, cover_timestamp: String(ts) } }
      : prev
    );
  }, [activeManifest]);

  const selectedSummary = manifests.find((m) => m.id === selectedId);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* ── Mobile Navigation Tabs (visible on < md screens) ── */}
      <div className="md:hidden flex items-center justify-around border-b border-outline-variant bg-surface-container-low p-2 gap-1 flex-shrink-0">
        <button
          onClick={() => setMobileTab("library")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "library"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">video_library</span>
          Library ({manifests.length})
        </button>

        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "preview"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">play_circle</span>
          Preview
        </button>

        <button
          onClick={() => setMobileTab("metadata")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "metadata"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          Studio
        </button>
      </div>

      {/* ── Responsive Main Layout Container ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* ── COLUMN 1: Shorts List (Responsive Width) ─────────────────── */}
        <div className={`w-full md:w-60 lg:w-72 xl:w-80 flex-shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-lowest h-full min-h-0 overflow-hidden ${
          mobileTab !== "library" ? "hidden md:flex" : "flex"
        }`}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              smart_display
            </span>
            <div>
              <h1 className="text-sm font-bold text-on-surface">Shorts Factory</h1>
              <p className="text-[10px] text-on-surface-variant">Scan · Edit · Publish</p>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
            {scanError && manifests.length === 0 && !scanLoading ? (
              <div className="p-3">
                <div className="rounded-xl bg-surface-container border border-outline-variant p-3 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-2 block">folder_off</span>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">{scanError}</p>
                </div>
              </div>
            ) : (
              <ShortsList
                manifests={manifests}
                selectedId={selectedId}
                loading={scanLoading}
                error={manifests.length === 0 && !scanLoading ? scanError : undefined}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>

        {/* ── COLUMN 2: Video Player (Responsive Width) ────────────────── */}
        <div className={`w-full md:w-[320px] lg:w-[350px] xl:w-[380px] flex-shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-low h-full min-h-0 overflow-y-auto md:overflow-hidden touch-pan-y no-scrollbar ${
          mobileTab !== "preview" ? "hidden md:flex" : "flex"
        }`}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant flex-shrink-0 bg-surface-container-low sticky top-0 z-20">
            <span className="material-symbols-outlined text-secondary text-lg">play_circle</span>
            <span className="text-sm font-bold text-on-surface">Preview</span>
            {selectedSummary && (
              <span className="ml-auto text-[10px] text-on-surface-variant truncate max-w-[120px]">
                {selectedSummary.size_mb > 0 ? `${selectedSummary.size_mb} MB` : ""}
              </span>
            )}
          </div>

          {/* Player content */}
          <div className="w-full flex-1 p-3 flex flex-col items-center justify-start md:justify-center min-h-0 touch-pan-y pb-36 md:pb-3">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
                  <p className="text-xs text-on-surface-variant">Loading video…</p>
                </div>
              </div>
            ) : activeManifest ? (
              <VideoPlayer916
                videoPath={activeManifest.assets.video_path}
                coverPath={activeManifest.assets.default_cover_path}
                projectTitle={activeManifest.master_metadata.title}
                onCoverCapture={handleCoverCapture}
              />
            ) : (
              <SelectAShort />
            )}
          </div>
        </div>

        {/* ── COLUMN 3: Metadata Studio (Flexible Width) ─────────────── */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-surface-container-lowest min-w-0 ${
          mobileTab !== "metadata" ? "hidden md:flex" : "flex"
        }`}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary text-lg">tune</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-on-surface">Metadata Studio</span>
              {activeManifest && (
                <p className="text-[10px] text-on-surface-variant truncate">
                  {activeManifest.master_metadata.title.slice(0, 60)}
                  {activeManifest.master_metadata.title.length > 60 ? "…" : ""}
                </p>
              )}
            </div>
            {/* Auto-save live indicator */}
            {activeManifest && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-medium">Live Sync</span>
              </div>
            )}
          </div>

          {/* Studio content */}
          <div className="flex-1 overflow-y-auto no-scrollbar touch-pan-y">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full py-12">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">autorenew</span>
              </div>
            ) : activeManifest && selectedId ? (
              <MetadataStudio
                manifest={activeManifest}
                projectId={selectedId}
                onManifestChange={setActiveManifest}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8 py-12">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">edit_note</span>
                <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
                  Select a short from the list to edit its metadata, AI rewrite content, and configure platform publishing settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
