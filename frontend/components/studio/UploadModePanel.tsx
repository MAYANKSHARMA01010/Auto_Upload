"use client";

import { useState } from "react";

export type UploadMode = "direct" | "schedule";
export type PrivacyMode = "private" | "unlisted" | "public";

interface UploadModePanelProps {
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

export function UploadModePanel({
  mode, privacy, scheduleDate, scheduleTime,
  onModeChange, onPrivacyChange, onDateChange, onTimeChange,
  onPublish, onSave, isSaving,
}: UploadModePanelProps) {
  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex rounded-xl border border-outline-variant overflow-hidden">
        <button
          onClick={() => onModeChange("direct")}
          className={[
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all duration-200",
            mode === "direct"
              ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(195,192,255,0.3)]"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          Direct Upload
        </button>
        <button
          onClick={() => onModeChange("schedule")}
          className={[
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all duration-200",
            mode === "schedule"
              ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(195,192,255,0.3)]"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
          Schedule
        </button>
      </div>

      {/* Privacy (both modes) */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Privacy</label>
        <div className="flex gap-2">
          {(["private", "unlisted", "public"] as PrivacyMode[]).map((p) => (
            <button
              key={p}
              onClick={() => onPrivacyChange(p)}
              className={[
                "flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all duration-200 capitalize",
                privacy === p
                  ? "bg-primary/15 border-primary/50 text-primary"
                  : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline",
              ].join(" ")}
            >
              {p === "private" ? "🔒" : p === "unlisted" ? "🔗" : "🌍"} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule options */}
      {mode === "schedule" && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Release Date</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={addDays(0)}
              className="w-full text-xs bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
            />
            {/* Date chips */}
            <div className="flex flex-wrap gap-1.5">
              {DATE_CHIPS.map(({ label, fn }) => (
                <button
                  key={label}
                  onClick={() => onDateChange(fn())}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Release Time</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full text-xs bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
            />
            {/* Time chips */}
            <div className="flex flex-wrap gap-1.5">
              {TIME_CHIPS.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => onTimeChange(value)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {scheduleDate && scheduleTime && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
              <span className="material-symbols-outlined text-primary text-sm">schedule</span>
              <p className="text-[11px] text-primary font-medium">
                Scheduled for{" "}
                {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
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
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 shadow-[0_0_16px_rgba(195,192,255,0.25)] hover:shadow-[0_0_24px_rgba(195,192,255,0.4)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          {mode === "schedule" ? "Schedule" : "Publish Now"}
        </button>
      </div>
    </div>
  );
}
