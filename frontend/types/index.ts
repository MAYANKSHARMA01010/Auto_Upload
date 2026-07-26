export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  size: number | null;
  mime_type: string | null;
  original_filename: string | null;
  created_at: string;
}

export type Platform =
  | "youtube"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "threads"
  | "x";
export type PostStatus =
  | "draft"
  | "scheduled"
  | "uploading"
  | "published"
  | "failed"
  | "cancelled";

export interface ScheduledPost {
  id: string;
  user_id: string;
  video_id: string;
  platform: Platform;
  status: PostStatus;
  schedule_datetime: string | null;
  timezone: string;
  title?: string | null;
  description?: string | null;
  tags?: string | null;
  keywords?: string | null;
  hashtags?: string | null;
  playlist?: string | null;
  category?: string | null;
  language?: string | null;
  visibility?: string | null;
  license?: string | null;
  allow_comments?: boolean | null;
  allow_ratings?: boolean | null;
  allow_embedding?: boolean | null;
  notify_subscribers?: boolean | null;
  made_for_kids?: boolean | null;
  caption?: string | null;
  location?: string | null;
  collaborator?: string | null;
  alt_text?: string | null;
  audience?: string | null;
  privacy?: string | null;
  allow_stitch?: boolean | null;
  allow_duet?: boolean | null;
  allow_downloads?: boolean | null;
  brand_content?: boolean | null;
  paid_partnership?: boolean | null;
  post_text?: string | null;
  reply_setting?: string | null;
  sensitive_media?: boolean | null;
  platform_post_id?: string | null;
  published_at?: string | null;
  error_message?: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  username: string | null;
  handle: string | null;
  email: string | null;
  platform_user_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata_json: Record<string, any> | null;
  created_at: string;
}

// ── Shorts-Factory Manifest Types ─────────────────────────────────────────────

export interface YoutubePlatformConfig {
  enabled: boolean;
  title: string;
  description: string;
  hashtags: string[];
  video_tags: string[];
  cover_path: string;
  scheduled_at: string;
  privacy: "private" | "unlisted" | "public";
  category_id?: string;
  default_language?: string;
  made_for_kids?: boolean;
  upload_hd?: boolean;
  notify_subscribers?: boolean;
  allow_comments?: boolean;
  allow_embedding?: boolean;
}

export interface InstagramPlatformConfig {
  enabled: boolean;
  caption: string;
  hashtags: string[];
  cover_path: string;
  scheduled_at: string;
  share_to_feed?: boolean;
  upload_as_reel?: boolean;
  upload_hd?: boolean;
  audio_name?: string;
}

export interface FacebookPlatformConfig {
  enabled: boolean;
  title: string;
  description: string;
  hashtags: string[];
  cover_path: string;
  scheduled_at: string;
  upload_as_reel?: boolean;
  upload_hd?: boolean;
  allow_crossposting?: boolean;
}

export interface TiktokPlatformConfig {
  enabled: boolean;
  caption: string;
  hashtags: string[];
  cover_path: string;
  scheduled_at: string;
  allow_duet?: boolean;
  allow_stitch?: boolean;
  allow_comments?: boolean;
  upload_hd?: boolean;
  brand_content?: boolean;
}

export interface XPlatformConfig {
  enabled: boolean;
  tweet_text: string;
  hashtags: string[];
  cover_path?: string;
  scheduled_at: string;
  upload_hd?: boolean;
  reply_setting?: "everyone" | "following" | "mentioned";
  sensitive_content?: boolean;
}

export interface SnapchatPlatformConfig {
  enabled: boolean;
  caption: string;
  hashtags: string[];
  cover_path: string;
  scheduled_at: string;
  upload_to_spotlight?: boolean;
  upload_hd?: boolean;
  save_to_story?: boolean;
}

export interface ThreadsPlatformConfig {
  enabled: boolean;
  post_text: string;
  hashtags: string[];
  cover_path?: string;
  scheduled_at: string;
  upload_hd?: boolean;
  reply_setting?: "everyone" | "following" | "mentioned";
}

export interface ManifestPlatforms {
  youtube?: YoutubePlatformConfig;
  instagram?: InstagramPlatformConfig;
  facebook?: FacebookPlatformConfig;
  tiktok?: TiktokPlatformConfig;
  x?: XPlatformConfig;
  snapchat?: SnapchatPlatformConfig;
  threads?: ThreadsPlatformConfig;
}

export interface ManifestAssets {
  video_path: string;
  default_cover_path: string;
  cover_timestamp: string;
}

export interface ManifestMasterMetadata {
  title: string;
  description: string;
  hashtags: string[];
  video_tags: string[];
  language: string;
}

export interface ManifestGenerationParams {
  starting_prompt: string;
  title: string;
  script: string;
  keywords: string[];
}

export interface ManifestProjectInfo {
  id: string;
  created_at: string;
  status: "ready_to_upload" | "scheduled" | "published" | "failed" | string;
  generation_params: ManifestGenerationParams;
}

export interface Manifest {
  project_info: ManifestProjectInfo;
  assets: ManifestAssets;
  master_metadata: ManifestMasterMetadata;
  platforms: ManifestPlatforms;
}

export interface ManifestSummary {
  id: string;
  status: string;
  title: string;
  description: string;
  video_path: string;
  cover_path: string;
  cover_timestamp: string;
  size_mb: number;
  duration?: number;
  duration_formatted?: string;
  platforms_enabled: string[];
  created_at: string;
  manifest_path: string;
}

