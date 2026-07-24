"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/axios";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaXTwitter,
  FaSnapchat,
  FaThreads,
} from "react-icons/fa6";

const PLATFORM_SELECTORS = [
  { id: "youtube", label: "YouTube", icon: FaYoutube, color: "text-red-400 border-red-400/30 bg-red-400/10", active: "bg-red-500/20 border-red-400/60 text-red-300" },
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-400 border-pink-400/30 bg-pink-400/10", active: "bg-pink-500/20 border-pink-400/60 text-pink-300" },
  { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "text-on-surface border-outline-variant bg-surface-container", active: "bg-surface-container-high border-outline text-on-surface" },
  { id: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-400 border-blue-400/30 bg-blue-400/10", active: "bg-blue-500/20 border-blue-400/60 text-blue-300" },
  { id: "x", label: "Twitter (X)", icon: FaXTwitter, color: "text-sky-400 border-sky-400/30 bg-sky-400/10", active: "bg-sky-500/20 border-sky-400/60 text-sky-300" },
  { id: "snapchat", label: "Snapchat", icon: FaSnapchat, color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", active: "bg-yellow-500/20 border-yellow-400/60 text-yellow-300" },
  { id: "threads", label: "Threads", icon: FaThreads, color: "text-on-surface border-outline-variant bg-surface-container", active: "bg-surface-container-high border-outline text-on-surface" },
];

export default function SocialInsightsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["social-insights", selectedPlatform, selectedAccountId],
    queryFn: async () => {
      const url = selectedAccountId
        ? `/analytics/social-insights?platform=${selectedPlatform}&account_id=${selectedAccountId}`
        : `/analytics/social-insights?platform=${selectedPlatform}`;
      const res = await api.get(url);
      return res.data;
    },
  });

  const connectedAccounts = data?.connected_accounts ?? [];
  const selectedAccount = data?.selected_account;
  const stats = data?.stats ?? { total_posts: 0, published: 0, scheduled: 0, failed: 0, drafts: 0 };
  const videos = data?.videos ?? [];

  const currentDef = PLATFORM_SELECTORS.find((p) => p.id === selectedPlatform);

  return (
    <div className="p-6 pb-12 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              insights
            </span>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Social Insights</h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Dynamic account analytics & performance statistics directly from your connected social accounts.
          </p>
        </div>
      </div>

      {/* Platform Selector Bar */}
      <div className="flex flex-wrap gap-2">
        {PLATFORM_SELECTORS.map((p) => {
          const isActive = selectedPlatform === p.id;
          const IconComp = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlatform(p.id);
                setSelectedAccountId("");
              }}
              className={[
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200",
                isActive ? p.active : p.color,
              ].join(" ")}
            >
              <IconComp className="w-4 h-4" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Account Selector Bar (If connected accounts exist for this platform) */}
      <div className="rounded-2xl border border-outline-variant bg-surface-container p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {currentDef?.label} Accounts ({connectedAccounts.length})
            </span>
          </div>

          {connectedAccounts.length > 0 ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-on-surface-variant font-medium">Select Account:</label>
              <select
                value={selectedAccountId || selectedAccount?.id || ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="text-xs bg-surface-container-high border border-outline-variant rounded-xl px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
              >
                {connectedAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    @{acc.username || acc.platform_user_id || "Connected Account"}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Link
              href="/accounts"
              className="text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all inline-flex items-center gap-1.5 font-semibold"
            >
              <span className="material-symbols-outlined text-sm">add_link</span>
              Connect {currentDef?.label} Account
            </Link>
          )}
        </div>

        {/* Selected Account Detail Banner */}
        {selectedAccount ? (
          <div className="flex items-center justify-between bg-surface-container-high/40 rounded-xl p-3 border border-outline-variant/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {selectedAccount.username?.substring(1, 3).toUpperCase() || "AC"}
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">@{selectedAccount.username}</p>
                <p className="text-[10px] font-mono text-on-surface-variant">Account ID: {selectedAccount.id}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">
              ● Active Connection
            </span>
          </div>
        ) : (
          <div className="p-4 text-center rounded-xl bg-surface-container-high/20 border border-dashed border-outline-variant text-on-surface-variant text-xs">
            No connected {currentDef?.label} account selected. Click &quot;Connect Account&quot; to authorize an account.
          </div>
        )}
      </div>

      {/* Dynamic Account Metrics Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">analytics</span>
          Database Post Metrics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-outline-variant bg-surface-container p-4 space-y-1">
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Scheduled/Posted</p>
            <p className="text-2xl font-black text-on-surface">{stats.total_posts}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 space-y-1">
            <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Published</p>
            <p className="text-2xl font-black text-emerald-400">{stats.published}</p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-1">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Scheduled</p>
            <p className="text-2xl font-black text-primary">{stats.scheduled}</p>
          </div>
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/5 p-4 space-y-1">
            <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Failed / Error</p>
            <p className="text-2xl font-black text-rose-400">{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Posts & Videos Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">video_library</span>
            Account Posts & Video Dispatch Log ({videos.length})
          </h3>
          {videos.length > 0 && (
            <Link href="/shorts-factory" className="text-xs text-primary hover:underline font-semibold">
              + Dispatch New Short
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="h-40 rounded-2xl bg-surface-container border border-outline-variant animate-pulse" />
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">smart_display</span>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-bold text-on-surface">No posts dispatched yet for this account</p>
              <p className="text-xs text-on-surface-variant">
                Schedule or publish videos using Shorts Factory to track real-time dispatch analytics.
              </p>
            </div>
            <Link
              href="/shorts-factory"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Go to Shorts Factory
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant bg-surface-container overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-high/40 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3 px-4">Content Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Target Schedule</th>
                    <th className="py-3 px-4 text-right">Published At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 text-xs">
                  {videos.map((vid: any) => (
                    <tr key={vid.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-on-surface">{vid.title}</td>
                      <td className="py-3 px-4">
                        <span
                          className={[
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                            vid.status === "published"
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : vid.status === "scheduled"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-rose-400/10 text-rose-400 border-rose-400/20",
                          ].join(" ")}
                        >
                          {vid.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                        {vid.scheduled_at ? new Date(vid.scheduled_at).toLocaleString() : "Immediate"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-on-surface-variant">
                        {vid.published_at ? new Date(vid.published_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
