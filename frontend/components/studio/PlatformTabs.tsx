"use client";

import { useState, useEffect } from "react";
import { Manifest } from "@/types";
import { diskPathToUrl } from "@/lib/manifests";
import { AiChips } from "./AiChips";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaXTwitter,
  FaSnapchat,
  FaThreads,
} from "react-icons/fa6";

interface PlatformTabsProps {
  manifest: Manifest;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlatformChange: (platform: string, key: string, value: any) => void;
  onTogglePlatform: (platform: string, enabled: boolean) => void;
}

const PLATFORM_DEFS = [
  {
    id: "youtube" as const,
    label: "YouTube",
    icon: FaYoutube,
    color: "text-red-400 border-red-400/30 bg-red-400/10",
    activeColor: "bg-red-500/20 border-red-400/60 text-red-300",
  },
  {
    id: "instagram" as const,
    label: "Instagram",
    icon: FaInstagram,
    color: "text-pink-400 border-pink-400/30 bg-pink-400/10",
    activeColor: "bg-pink-500/20 border-pink-400/60 text-pink-300",
  },
  {
    id: "facebook" as const,
    label: "Facebook",
    icon: FaFacebook,
    color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    activeColor: "bg-blue-500/20 border-blue-400/60 text-blue-300",
  },
  {
    id: "tiktok" as const,
    label: "TikTok",
    icon: FaTiktok,
    color: "text-on-surface border-outline-variant bg-surface-container",
    activeColor: "bg-surface-container-high border-outline text-on-surface",
  },
  {
    id: "x" as const,
    label: "Twitter",
    icon: FaXTwitter,
    color: "text-sky-400 border-sky-400/30 bg-sky-400/10",
    activeColor: "bg-sky-500/20 border-sky-400/60 text-sky-300",
  },
  {
    id: "snapchat" as const,
    label: "Snapchat",
    icon: FaSnapchat,
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    activeColor: "bg-yellow-500/20 border-yellow-400/60 text-yellow-300",
  },
  {
    id: "threads" as const,
    label: "Threads",
    icon: FaThreads,
    color: "text-on-surface border-outline-variant bg-surface-container",
    activeColor: "bg-surface-container-high border-outline text-on-surface",
  },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full text-xs bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors resize-none";

function HashtagField({
  platformId,
  value,
  onChange,
}: {
  platformId: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [raw, setRaw] = useState(value.map((h) => `#${h.replace(/^#/, "")}`).join(" "));

  useEffect(() => {
    setRaw(value.map((h) => `#${h.replace(/^#/, "")}`).join(" "));
  }, [value]);

  const handleBlur = () => {
    const tags = raw.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ""));
    onChange(tags);
  };

  const currentStr = value.map((h) => `#${h.replace(/^#/, "")}`).join(" ");

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        placeholder="#tag1 #tag2 #tag3"
        className={inputClass}
      />
      <AiChips
        fieldLabel={`${platformId} hashtags`}
        currentValue={currentStr}
        onRewrite={(v) => {
          const tags = v.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ""));
          setRaw(tags.map((h) => `#${h.replace(/^#/, "")}`).join(" "));
          onChange(tags);
        }}
        chips={[
          { label: "Trending", emoji: "🔥", prompt: `Generate 5 trending viral hashtags for ${platformId}. Include # symbol, space separated.` },
          { label: "Niche", emoji: "🎯", prompt: `Generate 5 specific targeted niche hashtags for ${platformId}. Include # symbol, space separated.` },
        ]}
      />
    </div>
  );
}

