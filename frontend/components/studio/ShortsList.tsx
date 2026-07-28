"use client";

import { useMemo, useState } from "react";
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
  x: { icon: FaXTwitter, color: "text-sky-400", label: "Twitter" },
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

function formatDateGroup(dateStr?: string): string {
  if (!dateStr) return "Older Shorts";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Older Shorts";

  const now = new Date();
  const todayStr = now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (date.toDateString() === todayStr) return "Today";
  if (date.toDateString() === yesterdayStr) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function CoverImage({ coverPath, title }: { coverPath: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = diskPathToUrl(coverPath);

  if (!coverUrl || imgError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-white/10 flex flex-col items-center justify-center p-1 text-center relative overflow-hidden">
        <span className="material-symbols-outlined text-indigo-400/80 text-lg mb-0.5">smart_display</span>
        <span className="text-[7px] font-bold text-indigo-200 uppercase tracking-tighter line-clamp-2 opacity-70 leading-tight">
          {title.slice(0, 15)}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverUrl}
      alt={title}
      className="w-full h-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export function ShortsList({ manifests, selectedId, loading, error, onSelect }: ShortsListProps) {
  // Group manifests by date
  const groupedManifests = useMemo(() => {
    const sorted = [...manifests].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    const groups: { [key: string]: ManifestSummary[] } = {};
    for (const m of sorted) {
      const groupKey = formatDateGroup(m.created_at);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(m);
    }
    return groups;
  }, [manifests]);

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
    <div className="flex-1 w-full p-3 space-y-4 overflow-y-auto min-h-0 touch-pan-y pb-28 md:pb-6 no-scrollbar">
      <div className="px-1 pb-1 flex items-center justify-between border-b border-outline-variant/40 pb-2">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
          Shorts Library ({manifests.length})
        </span>
      </div>

      {Object.entries(groupedManifests).map(([groupDate, items]) => (
        <div key={groupDate} className="flex flex-col gap-2">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur-sm py-1.5 px-1 flex items-center justify-between border-b border-outline-variant/30">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
              {groupDate}
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? "video" : "videos"}
            </span>
          </div>

          {/* Cards for this Date */}
          <div className="flex flex-col gap-2">
            {items.map((m) => {
              const isActive = m.id === selectedId;
              const statusStyle = STATUS_STYLES[m.status] ?? { dot: "bg-surface-variant", label: m.status };

              return (
                <button
                  key={m.id}
                  onClick={() => onSelect(m.id)}
                  className={[
                    "w-full text-left rounded-xl border transition-all duration-200 overflow-hidden group",
                    isActive
                      ? "border-primary/80 bg-primary/10 shadow-[0_0_16px_rgba(195,192,255,0.18)]"
                      : "border-outline-variant bg-surface-container hover:bg-surface-container-high hover:border-outline",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3 p-2.5">
                    {/* Cover thumbnail */}
                    <div className="w-14 h-20 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 relative border border-white/5">
                      <CoverImage coverPath={m.cover_path} title={m.title} />
                      {/* duration / 9:16 overlay badge */}
                      <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5 flex items-center gap-0.5">
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
                        <span className="text-[10px] font-medium text-on-surface-variant">{statusStyle.label}</span>
                        <span className="text-[10px] text-on-surface-variant opacity-50">·</span>
                        <span className="text-[10px] text-on-surface-variant">{m.size_mb > 0 ? `${m.size_mb} MB` : "—"}</span>
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
        </div>
      ))}
    </div>
  );
}
