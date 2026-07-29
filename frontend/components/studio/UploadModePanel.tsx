"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/axios";
import { ConnectedAccount, Manifest } from "@/types";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaXTwitter,
  FaSnapchat,
  FaThreads,
} from "react-icons/fa6";

export type UploadMode = "direct" | "schedule";
export type PrivacyMode = "private" | "unlisted" | "public";

interface UploadModePanelProps {
  manifest: Manifest;
  mode: UploadMode;
  privacy: PrivacyMode;
  scheduleDate: string;
  scheduleTime: string;
  onModeChange: (m: UploadMode) => void;
  onPrivacyChange: (p: PrivacyMode) => void;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onPublish: () => void;
  onSave: () => void;
  isSaving: boolean;
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const TIME_CHIPS = [
  { label: "9 AM", value: "09:00" },
  { label: "12 PM", value: "12:00" },
  { label: "6 PM", value: "18:00" },
  { label: "8 PM", value: "20:00" },
];

const DATE_CHIPS = [
  { label: "Today", fn: () => addDays(0) },
  { label: "Tomorrow", fn: () => addDays(1) },
  { label: "In 2 Days", fn: () => addDays(2) },
  { label: "In 7 Days", fn: () => addDays(7) },
];

const PLATFORM_DEFS = [
  {
    id: "youtube",
    label: "YouTube",
    icon: FaYoutube,
    color: "text-red-400",
    iconContainerBg: "bg-red-500/20 border border-red-500/30",
    barColor: "bg-red-500",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: FaInstagram,
    color: "text-pink-400",
    iconContainerBg: "bg-pink-500/20 border border-pink-500/30",
    barColor: "bg-pink-500",
  },
  {
    id: "facebook",
    label: "Facebook Page",
    icon: FaFacebook,
    color: "text-blue-400",
    iconContainerBg: "bg-blue-500/20 border border-blue-500/30",
    barColor: "bg-blue-500",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: FaTiktok,
    color: "text-on-surface",
    iconContainerBg: "bg-neutral-700/30 border border-neutral-600/30",
    barColor: "bg-neutral-400",
  },
  {
    id: "x",
    label: "Twitter (X)",
    icon: FaXTwitter,
    color: "text-sky-400",
    iconContainerBg: "bg-sky-500/20 border border-sky-500/30",
    barColor: "bg-sky-500",
  },
  {
    id: "snapchat",
    label: "Snapchat",
    icon: FaSnapchat,
    color: "text-yellow-400",
    iconContainerBg: "bg-yellow-500/20 border border-yellow-500/30",
    barColor: "bg-yellow-400",
  },
  {
    id: "threads",
    label: "Threads",
    icon: FaThreads,
    color: "text-on-surface",
    iconContainerBg: "bg-neutral-600/30 border border-neutral-500/30",
    barColor: "bg-neutral-400",
  },
];

export function UploadModePanel({
  manifest,
  mode,
  privacy,
  scheduleDate,
  scheduleTime,
  onModeChange,
  onPrivacyChange,
  onDateChange,
  onTimeChange,
  onTogglePlatform,
  onPublish,
  onSave,
  isSaving,
}: UploadModePanelProps & { onTogglePlatform?: (platform: string, enabled: boolean) => void }) {
  // Fetch connected accounts from backend API (staleTime 5 minutes to prevent duplicate refetches)
  const { data: connectedAccounts = [] } = useQuery<ConnectedAccount[]>({
    queryKey: ["accounts"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      try {
        const res = await api.get("/accounts");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
  });

  // Track checked account IDs (initially EMPTY so ALL accounts start UNCHECKED by default)
  const [checkedAccountIds, setCheckedAccountIds] = useState<Set<string>>(new Set());
  // Active platform filter pill ("all", "youtube", "instagram", "facebook", "tiktok", "x", "snapchat", "threads")
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("all");
  // Track custom schedule per platform (platformId -> "YYYY-MM-DD THH:MM")
  const [customSchedules, setCustomSchedules] = useState<Record<string, { date: string; time: string }>>({});

  // Toggle account checked state
  const toggleAccountChecked = (platformId: string, accountId: string) => {
    setCheckedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }

      // Check if at least one account for this platform is checked
      const platformAccounts = connectedAccounts.filter(
        (acc) => acc.platform.toLowerCase() === platformId.toLowerCase()
      );
      const isPlatformEnabled = platformAccounts.some((acc) => next.has(acc.id));
      onTogglePlatform?.(platformId, isPlatformEnabled);

      return next;
    });
  };

  const handlePlatformScheduleChange = (platformId: string, field: "date" | "time", val: string) => {
    setCustomSchedules((prev) => ({
      ...prev,
      [platformId]: {
        date: prev[platformId]?.date ?? scheduleDate,
        time: prev[platformId]?.time ?? scheduleTime,
        [field]: val,
      },
    }));
  };

  // Filter connected accounts based on active platform filter pill (Image 2)
  const filteredAccounts = connectedAccounts.filter((acc) => {
    if (activePlatformFilter === "all") return true;
    return acc.platform.toLowerCase() === activePlatformFilter.toLowerCase();
  });