function ToggleOption({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/40 last:border-0">
      <div>
        <p className="text-[11px] font-semibold text-on-surface">{label}</p>
        {description && <p className="text-[9px] text-on-surface-variant leading-tight">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          "relative w-8 h-4 rounded-full transition-all duration-300 flex-shrink-0",
          value ? "bg-primary" : "bg-surface-container-high border border-outline-variant",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300",
            value ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function PlatformCoverSection({
  platformName,
  platformCoverPath,
  defaultCoverPath,
  coverTimestamp,
  onChangeCoverPath,
}: {
  platformName: string;
  platformCoverPath: string | undefined;
  defaultCoverPath: string;
  coverTimestamp: string;
  onChangeCoverPath: (path: string) => void;
}) {
  const isUsingDefault = !platformCoverPath || platformCoverPath === defaultCoverPath;
  const currentCoverUrl = diskPathToUrl(isUsingDefault ? defaultCoverPath : platformCoverPath);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [platformCoverPath, defaultCoverPath]);

  return (
    <div className="space-y-2 pt-3 border-t border-outline-variant/60">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
          Cover Image ({platformName})
        </label>
        <span className="text-[10px] text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
          {isUsingDefault ? "Master Default" : "Custom Platform Cover"}
        </span>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-high/40 p-3 space-y-3">
        {/* Toggle option: Default vs Custom */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeCoverPath(defaultCoverPath)}
            className={[
              "flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1.5",
              isUsingDefault
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            <span>Use Default Cover</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isUsingDefault) onChangeCoverPath(defaultCoverPath);
            }}
            className={[
              "flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1.5",
              !isUsingDefault
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-xs">tune</span>
            <span>Use Custom Cover</span>
          </button>
        </div>

        {/* Cover Preview & Path Detail */}
        <div className="flex items-center gap-3 bg-surface-container border border-outline-variant/60 rounded-lg p-2">
          <div className="w-10 h-14 rounded-md bg-black overflow-hidden flex-shrink-0 relative border border-outline-variant flex items-center justify-center">
            {currentCoverUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentCoverUrl}
                alt={`${platformName} Cover`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-sm">movie</span>
              </div>
            )}
            <div className="absolute bottom-0.5 right-0.5 bg-black/80 rounded px-1 text-[7px] text-white font-mono">
              {coverTimestamp || "2.0"}s
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-on-surface truncate mb-0.5">
              {(isUsingDefault ? defaultCoverPath : platformCoverPath)?.split("/").pop() || "cover.jpg"}
            </p>
            <p className="text-[10px] text-on-surface-variant leading-tight">
              {isUsingDefault
                ? "Inherits master cover image. Toggle custom to set platform-specific cover."
                : `Custom cover image active for ${platformName}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformTabs({ manifest, activeTab, onTabChange, onPlatformChange, onTogglePlatform }: PlatformTabsProps) {
  const platforms = manifest.platforms;
  const activePlatform = platforms[activeTab as keyof typeof platforms] as any;
  const isEnabled = activePlatform?.enabled ?? false;

  const defaultCoverPath = manifest.assets?.default_cover_path ?? "";
  const coverTimestamp = manifest.assets?.cover_timestamp ?? "2.0";

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {PLATFORM_DEFS.map((p) => {
          const pConf = platforms[p.id as keyof typeof platforms] as any;
          const enabled = pConf?.enabled ?? false;
          const isActive = activeTab === p.id;
          const IconComp = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onTabChange(p.id)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all duration-200",
                isActive ? p.activeColor : p.color,
                "relative",
              ].join(" ")}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{p.label}</span>
              {enabled && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-surface-container" />
              )}
            </button>
          );
        })}
      </div>

      {/* Platform editor */}
      {activePlatform && (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4 space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              {(() => {
                const currentDef = PLATFORM_DEFS.find((p) => p.id === activeTab);
                if (!currentDef) return null;
                const IconComp = currentDef.icon;
                return <IconComp className="w-4 h-4 text-primary" />;
              })()}
              <span className="text-sm font-semibold text-on-surface">
                {PLATFORM_DEFS.find((p) => p.id === activeTab)?.label}
              </span>
            </div>
            <button
              onClick={() => onTogglePlatform(activeTab, !isEnabled)}
              className={[
                "relative w-10 h-5 rounded-full transition-all duration-300",
                isEnabled ? "bg-primary" : "bg-surface-container-high border border-outline-variant",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300",
                  isEnabled ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>

          {/* YouTube fields */}
          {activeTab === "youtube" && (
            <>
              <FieldRow label="Title">
                <input
                  type="text"
                  value={activePlatform.title ?? ""}
                  onChange={(e) => onPlatformChange("youtube", "title", e.target.value)}
                  className={inputClass}
                  maxLength={100}
                />
                <AiChips
                  fieldLabel="YouTube title"
                  currentValue={activePlatform.title ?? ""}
                  onRewrite={(v) => onPlatformChange("youtube", "title", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this YouTube Short title more attention-grabbing and clickable. Keep it under 100 chars." },
                    { label: "Curiosity", emoji: "❓", prompt: "Rewrite this title to create curiosity and make viewers want to watch. Keep under 100 chars." },
                    { label: "High-CPM", emoji: "📈", prompt: "Rewrite for high CPM — use words that signal premium audience intent. Keep under 100 chars." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Description">
                <textarea
                  value={activePlatform.description ?? ""}
                  onChange={(e) => onPlatformChange("youtube", "description", e.target.value)}
                  className={inputClass}
                  rows={4}
                />
                <AiChips
                  fieldLabel="YouTube description"
                  currentValue={activePlatform.description ?? ""}
                  onRewrite={(v) => onPlatformChange("youtube", "description", v)}
                  chips={[
                    { label: "Call to Action", emoji: "📣", prompt: "Add a strong call-to-action to this YouTube description. Keep natural and not spammy." },
                    { label: "SEO Focus", emoji: "🔍", prompt: "Rewrite this YouTube description with SEO keywords naturally woven in. Target the same topic." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="YouTube"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("youtube", "hashtags", v)}
                />
              </FieldRow>
              <FieldRow label="Video Tags">
                <textarea
                  value={(activePlatform.video_tags ?? []).join(", ")}
                  onChange={(e) => onPlatformChange("youtube", "video_tags", e.target.value.split(",").map((t: string) => t.trim()))}
                  className={inputClass}
                  rows={2}
                  placeholder="tag1, tag2, tag3"
                />
                <AiChips
                  fieldLabel="YouTube tags"
                  currentValue={(activePlatform.video_tags ?? []).join(", ")}
                  onRewrite={(v) => onPlatformChange("youtube", "video_tags", v.split(",").map((t: string) => t.trim()))}
                  chips={[
                    { label: "High Volume", emoji: "🔥", prompt: "Generate 10 high-search-volume YouTube tags for this video topic. Return comma-separated." },
                    { label: "Niche Keywords", emoji: "🎯", prompt: "Generate 10 specific niche YouTube tags for this video. Return comma-separated." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Privacy">
                <select
                  value={activePlatform.privacy ?? "private"}
                  onChange={(e) => onPlatformChange("youtube", "privacy", e.target.value)}
                  className={inputClass}
                >
                  <option value="private">🔒 Private</option>
                  <option value="unlisted">🔗 Unlisted</option>
                  <option value="public">🌍 Public</option>
                </select>
              </FieldRow>

              {/* YouTube Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">YouTube Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload in High Quality (HD)"
                    description="Upload video stream using maximum bitrate and resolution"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("youtube", "upload_hd", v)}
                  />
                  <ToggleOption
                    label="Made for Kids"
                    description="Comply with COPPA regulations (restricts comments & personalized ads)"
                    value={activePlatform.made_for_kids ?? false}
                    onChange={(v) => onPlatformChange("youtube", "made_for_kids", v)}
                  />
                  <ToggleOption
                    label="Notify Subscribers"
                    description="Publish a notification to your channel subscriber feed"
                    value={activePlatform.notify_subscribers ?? true}
                    onChange={(v) => onPlatformChange("youtube", "notify_subscribers", v)}
                  />
                  <ToggleOption
                    label="Allow Comments"
                    description="Enable viewers to leave comments on this video"
                    value={activePlatform.allow_comments ?? true}
                    onChange={(v) => onPlatformChange("youtube", "allow_comments", v)}
                  />
                  <ToggleOption
                    label="Allow Embedding"
                    description="Allow third-party websites to embed this Short"
                    value={activePlatform.allow_embedding ?? true}
                    onChange={(v) => onPlatformChange("youtube", "allow_embedding", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="YouTube"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("youtube", "cover_path", p)}
              />
            </>
          )}

          {/* Instagram fields */}
          {activeTab === "instagram" && (
            <>
              <FieldRow label="Caption">
                <textarea
                  value={activePlatform.caption ?? ""}
                  onChange={(e) => onPlatformChange("instagram", "caption", e.target.value)}
                  className={inputClass}
                  rows={5}
                />
                <AiChips
                  fieldLabel="Instagram caption"
                  currentValue={activePlatform.caption ?? ""}
                  onRewrite={(v) => onPlatformChange("instagram", "caption", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this Instagram Reels caption more engaging and hook-driven." },
                    { label: "Call to Action", emoji: "📣", prompt: "Rewrite this caption with a compelling call-to-action for Instagram." },
                    { label: "SEO Focus", emoji: "🔍", prompt: "Rewrite this Instagram caption with relevant keywords for discoverability." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="Instagram"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("instagram", "hashtags", v)}
                />
              </FieldRow>

              {/* Instagram Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Instagram Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload as Reel"
                    description="Publish video directly to Instagram Reels feed"
                    value={activePlatform.upload_as_reel ?? true}
                    onChange={(v) => onPlatformChange("instagram", "upload_as_reel", v)}
                  />
                  <ToggleOption
                    label="Upload at Highest Quality (HD)"
                    description="Use original resolution and high-bitrate encoding"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("instagram", "upload_hd", v)}
                  />
                  <ToggleOption
                    label="Share to Main Feed"
                    description="Display Reel on your main profile grid feed"
                    value={activePlatform.share_to_feed ?? true}
                    onChange={(v) => onPlatformChange("instagram", "share_to_feed", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="Instagram"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("instagram", "cover_path", p)}
              />
            </>
          )}

          {/* TikTok fields */}
          {activeTab === "tiktok" && (
            <>
              <FieldRow label="Caption">
                <textarea
                  value={activePlatform.caption ?? ""}
                  onChange={(e) => onPlatformChange("tiktok", "caption", e.target.value)}
                  className={inputClass}
                  rows={5}
                />
                <AiChips
                  fieldLabel="TikTok caption"
                  currentValue={activePlatform.caption ?? ""}
                  onRewrite={(v) => onPlatformChange("tiktok", "caption", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this TikTok caption viral-worthy with a strong hook. Add emojis naturally." },
                    { label: "FYP Focus", emoji: "🎯", prompt: "Rewrite for TikTok FYP discoverability. Include trending-style language." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="TikTok"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("tiktok", "hashtags", v)}
                />
              </FieldRow>

              {/* TikTok Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">TikTok Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload in High Quality (HD)"
                    description="Upload video using TikTok HD video encoding"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("tiktok", "upload_hd", v)}
                  />
                  <ToggleOption
                    label="Allow Duet"
                    description="Allow other creators to record Duet videos with this post"
                    value={activePlatform.allow_duet ?? true}
                    onChange={(v) => onPlatformChange("tiktok", "allow_duet", v)}
                  />
                  <ToggleOption
                    label="Allow Stitch"
                    description="Allow creators to clip and integrate your video into theirs"
                    value={activePlatform.allow_stitch ?? true}
                    onChange={(v) => onPlatformChange("tiktok", "allow_stitch", v)}
                  />
                  <ToggleOption
                    label="Allow Comments"
                    description="Enable user comments on your TikTok post"
                    value={activePlatform.allow_comments ?? true}
                    onChange={(v) => onPlatformChange("tiktok", "allow_comments", v)}
                  />
                  <ToggleOption
                    label="Branded Content Disclosure"
                    description="Mark post as commercial or promotional content"
                    value={activePlatform.brand_content ?? false}
                    onChange={(v) => onPlatformChange("tiktok", "brand_content", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="TikTok"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("tiktok", "cover_path", p)}
              />
            </>
          )}

          {/* Facebook fields */}
          {activeTab === "facebook" && (
            <>
              <FieldRow label="Title">
                <input
                  type="text"
                  value={activePlatform.title ?? ""}
                  onChange={(e) => onPlatformChange("facebook", "title", e.target.value)}
                  className={inputClass}
                />
                <AiChips
                  fieldLabel="Facebook title"
                  currentValue={activePlatform.title ?? ""}
                  onRewrite={(v) => onPlatformChange("facebook", "title", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this Facebook Reels title catchy and engagement-focused." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Description">
                <textarea
                  value={activePlatform.description ?? ""}
                  onChange={(e) => onPlatformChange("facebook", "description", e.target.value)}
                  className={inputClass}
                  rows={4}
                />
                <AiChips
                  fieldLabel="Facebook description"
                  currentValue={activePlatform.description ?? ""}
                  onRewrite={(v) => onPlatformChange("facebook", "description", v)}
                  chips={[
                    { label: "Call to Action", emoji: "📣", prompt: "Add a Facebook-friendly call-to-action to this description." },
                    { label: "SEO Focus", emoji: "🔍", prompt: "Optimize this Facebook Reels description with search keywords." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="Facebook"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("facebook", "hashtags", v)}
                />
              </FieldRow>

              {/* Facebook Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Facebook Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload as Facebook Reel"
                    description="Publish video directly to Facebook Reels feed"
                    value={activePlatform.upload_as_reel ?? true}
                    onChange={(v) => onPlatformChange("facebook", "upload_as_reel", v)}
                  />
                  <ToggleOption
                    label="Upload in High Quality (HD)"
                    description="Preserve original 1080p resolution and bitrate"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("facebook", "upload_hd", v)}
                  />
                  <ToggleOption
                    label="Allow Crossposting"
                    description="Allow crossposting to connected Facebook Pages & Groups"
                    value={activePlatform.allow_crossposting ?? true}
                    onChange={(v) => onPlatformChange("facebook", "allow_crossposting", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="Facebook"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("facebook", "cover_path", p)}
              />
            </>
          )}

          {/* Twitter fields */}
          {activeTab === "x" && (
            <>
              <FieldRow label="Tweet Text">
                <textarea
                  value={activePlatform.tweet_text ?? ""}
                  onChange={(e) => onPlatformChange("x", "tweet_text", e.target.value)}
                  className={inputClass}
                  rows={4}
                  maxLength={280}
                />
                <p className="text-[10px] text-on-surface-variant text-right">
                  {(activePlatform.tweet_text ?? "").length}/280
                </p>
                <AiChips
                  fieldLabel="Twitter tweet"
                  currentValue={activePlatform.tweet_text ?? ""}
                  onRewrite={(v) => onPlatformChange("x", "tweet_text", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this tweet more engaging. Keep under 280 chars." },
                    { label: "Curiosity", emoji: "❓", prompt: "Rewrite to spark curiosity and get replies. Keep under 280 chars." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="Twitter"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("x", "hashtags", v)}
                />
              </FieldRow>

              {/* Twitter Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Twitter Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload in High Quality (HD)"
                    description="Upload video at highest allowed Twitter video bitrate"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("x", "upload_hd", v)}
                  />
                  <ToggleOption
                    label="Mark as Sensitive Media"
                    description="Flag video content as sensitive or adult-oriented"
                    value={activePlatform.sensitive_content ?? false}
                    onChange={(v) => onPlatformChange("x", "sensitive_content", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="Twitter"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("x", "cover_path", p)}
              />
            </>
          )}

          {/* Snapchat fields */}
          {activeTab === "snapchat" && (
            <>
              <FieldRow label="Caption">
                <textarea
                  value={activePlatform.caption ?? ""}
                  onChange={(e) => onPlatformChange("snapchat", "caption", e.target.value)}
                  className={inputClass}
                  rows={3}
                />
                <AiChips
                  fieldLabel="Snapchat caption"
                  currentValue={activePlatform.caption ?? ""}
                  onRewrite={(v) => onPlatformChange("snapchat", "caption", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this Snapchat Spotlight caption fun, short, and snappy." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="Snapchat"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("snapchat", "hashtags", v)}
                />
              </FieldRow>

              {/* Snapchat Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Snapchat Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload to Spotlight"
                    description="Publish video to public Snapchat Spotlight feed"
                    value={activePlatform.upload_to_spotlight ?? true}
                    onChange={(v) => onPlatformChange("snapchat", "upload_to_spotlight", v)}
                  />
                  <ToggleOption
                    label="Upload in High Quality (HD)"
                    description="Use HD vertical video format"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("snapchat", "upload_hd", v)}
                  />
                  <ToggleOption
                    label="Save to Public Story"
                    description="Post clip to your public channel Story"
                    value={activePlatform.save_to_story ?? false}
                    onChange={(v) => onPlatformChange("snapchat", "save_to_story", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="Snapchat"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("snapchat", "cover_path", p)}
              />
            </>
          )}

          {/* Threads fields */}
          {activeTab === "threads" && (
            <>
              <FieldRow label="Post Text">
                <textarea
                  value={activePlatform.post_text ?? ""}
                  onChange={(e) => onPlatformChange("threads", "post_text", e.target.value)}
                  className={inputClass}
                  rows={4}
                />
                <AiChips
                  fieldLabel="Threads post"
                  currentValue={activePlatform.post_text ?? ""}
                  onRewrite={(v) => onPlatformChange("threads", "post_text", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this Threads post more engaging. Sound conversational and interesting." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagField
                  platformId="Threads"
                  value={activePlatform.hashtags ?? []}
                  onChange={(v) => onPlatformChange("threads", "hashtags", v)}
                />
              </FieldRow>

              {/* Threads Settings */}
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Threads Settings</label>
                <div className="bg-surface-container-high/40 border border-outline-variant/60 rounded-xl p-3">
                  <ToggleOption
                    label="Upload in High Quality (HD)"
                    description="Upload video with high-definition resolution"
                    value={activePlatform.upload_hd ?? true}
                    onChange={(v) => onPlatformChange("threads", "upload_hd", v)}
                  />
                </div>
              </div>

              <PlatformCoverSection
                platformName="Threads"
                platformCoverPath={activePlatform.cover_path}
                defaultCoverPath={defaultCoverPath}
                coverTimestamp={coverTimestamp}
                onChangeCoverPath={(p) => onPlatformChange("threads", "cover_path", p)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
