"use client";

import { useState, useCallback, useRef } from "react";
import { Manifest } from "@/types";
import { saveManifest, diskPathToUrl } from "@/lib/manifests";
import { AiChips } from "./AiChips";
import { PlatformTabs } from "./PlatformTabs";
import { UploadModePanel, UploadMode, PrivacyMode } from "./UploadModePanel";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface MetadataStudioProps {
  manifest: Manifest;
  projectId: string;
  onManifestChange: (updated: Manifest) => void;
}

type StudioSection = "master" | "platforms" | "publish";

const inputClass =
  "w-full text-xs bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors";

export function MetadataStudio({ manifest, projectId, onManifestChange }: MetadataStudioProps) {
  const { accessToken } = useAuthStore();
  const [activeSection, setActiveSection] = useState<StudioSection>("master");
  const [activePlatformTab, setActivePlatformTab] = useState("youtube");
  const [uploadMode, setUploadMode] = useState<UploadMode>("direct");
  const [privacy, setPrivacy] = useState<PrivacyMode>("private");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save
  const debounceSave = useCallback((updated: Manifest) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await saveManifest(projectId, updated, accessToken ?? undefined);
      if (!ok) toast.error("Auto-save failed — check backend connection");
    }, 900);
  }, [projectId, accessToken]);

  const updateMaster = (key: string, value: any) => {
    const updated: Manifest = {
      ...manifest,
      master_metadata: { ...manifest.master_metadata, [key]: value },
    };
    onManifestChange(updated);
    debounceSave(updated);
  };

  const updatePlatform = (platform: string, key: string, value: any) => {
    const updated: Manifest = {
      ...manifest,
      platforms: {
        ...manifest.platforms,
        [platform]: {
          ...(manifest.platforms[platform as keyof typeof manifest.platforms] as any ?? {}),
          [key]: value,
        },
      },
    };
    onManifestChange(updated);
    debounceSave(updated);
  };

  const togglePlatform = (platform: string, enabled: boolean) => {
    updatePlatform(platform, "enabled", enabled);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    const ok = await saveManifest(projectId, manifest, accessToken ?? undefined);
    setIsSaving(false);
    if (ok) toast.success("✅ Manifest saved to disk");
    else toast.error("Failed to save manifest");
  };

  const handlePublish = () => {
    const enabledPlatforms = Object.entries(manifest.platforms)
      .filter(([, v]) => (v as any)?.enabled)
      .map(([k]) => k);

    if (enabledPlatforms.length === 0) {
      toast.warning("Enable at least one platform in the Platforms tab");
      return;
    }
    if (uploadMode === "schedule" && (!scheduleDate || !scheduleTime)) {
      toast.warning("Set a date and time to schedule");
      return;
    }
    toast.info(`🚀 ${uploadMode === "schedule" ? "Scheduled" : "Publishing"} to: ${enabledPlatforms.join(", ")} — platform integrations coming soon!`);
  };

  const SECTIONS: { id: StudioSection; label: string; icon: string }[] = [
    { id: "master", label: "Master", icon: "tune" },
    { id: "platforms", label: "Platforms", icon: "apps" },
    { id: "publish", label: "Publish", icon: "rocket_launch" },
  ];

  const hashtags = manifest.master_metadata.hashtags ?? [];
  const videoTags = manifest.master_metadata.video_tags ?? [];
  const coverUrl = diskPathToUrl(manifest.assets?.default_cover_path ?? "");

  return (
    <div className="flex flex-col h-full">
      {/* Section Nav */}
      <div className="flex border-b border-outline-variant px-1 flex-shrink-0">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all duration-200",
              activeSection === s.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: activeSection === s.id ? "'FILL' 1" : "'FILL' 0" }}>
              {s.icon}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Master Metadata ─────────────────────────── */}
        {activeSection === "master" && (
          <>
            {/* 1. Title */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Master Title</label>
              <input
                type="text"
                value={manifest.master_metadata.title}
                onChange={(e) => updateMaster("title", e.target.value)}
                className={inputClass}
                maxLength={100}
              />
              <AiChips
                fieldLabel="title"
                currentValue={manifest.master_metadata.title}
                onRewrite={(v) => updateMaster("title", v)}
                chips={[
                  { label: "Catchier", emoji: "🔥", prompt: "Make this short video title more catchy and viral. Keep it under 80 characters." },
                  { label: "Curiosity", emoji: "❓", prompt: "Rewrite this title to spark curiosity — make viewers desperate to watch. Keep under 80 chars." },
                  { label: "High-CPM", emoji: "📈", prompt: "Rewrite for premium advertiser appeal and high CPM. Keep under 80 chars." },
                ]}
              />
            </div>

            {/* 2. Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Description</label>
              <textarea
                value={manifest.master_metadata.description}
                onChange={(e) => updateMaster("description", e.target.value)}
                className={inputClass}
                rows={3}
              />
              <AiChips
                fieldLabel="description"
                currentValue={manifest.master_metadata.description}
                onRewrite={(v) => updateMaster("description", v)}
                chips={[
                  { label: "Call to Action", emoji: "📣", prompt: "Add a compelling call-to-action to this description. Keep it natural." },
                  { label: "SEO Focus", emoji: "🔍", prompt: "Rewrite with strong SEO keywords naturally woven in. Same topic." },
                ]}
              />
            </div>

            {/* 3. Hashtags */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Hashtags</label>
              <input
                type="text"
                value={hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
                onChange={(e) => {
                  const tags = e.target.value.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ""));
                  updateMaster("hashtags", tags);
                }}
                className={inputClass}
                placeholder="#shorts #science #facts"
              />
              {/* Hashtag pills */}
              <div className="flex flex-wrap gap-1 mb-1">
                {hashtags.slice(0, 8).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px]">
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
              <AiChips
                fieldLabel="hashtags"
                currentValue={hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
                onRewrite={(v) => {
                  const tags = v.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ""));
                  updateMaster("hashtags", tags);
                }}
                chips={[
                  { label: "Trending", emoji: "🔥", prompt: "Generate 5 trending viral hashtags for this short video. Include # symbol, space separated." },
                  { label: "Niche", emoji: "🎯", prompt: "Generate 5 specific targeted niche hashtags for this topic. Include # symbol, space separated." },
                  { label: "Viral", emoji: "🚀", prompt: "Generate 5 high-converting YouTube Shorts & Reels hashtags. Include # symbol, space separated." },
                ]}
              />
            </div>

            {/* 4. Video Tags */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Video Tags</label>
              <textarea
                value={videoTags.join(", ")}
                onChange={(e) => {
                  const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                  updateMaster("video_tags", tags);
                }}
                className={inputClass}
                rows={2}
                placeholder="ocean facts, science, why ocean salty"
              />
              <AiChips
                fieldLabel="video tags"
                currentValue={videoTags.join(", ")}
                onRewrite={(v) => {
                  const tags = v.split(",").map((t: string) => t.trim()).filter(Boolean);
                  updateMaster("video_tags", tags);
                }}
                chips={[
                  { label: "High Volume", emoji: "🔥", prompt: "Generate 12 high-search-volume YouTube/SEO tags for this video topic. Return comma-separated single tags only, no # symbol." },
                  { label: "Niche", emoji: "🎯", prompt: "Generate 12 specific long-tail keyword tags for this video. Return comma-separated, no # symbol." },
                ]}
              />
            </div>

            {/* 5. Cover Image Preview Card (Big Size Display) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Default Cover Image</label>
                <span className="text-[10px] text-primary font-mono bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full font-medium">
                  Timestamp: {manifest.assets?.cover_timestamp || "2.0"}s
                </span>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4 flex flex-col items-center gap-3">
                <div className="w-48 h-80 rounded-xl bg-black shadow-xl overflow-hidden relative border border-outline-variant flex items-center justify-center group">
                  {coverUrl && !coverImgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt="Cover image"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => setCoverImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-high text-on-surface-variant gap-2 p-4 text-center">
                      <span className="material-symbols-outlined text-3xl text-primary">movie</span>
                      <p className="text-xs font-semibold text-on-surface">Cover Frame</p>
                      <p className="text-[10px] opacity-70">Select cover frame in Preview column</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md rounded-full px-2 py-0.5">
                    <span className="text-[9px] text-white font-mono font-bold">9:16</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md rounded-md px-2 py-0.5">
                    <span className="text-[9px] text-white font-mono">{manifest.assets?.cover_timestamp || "2.0"}s</span>
                  </div>
                </div>
                <div className="text-center space-y-1 max-w-xs">
                  <p className="text-xs font-medium text-on-surface truncate">
                    {manifest.assets?.default_cover_path?.split("/").pop() || "cover.jpg"}
                  </p>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Primary cover image published across YouTube Shorts, Reels & TikTok.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider for Secondary Info (After Scroll) */}
            <div className="border-t border-outline-variant/60 my-4" />

            {/* 6. Secondary Generation Info (Original Script, Starting Prompt, ID) */}
            <div className="space-y-4 pt-1">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                <span className="material-symbols-outlined text-sm">description</span>
                Generation Script & Prompt Details
              </h4>

              {/* Project Status Banner */}
              <div className="flex items-center gap-2 rounded-lg bg-surface-container border border-outline-variant px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-on-surface-variant truncate font-mono">
                    Project ID: {manifest.project_info.id} · Status: {manifest.project_info.status}
                  </p>
                </div>
              </div>

              {/* Original Script */}
              {manifest.project_info.generation_params?.script && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Original Script</label>
                  <div className="rounded-lg bg-surface-container border border-outline-variant px-3 py-2 max-h-28 overflow-y-auto">
                    <p className="text-[10px] text-on-surface-variant leading-relaxed italic">
                      {manifest.project_info.generation_params.script}
                    </p>
                  </div>
                </div>
              )}

              {/* Starting Prompt */}
              {manifest.project_info.generation_params?.starting_prompt && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Starting Prompt</label>
                  <div className="rounded-lg bg-surface-container border border-outline-variant px-3 py-2 max-h-24 overflow-y-auto">
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      {manifest.project_info.generation_params.starting_prompt}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Platforms ─────────────────────────────── */}
        {activeSection === "platforms" && (
          <PlatformTabs
            manifest={manifest}
            activeTab={activePlatformTab}
            onTabChange={setActivePlatformTab}
            onPlatformChange={updatePlatform}
            onTogglePlatform={togglePlatform}
          />
        )}

        {/* ── Publish ───────────────────────────────── */}
        {activeSection === "publish" && (
          <UploadModePanel
            manifest={manifest}
            mode={uploadMode}
            privacy={privacy}
            scheduleDate={scheduleDate}
            scheduleTime={scheduleTime}
            onModeChange={setUploadMode}
            onPrivacyChange={setPrivacy}
            onDateChange={setScheduleDate}
            onTimeChange={setScheduleTime}
            onPublish={handlePublish}
            onSave={handleManualSave}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Footer auto-save indicator */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
        <span className="material-symbols-outlined text-emerald-400 text-xs">radio_button_checked</span>
        <span className="text-[10px] text-on-surface-variant">Auto-save active · edits sync to disk</span>
      </div>
    </div>
  );
}