  // Sort connected accounts: SELECTED/CHECKED FIRST, then A-Z ALPHABETICALLY by handle/username!
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    const aSelected = checkedAccountIds.has(a.id);
    const bSelected = checkedAccountIds.has(b.id);
    if (aSelected && !bSelected) return -1; // Selected at top!
    if (!aSelected && bSelected) return 1;
    const nameA = (a.username || a.handle || a.platform_user_id || "").toLowerCase();
    const nameB = (b.username || b.handle || b.platform_user_id || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const checkedCount = checkedAccountIds.size;

  return (
    <div className="space-y-5">
      {/* 1. Mode Switcher */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Publication Strategy</label>
        <div className="flex rounded-xl border border-outline-variant overflow-hidden p-1 bg-surface-container">
          <button
            onClick={() => onModeChange("direct")}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
              mode === "direct"
                ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(195,192,255,0.3)]"
                : "text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Direct Upload
          </button>
          <button
            onClick={() => onModeChange("schedule")}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
              mode === "schedule"
                ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(195,192,255,0.3)]"
                : "text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            Schedule
          </button>
        </div>
      </div>

      {/* 2. Global Schedule Options */}
      {mode === "schedule" && (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-3 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">event</span>
              Master Release Schedule
            </label>
            <span className="text-[9px] text-on-surface-variant">Applies to all platforms by default</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-on-surface-variant font-medium">Release Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={addDays(0)}
                className="w-full text-xs bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-on-surface-variant font-medium">Release Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full text-xs bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {DATE_CHIPS.map(({ label, fn }) => (
              <button
                key={label}
                onClick={() => onDateChange(fn())}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all"
              >
                {label}
              </button>
            ))}
            {TIME_CHIPS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => onTimeChange(value)}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Global Privacy Setting */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Visibility & Privacy</label>
        <div className="flex gap-2">
          {(["private", "unlisted", "public"] as PrivacyMode[]).map((p) => (
            <button
              key={p}
              onClick={() => onPrivacyChange(p)}
              className={[
                "flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 capitalize flex items-center justify-center gap-1",
                privacy === p
                  ? "bg-primary/15 border-primary/50 text-primary"
                  : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline",
              ].join(" ")}
            >
              <span>{p === "private" ? "🔒" : p === "unlisted" ? "🔗" : "🌍"}</span>
              <span>{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Target Accounts Section */}
      <div className="space-y-3 pt-2 border-t border-outline-variant/60">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Target Accounts & Platform Dispatch ({checkedCount} Selected)
          </label>
          <Link
            href="/accounts"
            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-xs">manage_accounts</span>
            Manage Accounts
          </Link>
        </div>

        {/* ── Platform Filter Pills (Matching Image 2) ────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {/* All Pill */}
          <button
            type="button"
            onClick={() => setActivePlatformFilter("all")}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0",
              activePlatformFilter === "all"
                ? "bg-primary/20 border-primary text-primary shadow-sm"
                : "bg-surface-container/80 border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-sm">equalizer</span>
            <span>All</span>
            <span className="text-[10px] font-mono opacity-80 bg-surface-container-high px-1.5 py-0.2 rounded-full">
              {connectedAccounts.length}
            </span>
          </button>

          {/* Individual Platform Pills */}
          {PLATFORM_DEFS.map((def) => {
            const IconComp = def.icon;
            const platformCount = connectedAccounts.filter(
              (acc) => acc.platform.toLowerCase() === def.id.toLowerCase()
            ).length;
            const isSelected = activePlatformFilter.toLowerCase() === def.id.toLowerCase();

            return (
              <button
                key={def.id}
                type="button"
                onClick={() => setActivePlatformFilter(def.id)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0",
                  isSelected
                    ? "bg-primary/20 border-primary text-primary shadow-sm"
                    : "bg-surface-container/80 border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface",
                ].join(" ")}
              >
                <IconComp className={`w-3.5 h-3.5 ${def.color}`} />
                <span>{def.label.split(" ")[0]}</span>
                {platformCount > 0 && (
                  <span className="text-[10px] font-mono opacity-80 bg-surface-container-high px-1.5 py-0.2 rounded-full">
                    {platformCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Connected Account Cards Grid (Matching User Screenshot Exactly) ───── */}
        {sortedAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container/40 p-6 text-center space-y-2">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">manage_accounts</span>
            <p className="text-xs text-on-surface font-semibold">No accounts found</p>
            <p className="text-[10px] text-on-surface-variant">
              Connect target accounts on the Accounts page to dispatch videos.
            </p>
            <Link
              href="/accounts"
              className="inline-flex items-center gap-1 text-[11px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors font-medium mt-1"
            >
              + Connect Accounts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedAccounts.map((account) => {
              const def = PLATFORM_DEFS.find((p) => p.id.toLowerCase() === account.platform.toLowerCase()) ?? {
                id: account.platform,
                label: account.platform,
                icon: FaYoutube,
                color: "text-primary",
                iconContainerBg: "bg-primary/20 border border-primary/30",
                barColor: "bg-primary",
              };
              const IconComp = def.icon;
              const isChecked = checkedAccountIds.has(account.id);
              const customSched = customSchedules[account.platform];

              return (
                <div
                  key={account.id}
                  onClick={() => toggleAccountChecked(account.platform, account.id)}
                  className={[
                    "group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 space-y-3.5 bg-black/40",
                    isChecked
                      ? "border-primary/80 bg-primary/10 shadow-[0_0_20px_rgba(195,192,255,0.18)] ring-1 ring-primary/40"
                      : "border-outline-variant/60 bg-surface-container/60 hover:border-outline hover:bg-surface-container opacity-85 hover:opacity-100",
                  ].join(" ")}
                >
                  {/* Top Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${def.barColor}`} />

                  {/* Top Row: Checkbox + Glowing Green Active Dot */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleAccountChecked(account.platform, account.id);
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/40 cursor-pointer accent-indigo-500"
                      />
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {isChecked ? "Selected" : "Unchecked"}
                      </span>
                    </div>

                    {/* Shiny Emerald Active Dot */}
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2.5 w-2.5 items-center justify-center" title="Account Connected">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      </span>
                    </div>
                  </div>

                  {/* Middle Section: Circular Platform Icon + Name & Username (Matching Screenshot Layout) */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${def.iconContainerBg}`}>
                      <IconComp className={`w-5 h-5 ${def.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-on-surface-variant/80 uppercase tracking-wide">
                        {def.label}
                      </p>
                      <h4 className="text-sm font-bold text-on-surface truncate leading-tight">
                        {account.username || "Connected Account"}
                      </h4>
                    </div>
                  </div>

                  {/* Handle Pill Badge (Matching Screenshot `@choleebhaturer`) */}
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high border border-outline-variant/40 text-primary">
                      @{ (account.handle || account.username || "account").replace(/^@+/, "") }
                    </span>
                  </div>

                  {/* Email or Subtitle info line */}
                  <div className="text-[10px] text-on-surface-variant/70 flex items-center gap-1 truncate">
                    {account.email ? (
                      <>
                        <span>📧</span>
                        <span className="truncate">{account.email}</span>
                      </>
                    ) : (
                      <>
                        <span>•</span>
                        <span>Connected via OAuth</span>
                      </>
                    )}
                  </div>

                  {/* Bottom Bar: Platform User ID truncated on left + Selection Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-[10px]">
                    <span className="font-mono text-on-surface-variant/50 truncate max-w-[120px]">
                      {account.platform_user_id || account.id}
                    </span>
                    <span
                      className={[
                        "px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all",
                        isChecked
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-high text-on-surface-variant border border-outline-variant/40",
                      ].join(" ")}
                    >
                      {isChecked ? "✓ Selected" : "Select Card"}
                    </span>
                  </div>

                  {/* Per-Platform Custom Schedule Overrides (If in Schedule Mode & Checked) */}
                  {mode === "schedule" && isChecked && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/40 text-[10px]"
                    >
                      <span className="text-on-surface-variant font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">schedule</span>
                        Platform Time:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={customSched?.date || scheduleDate}
                          onChange={(e) => handlePlatformScheduleChange(account.platform, "date", e.target.value)}
                          className="bg-surface-container-high border border-outline-variant rounded px-1.5 py-0.5 text-[10px] text-on-surface focus:outline-none"
                        />
                        <input
                          type="time"
                          value={customSched?.time || scheduleTime}
                          onChange={(e) => handlePlatformScheduleChange(account.platform, "time", e.target.value)}
                          className="bg-surface-container-high border border-outline-variant rounded px-1.5 py-0.5 text-[10px] text-on-surface focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Summary Banner */}
      {checkedCount > 0 ? (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Ready to Dispatch ({checkedCount} Selected Accounts)
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20">
              {mode === "schedule" ? "Scheduled" : "Instant Direct"}
            </span>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            {mode === "schedule"
              ? `Shorts will be queued for automatic dispatch on ${scheduleDate || "set date"} at ${scheduleTime || "set time"}.`
              : "Shorts will be uploaded immediately to all selected accounts."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-container border border-outline-variant/60 p-3 text-center space-y-1">
          <p className="text-xs font-medium text-on-surface-variant">No target accounts checked</p>
          <p className="text-[10px] text-on-surface-variant opacity-75">Check one or more target accounts above to enable dispatch.</p>
        </div>
      )}

      {/* 6. Save & Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-xs font-semibold hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm">save</span>
          )}
          {isSaving ? "Saving…" : "Save Manifest"}
        </button>
        <button
          onClick={onPublish}
          disabled={checkedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 shadow-[0_0_16px_rgba(195,192,255,0.25)] hover:shadow-[0_0_24px_rgba(195,192,255,0.4)] transition-all active:scale-95 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          {mode === "schedule" ? "Schedule All" : "Publish Now"}
        </button>
      </div>
    </div>
  );
}
