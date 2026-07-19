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

export type Platform = "youtube" | "instagram" | "facebook" | "tiktok" | "threads" | "x";
export type PostStatus = "draft" | "scheduled" | "uploading" | "published" | "failed" | "cancelled";

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
