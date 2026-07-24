"use client";

import { useState } from "react";
import { Manifest } from "@/types";
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
    label: "X",
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

interface PlatformTabsProps {
  manifest: Manifest;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlatformChange: (platform: string, key: string, value: any) => void;
  onTogglePlatform: (platform: string, enabled: boolean) => void;
}

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

function HashtagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [raw, setRaw] = useState(value.map((h) => `#${h.replace(/^#/, "")}`).join(" "));

  const handleBlur = () => {
    const tags = raw.split(/[\s,]+/).filter(Boolean).map((t) => t.replace(/^#/, ""));
    onChange(tags);
  };

  return (
    <input
      type="text"
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={handleBlur}
      placeholder="#tag1 #tag2 #tag3"
      className={inputClass}
    />
  );
}

export function PlatformTabs({ manifest, activeTab, onTabChange, onPlatformChange, onTogglePlatform }: PlatformTabsProps) {
  const platforms = manifest.platforms;
  const activePlatform = platforms[activeTab as keyof typeof platforms] as any;
  const isEnabled = activePlatform?.enabled ?? false;

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
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("youtube", "hashtags", v)} />
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
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("instagram", "hashtags", v)} />
              </FieldRow>
              <div className="flex items-center gap-3">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Share to Feed</label>
                <button
                  onClick={() => onPlatformChange("instagram", "share_to_feed", !activePlatform.share_to_feed)}
                  className={["relative w-8 h-4 rounded-full transition-all duration-300", activePlatform.share_to_feed ? "bg-primary" : "bg-surface-container-high border border-outline-variant"].join(" ")}
                >
                  <span className={["absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300", activePlatform.share_to_feed ? "translate-x-4" : "translate-x-0"].join(" ")} />
                </button>
              </div>
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
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("tiktok", "hashtags", v)} />
              </FieldRow>
              <div className="flex flex-col gap-2">
                {[
                  { key: "allow_duet", label: "Allow Duet" },
                  { key: "allow_stitch", label: "Allow Stitch" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider flex-1">{label}</label>
                    <button
                      onClick={() => onPlatformChange("tiktok", key, !activePlatform[key])}
                      className={["relative w-8 h-4 rounded-full transition-all duration-300", activePlatform[key] ? "bg-primary" : "bg-surface-container-high border border-outline-variant"].join(" ")}
                    >
                      <span className={["absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300", activePlatform[key] ? "translate-x-4" : "translate-x-0"].join(" ")} />
                    </button>
                  </div>
                ))}
              </div>
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
              </FieldRow>
              <FieldRow label="Description">
                <textarea
                  value={activePlatform.description ?? ""}
                  onChange={(e) => onPlatformChange("facebook", "description", e.target.value)}
                  className={inputClass}
                  rows={4}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("facebook", "hashtags", v)} />
              </FieldRow>
            </>
          )}

          {/* X fields */}
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
                  fieldLabel="X (Twitter) tweet"
                  currentValue={activePlatform.tweet_text ?? ""}
                  onRewrite={(v) => onPlatformChange("x", "tweet_text", v)}
                  chips={[
                    { label: "Catchier", emoji: "🔥", prompt: "Make this tweet more engaging. Keep under 280 chars." },
                    { label: "Curiosity", emoji: "❓", prompt: "Rewrite to spark curiosity and get replies. Keep under 280 chars." },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("x", "hashtags", v)} />
              </FieldRow>
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
              </FieldRow>
              <FieldRow label="Hashtags">
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("snapchat", "hashtags", v)} />
              </FieldRow>
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
                <HashtagInput value={activePlatform.hashtags ?? []} onChange={(v) => onPlatformChange("threads", "hashtags", v)} />
              </FieldRow>
            </>
          )}
        </div>
      )}
    </div>
  );
}
