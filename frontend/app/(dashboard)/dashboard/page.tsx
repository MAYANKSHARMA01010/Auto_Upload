"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface OverallStats {
  total_videos: number;
  total_posts: number;
  published: number;
  scheduled: number;
  failed: number;
  drafts: number;
  upcoming_today: number;
  platform_breakdown: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [accountsCount, setAccountsCount] = useState(0);
  const [platforms, setPlatforms] = useState<string>("");
  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, accountsRes, schedulesRes, videosRes] = await Promise.all([
          api.get("/analytics/overview"),
          api.get("/accounts"),
          api.get("/schedules", { params: { status: "scheduled", limit: 2 } }),
          api.get("/videos", { params: { limit: 4 } })
        ]);

        setStats(statsRes.data);
        
        const accounts = accountsRes.data;
        setAccountsCount(accounts.length);
        const uniquePlatforms = Array.from(new Set(accounts.map((a: any) => a.platform)));
        setPlatforms(uniquePlatforms.length > 0 ? uniquePlatforms.join(", ") : "None");
        
        setUpcomingPosts(schedulesRes.data.slice(0, 2));
        setRecentUploads(videosRes.data.slice(0, 4));
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-clg space-y-gutter">
        {/* Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary">movie</span>
              <span className="text-primary font-mono-sm">Videos</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Total Videos</p>
              <p className="font-headline-md text-headline-md mt-cxs">{stats?.total_videos || 0}</p>
            </div>
          </div>
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary">schedule_send</span>
              <span className="text-secondary font-mono-sm">Active</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Scheduled Posts</p>
              <p className="font-headline-md text-headline-md mt-cxs">{stats?.scheduled || 0}</p>
            </div>
          </div>
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-tertiary">hub</span>
              <span className="text-tertiary font-mono-sm">Accounts</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Connected Accounts</p>
              <p className="font-headline-md text-headline-md mt-cxs text-lg truncate" title={platforms}>{accountsCount} ({platforms})</p>
            </div>
          </div>
          <div className="glass p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <span className="text-green-500 font-mono-sm">Success</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md">Published Posts</p>
              <p className="font-headline-md text-headline-md mt-cxs">{stats?.published || 0}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
          {/* Upcoming Posts */}
          <section className="xl:col-span-8">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-lg text-headline-lg">Upcoming Posts</h2>
              <Link href="/calendar" className="text-primary text-label-md hover:underline">View Calendar</Link>
            </div>
            
            {upcomingPosts.length === 0 ? (
              <div className="glass p-csm rounded-xl flex items-center justify-center h-40">
                <p className="text-on-surface-variant">No upcoming posts scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-cmd">
                {upcomingPosts.map((post) => (
                  <div key={post.id} className="glass p-csm rounded-xl group cursor-pointer hover:border-primary/50 transition-all">
                    <div className="relative rounded-lg overflow-hidden h-40 bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-on-surface-variant">play_circle</span>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-xs left-xs flex items-center gap-cxs">
                        <div className="bg-black/50 backdrop-blur-md rounded px-2 py-1 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{post.platform}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-csm">
                      <h3 className="font-body-md font-semibold text-on-surface line-clamp-1">{post.title || "Untitled Post"}</h3>
                      <div className="flex items-center justify-between mt-cxs">
                        <p className="text-label-md text-on-surface-variant">
                          {format(new Date(post.schedule_datetime), "MMM d, yyyy h:mm a")}
                        </p>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">more_vert</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Uploads List */}
          <section className="xl:col-span-4">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-lg text-headline-lg">Recent Uploads</h2>
            </div>
            
            {recentUploads.length === 0 ? (
              <div className="glass p-csm rounded-xl flex items-center justify-center h-40">
                <p className="text-on-surface-variant">No videos uploaded yet.</p>
              </div>
            ) : (
              <div className="glass rounded-xl overflow-hidden divide-y divide-outline-variant">
                {recentUploads.map((video) => (
                  <div key={video.id} className="p-cmd hover:bg-surface-container-high transition-colors flex items-center gap-cmd">
                    <div className="w-12 h-12 rounded bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-on-surface-variant">movie</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm font-semibold truncate">{video.original_filename}</p>
                      <p className="text-label-md text-on-surface-variant">{format(new Date(video.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="status-chip bg-surface-container-high text-primary border border-primary/30">
                      {video.duration_seconds ? "Ready" : "Processing"}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Link href="/upload" className="block text-center w-full mt-cmd py-cxs text-label-md text-on-surface-variant hover:text-primary transition-colors border border-dashed border-outline-variant rounded-xl">
              Upload New Video
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
