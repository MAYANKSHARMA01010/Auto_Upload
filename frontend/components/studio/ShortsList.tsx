"use client";

import { ManifestSummary } from "@/types";
import { diskPathToUrl } from "@/lib/manifests";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaXTwitter,
  FaSnapchat,
  FaThreads,
} from "react-icons/fa6";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  ready_to_upload: { dot: "bg-emerald-400", label: "Ready" },
  published: { dot: "bg-blue-400", label: "Published" },
  scheduled: { dot: "bg-amber-400", label: "Scheduled" },
  failed: { dot: "bg-red-500", label: "Failed" },
};

const PLATFORM_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  youtube: { icon: FaYoutube, color: "text-red-500", label: "YouTube" },
  instagram: { icon: FaInstagram, color: "text-pink-500", label: "Instagram" },
  facebook: { icon: FaFacebook, color: "text-blue-500", label: "Facebook" },
  tiktok: { icon: FaTiktok, color: "text-neutral-100", label: "TikTok" },
  x: { icon: FaXTwitter, color: "text-sky-400", label: "X (Twitter)" },
  snapchat: { icon: FaSnapchat, color: "text-yellow-400", label: "Snapchat" },
  threads: { icon: FaThreads, color: "text-neutral-300", label: "Threads" },
};

interface ShortsListProps {
  manifests: ManifestSummary[];
  selectedId: string | null;
  loading: boolean;
  error?: string;
  onSelect: (id: string) => void;
}

export function ShortsList({ manifests, selectedId, loading, error, onSelect }: ShortsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-surface-container animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container/30 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-error text-3xl">folder_off</span>
        </div>
        <h3 className="text-sm font-semibold text-on-surface mb-1">Shorts Not Found</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        <p className="text-xs text-on-surface-variant mt-2 opacity-60">
          Ensure <code className="bg-surface-container px-1 rounded">shorts-factory</code> has rendered videos.
        </p>
      </div>
    );
  }

  if (manifests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">video_library</span>
        </div>
        <h3 className="text-sm font-semibold text-on-surface mb-1">No Shorts Yet</h3>
        <p className="text-xs text-on-surface-variant">Run shorts-factory to generate your first video.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      <div className="px-1 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          Shorts ({manifests.length})
        </span>
      </div>
      {manifests.map((m) => {
        const isActive = m.id === selectedId;
        const statusStyle = STATUS_STYLES[m.status] ?? { dot: "bg-surface-variant", label: m.status };
        const coverUrl = diskPathToUrl(m.cover_path);

        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={[
              "w-full text-left rounded-xl border transition-all duration-200 overflow-hidden group",
              isActive
                ? "border-primary/60 bg-primary/10 shadow-[0_0_16px_rgba(195,192,255,0.15)]"
                : "border-outline-variant bg-surface-container hover:bg-surface-container-high hover:border-outline",
            ].join(" ")}
          >
            <div className="flex items-center gap-3 p-3">
              {/* Cover thumbnail */}
              <div className="w-14 h-20 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 relative">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt={m.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-2xl">movie</span>
                  </div>
                )}
                {/* duration / 9:16 overlay badge */}
                <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-sm rounded px-1 py-0.5 flex items-center gap-0.5">
                  <span className="text-[9px] text-white font-mono font-medium">
                    {m.duration_formatted || "9:16"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate leading-tight mb-1">
                  {m.title.replace(/[🌊🧂🔥💡🎯📈❓🌈✨⚡🧬🌍]/g, "").trim() || m.id}
                </p>
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                  <span className="text-[10px] text-on-surface-variant">{statusStyle.label}</span>
                  <span className="text-[10px] text-on-surface-variant opacity-50">·</span>
                  <span className="text-[10px] text-on-surface-variant">{m.size_mb > 0 ? `${m.size_mb} MB` : "—"}</span>
                  {m.duration_formatted && (
                    <>
                      <span className="text-[10px] text-on-surface-variant opacity-50">·</span>
                      <span className="text-[10px] font-mono text-primary-fixed">{m.duration_formatted}</span>
                    </>
                  )}
                </div>
                {/* Platform SVG icons */}
                <div className="flex items-center gap-2 pt-0.5">
                  {m.platforms_enabled.map((p) => {
                    const plat = PLATFORM_ICONS[p];
                    if (!plat) return null;
                    const IconComp = plat.icon;
                    return (
                      <span key={p} title={plat.label} className={`${plat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Active arrow */}
              {isActive && (
                <span className="material-symbols-outlined text-primary text-base flex-shrink-0">
                  chevron_right
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
