"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaChartLine,
  FaEye,
  FaThumbsUp,
  FaComment,
  FaUserGroup,
} from "react-icons/fa6";

const PLATFORMS = [
  { id: "youtube", label: "YouTube", icon: FaYoutube, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  { id: "facebook", label: "Facebook Page", icon: FaFacebook, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
];

const CATEGORY_TABS = [
  { id: "all", label: "📊 All Videos & Posts", icon: "dashboard" },
  { id: "published", label: "✅ Published", icon: "check_circle" },
  { id: "scheduled", label: "📅 Scheduled", icon: "schedule" },
  { id: "failed", label: "⚠️ Failed", icon: "error" },
  { id: "draft", label: "📝 Drafts", icon: "edit_note" },
];

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const initialPlatform = searchParams.get("platform") || "youtube";
  const initialAccountId = searchParams.get("account_id") || "";

  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialPlatform);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"7" | "30" | "all">("all");

  useEffect(() => {
    const p = searchParams.get("platform");
    const a = searchParams.get("account_id");
    if (p) setSelectedPlatform(p);
    if (a) setSelectedAccountId(a);
  }, [searchParams]);

  // Fetch social insights for target platform & account
  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ["social-insights", selectedPlatform, selectedAccountId],
    queryFn: async () => {
      const params = new URLSearchParams({ platform: selectedPlatform });
      if (selectedAccountId) params.append("account_id", selectedAccountId);
      const res = await api.get(`/analytics/social-insights?${params.toString()}`);
      return res.data;
    },
  });

  const activePlatObj = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];
  const IconComp = activePlatObj.icon;

  const connectedAccounts = insights?.connected_accounts || [];
  const selectedAccount = insights?.selected_account;
  const accountMetrics = insights?.account_metrics || {};
  const platformMedia = insights?.platform_media || [];
  const localVideos = insights?.videos || [];

  // Merge Local Database Posts (uploaded, scheduled, failed, drafts) with Live Platform Media
  const matchedMediaIds = new Set<string>();

  const mergedUnifiedPosts = localVideos.map((lv: any) => {
    // Attempt to match with live platform media by platform_post_id or id
    const match = platformMedia.find(
      (m: any) => m.id === lv.platform_post_id || m.id === lv.id
    );
    if (match) {
      matchedMediaIds.add(match.id);
    }
    return {
      id: lv.id,
      platform_post_id: lv.platform_post_id || match?.id || "",
      title: lv.title || match?.title || match?.caption || "Untitled Video",
      status: (lv.status || "published").toLowerCase(), // published, scheduled, failed, draft
      published_at: lv.published_at || match?.published_at || lv.scheduled_at,
      scheduled_at: lv.scheduled_at,
      thumbnail_url: match?.thumbnail_url || "",
      views: match?.views ?? 0,
      likes: match?.likes ?? match?.reactions ?? 0,
      comments: match?.comments ?? 0,
      permalink: match?.permalink || (lv.platform_post_id ? `https://www.google.com/search?q=${lv.platform_post_id}` : ""),
      error_message: lv.error_message,
      is_local: true,
    };
  });

  // Append remaining live platform media items not present in local database
  platformMedia.forEach((m: any) => {
    if (!matchedMediaIds.has(m.id)) {
      mergedUnifiedPosts.push({
        id: m.id,
        platform_post_id: m.id,
        title: m.title || m.caption || "Channel Post",
        status: "published",
        published_at: m.published_at,
        scheduled_at: null,
        thumbnail_url: m.thumbnail_url || "",
        views: m.views ?? 0,
        likes: m.likes ?? m.reactions ?? 0,
        comments: m.comments ?? 0,
        permalink: m.permalink || "",
        error_message: null,
        is_local: false,
      });
    }
  });

  // Filter unified posts by category tab & timeframe
  const finalDisplayPosts = mergedUnifiedPosts.filter((post: any) => {
    // 1. Category Filter
    if (selectedCategory !== "all" && post.status !== selectedCategory) {
      return false;
    }

    // 2. Timeframe Filter
    if (timeframe === "all") return true;
    const postDateStr = post.published_at || post.scheduled_at;
    if (!postDateStr) return true;

    try {
      const postTime = new Date(postDateStr).getTime();
      if (isNaN(postTime)) return true;
      const daysLimit = parseInt(timeframe);
      const now = new Date().getTime();
      const diffDays = (now - postTime) / (1000 * 3600 * 24);
      return diffDays <= daysLimit || diffDays < 0;
    } catch {
      return true;
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-28 md:pb-16 min-h-full touch-pan-y">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
            Social Analytics Command Center
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Real-time channel performance, subscriber metrics, and post insights for your connected accounts.
          </p>
        </div>

        {/* Live sync badge & Timeframe picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container border border-outline-variant rounded-xl p-1">
            <button
              onClick={() => setTimeframe("7")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${timeframe === "7" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe("30")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${timeframe === "30" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe("all")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${timeframe === "all" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold">Live OAuth API Connected</span>
          </div>
        </div>
      </div>

      {/* Platform Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/30">
        {PLATFORMS.map((plat) => {
          const PIcon = plat.icon;
          const isActive = selectedPlatform === plat.id;
          return (
            <button
              key={plat.id}
              onClick={() => {
                setSelectedPlatform(plat.id);
                setSelectedAccountId("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/10"
                  : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
              }`}
            >
              <PIcon className={`text-base ${isActive ? "text-on-primary" : plat.color}`} />
              {plat.label}
            </button>
          );
        })}
      </div>

      {/* Connected Account Filter Bar */}
      {connectedAccounts.length > 0 && (
        <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">account_circle</span>
            <span className="text-xs font-bold text-on-surface">Connected Account:</span>
          </div>
          <select
            value={selectedAccountId || selectedAccount?.id || ""}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-surface-container text-on-surface text-xs font-medium px-3 py-1.5 rounded-xl border border-outline-variant focus:outline-none focus:border-primary"
          >
            {connectedAccounts.map((acc: any) => (
              <option key={acc.id} value={acc.id}>
                {acc.username} ({acc.platform.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Channel / Page Hero Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Subscribers / Followers / Page Likes */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {selectedPlatform === "youtube" ? "Subscribers" : selectedPlatform === "instagram" ? "Followers" : "Page Likes"}
            </span>
            <div className={`p-2 rounded-xl border ${activePlatObj.bg}`}>
              <FaUserGroup className={`text-base ${activePlatObj.color}`} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {accountMetrics.subscribers !== undefined
              ? accountMetrics.subscribers.toLocaleString()
              : accountMetrics.followers !== undefined
              ? accountMetrics.followers.toLocaleString()
              : accountMetrics.page_likes !== undefined
              ? accountMetrics.page_likes.toLocaleString()
              : "0"}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">Live from {activePlatObj.label} API</p>
        </div>

        {/* Metric 2: Total Views / Media Count */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {selectedPlatform === "youtube" ? "Total Channel Views" : "Total Posts"}
            </span>
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <FaEye className="text-base text-primary" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {accountMetrics.total_views !== undefined
              ? accountMetrics.total_views.toLocaleString()
              : accountMetrics.total_media !== undefined
              ? accountMetrics.total_media.toLocaleString()
              : mergedUnifiedPosts.length.toLocaleString()}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">Lifetime account engagement</p>
        </div>

        {/* Metric 3: Video Count / Local Uploads */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Uploaded Videos
            </span>
            <div className="p-2 rounded-xl bg-secondary/10 border border-secondary/20">
              <FaChartLine className="text-base text-secondary" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {accountMetrics.video_count !== undefined
              ? accountMetrics.video_count.toLocaleString()
              : mergedUnifiedPosts.length.toLocaleString()}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">Published & scheduled videos</p>
        </div>

        {/* Metric 4: Connected Handle & Status */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Channel Handle
            </span>
            <IconComp className={`text-lg ${activePlatObj.color}`} />
          </div>
          <p className="text-lg font-bold text-on-surface truncate">
            {accountMetrics.title || selectedAccount?.username || "Not Connected"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${selectedAccount ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="text-[11px] text-on-surface-variant font-medium">
              {selectedAccount ? "Connected & Active" : "Select account above"}
            </span>
          </div>
        </div>
      </div>

      {/* Video Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Unified Videos & Posts Performance Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <IconComp className={`text-lg ${activePlatObj.color}`} />
              {activePlatObj.label} Videos & Posts ({selectedCategory.toUpperCase()})
            </h2>
            <p className="text-xs text-on-surface-variant">
              Live view counts, like counts, comment counts, and upload statuses for {activePlatObj.label}.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {finalDisplayPosts.length} Posts
          </span>
        </div>

        {loadingInsights ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
            <p className="text-xs text-on-surface-variant">Fetching live analytics from {activePlatObj.label} API…</p>
          </div>
        ) : finalDisplayPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Video / Post</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Publish / Scheduled Date</th>
                  <th className="py-3 px-4 text-center">Views / Reach</th>
                  <th className="py-3 px-4 text-center">Likes</th>
                  <th className="py-3 px-4 text-center">Comments</th>
                  <th className="py-3 px-4 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {finalDisplayPosts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3 min-w-[240px]">
                      {post.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-surface-container flex flex-col items-center justify-center text-on-surface-variant flex-shrink-0">
                          <IconComp className="text-lg" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface line-clamp-2 leading-tight">
                          {post.title}
                        </p>
                        {post.platform_post_id && (
                          <span className="text-[10px] text-on-surface-variant opacity-70">ID: {post.platform_post_id}</span>
                        )}
                        {post.error_message && (
                          <p className="text-[10px] text-red-400 truncate mt-0.5">{post.error_message}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        post.status === "published"
                          ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                          : post.status === "scheduled"
                          ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                          : post.status === "failed"
                          ? "bg-red-400/10 text-red-400 border border-red-400/20"
                          : "bg-slate-400/10 text-slate-400 border border-slate-400/20"
                      }`}>
                        {post.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant font-mono text-[11px]">
                      {post.published_at || post.scheduled_at
                        ? new Date(post.published_at || post.scheduled_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-on-surface">
                      <span className="flex items-center justify-center gap-1">
                        <FaEye className="text-primary text-xs" />
                        {(post.views ?? 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-on-surface">
                      <span className="flex items-center justify-center gap-1">
                        <FaThumbsUp className="text-emerald-400 text-xs" />
                        {(post.likes ?? 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-on-surface">
                      <span className="flex items-center justify-center gap-1">
                        <FaComment className="text-secondary text-xs" />
                        {(post.comments ?? 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {post.permalink ? (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          View <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">folder_open</span>
            <p className="text-sm font-semibold text-on-surface">No Videos or Posts Found</p>
            <p className="text-xs text-on-surface-variant max-w-sm">
              No posts match the current filter criteria for {activePlatObj.label}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
