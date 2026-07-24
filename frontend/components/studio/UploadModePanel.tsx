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
  { id: "youtube", label: "YouTube Shorts", icon: FaYoutube, color: "text-red-400" },
  { id: "instagram", label: "Instagram Reels", icon: FaInstagram, color: "text-pink-400" },
  { id: "facebook", label: "Facebook Reels", icon: FaFacebook, color: "text-blue-400" },
  { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "text-on-surface" },
  { id: "x", label: "Twitter", icon: FaXTwitter, color: "text-sky-400" },
  { id: "snapchat", label: "Snapchat", icon: FaSnapchat, color: "text-yellow-400" },
  { id: "threads", label: "Threads", icon: FaThreads, color: "text-on-surface" },
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
  onPublish,
  onSave,
  isSaving,
}: UploadModePanelProps) {
  // Fetch connected accounts from backend API
  const { data: connectedAccounts } = useQuery<ConnectedAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/accounts");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
  });

  // Track selected target account ID for each platform
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  // Track custom schedule per platform (platformId -> "YYYY-MM-DD THH:MM")
  const [customSchedules, setCustomSchedules] = useState<Record<string, { date: string; time: string }>>({});

  const enabledPlatforms = Object.entries(manifest.platforms)
    .filter(([, v]) => (v as any)?.enabled)
    .map(([k]) => k);

  const handleAccountSelect = (platformId: string, accountId: string) => {
    setSelectedAccounts((prev) => ({ ...prev, [platformId]: accountId }));
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

      {/* 4. Target Accounts & Per-Platform Schedule Section */}
      <div className="space-y-3 pt-2 border-t border-outline-variant/60">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Target Accounts & Platform Dispatch ({enabledPlatforms.length} Enabled)
          </label>
          <Link
            href="/accounts"
            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-xs">manage_accounts</span>
            Manage Accounts
          </Link>
        </div>

        {enabledPlatforms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container p-4 text-center space-y-2">
            <span className="material-symbols-outlined text-on-surface-variant text-2xl">apps_outage</span>
            <p className="text-xs text-on-surface font-medium">No platforms enabled</p>
            <p className="text-[10px] text-on-surface-variant">Switch to the Platforms tab to enable social networks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enabledPlatforms.map((platformId) => {
              const def = PLATFORM_DEFS.find((p) => p.id === platformId);
              if (!def) return null;
              const IconComp = def.icon;

              // Filter connected accounts for this specific platform
              const platformAccounts = (connectedAccounts ?? []).filter(
                (acc) => acc.platform.toLowerCase() === platformId.toLowerCase()
              );

              const currentSelected = selectedAccounts[platformId] ?? (platformAccounts[0]?.id || "default");
              const customSched = customSchedules[platformId];

              return (
                <div
                  key={platformId}
                  className="rounded-xl border border-outline-variant bg-surface-container p-3 space-y-3"
                >
                  {/* Header: Icon + Title + Account Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <IconComp className={`w-4 h-4 ${def.color}`} />
                      <span className="text-xs font-semibold text-on-surface">{def.label}</span>
                    </div>

                    {/* Account Dropdown */}
                    {platformAccounts.length > 0 ? (
                      <select
                        value={currentSelected}
                        onChange={(e) => handleAccountSelect(platformId, e.target.value)}
                        className="text-[11px] bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1 text-on-surface focus:outline-none focus:border-primary/60 transition-colors max-w-[170px] truncate"
                      >
                        {platformAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            @{acc.username || acc.platform_user_id || "Connected Account"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Link
                        href="/accounts"
                        className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md hover:bg-amber-400/20 transition-colors flex items-center gap-1 font-medium"
                      >
                        <span className="material-symbols-outlined text-xs">add</span>
                        Connect Account
                      </Link>
                    )}
                  </div>

                  {/* Per-Platform Custom Schedule Overrides (If in Schedule Mode) */}
                  {mode === "schedule" && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/40 text-[10px]">
                      <span className="text-on-surface-variant font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Platform Time:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={customSched?.date || scheduleDate}
                          onChange={(e) => handlePlatformScheduleChange(platformId, "date", e.target.value)}
                          className="bg-surface-container-high border border-outline-variant rounded px-1.5 py-0.5 text-[10px] text-on-surface focus:outline-none"
                        />
                        <input
                          type="time"
                          value={customSched?.time || scheduleTime}
                          onChange={(e) => handlePlatformScheduleChange(platformId, "time", e.target.value)}
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
      {enabledPlatforms.length > 0 && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Ready to Dispatch ({enabledPlatforms.length} Platforms)
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
          disabled={enabledPlatforms.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 shadow-[0_0_16px_rgba(195,192,255,0.25)] hover:shadow-[0_0_24px_rgba(195,192,255,0.4)] transition-all active:scale-95 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          {mode === "schedule" ? "Schedule All" : "Publish Now"}
        </button>
      </div>
    </div>
  );
}
