"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { SiYoutube, SiInstagram, SiFacebook, SiTiktok, SiThreads, SiX } from "react-icons/si";

const PlatformIcon = ({ platform, className = "" }: { platform: string, className?: string }) => {
  switch (platform.toUpperCase()) {
    case "YOUTUBE": return <SiYoutube className={className} />;
    case "INSTAGRAM": return <SiInstagram className={className} />;
    case "FACEBOOK": return <SiFacebook className={className} />;
    case "TIKTOK": return <SiTiktok className={className} />;
    case "THREADS": return <SiThreads className={className} />;
    case "X": return <SiX className={className} />;
    default: return <span className={`material-symbols-outlined ${className}`}>share</span>;
  }
};

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
  const [platformAccounts, setPlatformAccounts] = useState<Record<string, number>>({});
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
        const platformCounts = accounts.reduce((acc: any, curr: any) => {
          acc[curr.platform] = (acc[curr.platform] || 0) + 1;
          return acc;
        }, {});
        setPlatformAccounts(platformCounts);
        
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
          <div className="bg-surface-container-low border border-outline-variant p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary">movie</span>
              <span className="text-primary font-mono-sm">Videos</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md uppercase tracking-wider">Total Videos</p>
              <p className="font-headline-md text-headline-md mt-cxs">{stats?.total_videos || 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary">schedule_send</span>
              <span className="text-secondary font-mono-sm">Active</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md uppercase tracking-wider">Scheduled Posts</p>
              <p className="font-headline-md text-headline-md mt-cxs">{stats?.scheduled || 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-tertiary">hub</span>
              <span className="text-tertiary font-mono-sm">Accounts</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md uppercase tracking-wider">Connected Accounts</p>
              <p className="font-headline-md text-headline-md mt-cxs text-lg truncate">{accountsCount}</p>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-cmd rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <span className="text-green-500 font-mono-sm">Success</span>
            </div>
            <div className="mt-cmd">
              <p className="text-on-surface-variant text-label-md uppercase tracking-wider">Published Posts</p>
              <p className="font-headline-md text-headline-md mt-cxs">{stats?.published || 0}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {/* Account Breakdown */}
          <section className="bg-surface-container-low border border-outline-variant p-cmd rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-sm text-headline-sm">Account Breakdown</h2>
              <Link href="/accounts" className="text-primary text-label-md hover:underline">Manage Accounts</Link>
            </div>
            
            {(() => {
              const allPlatforms = stats?.platform_breakdown?.map(p => p.platform.toUpperCase()) || ["YOUTUBE", "INSTAGRAM", "FACEBOOK", "TIKTOK", "THREADS", "X"];
              
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-csm">
                  {allPlatforms.map((platform) => {
                    const count = platformAccounts[platform] || platformAccounts[platform.toLowerCase()] || 0;
                    return (
                      <div key={platform} className={`rounded-lg p-csm flex flex-col items-center justify-center text-center transition-colors ${count > 0 ? 'bg-primary-container/20 border border-primary/30' : 'bg-surface-container-high border border-transparent'}`}>
                        <PlatformIcon platform={platform} className={`text-2xl mb-2 ${count > 0 ? 'text-primary' : 'text-on-surface-variant'}`} />
                        <span className={`font-headline-sm text-headline-sm uppercase ${count > 0 ? 'text-primary' : 'text-on-surface'}`}>{platform}</span>
                        <span className={`text-label-lg mt-cxs ${count > 0 ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>{count} Connected</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* Platform Analytics Breakdown */}
          <section className="bg-surface-container-low border border-outline-variant p-cmd rounded-xl">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-sm text-headline-sm">Platform Performance</h2>
              <Link href="/analytics" className="text-primary text-label-md hover:underline">View Analytics</Link>
            </div>
            
            {!stats?.platform_breakdown || stats.platform_breakdown.length === 0 ? (
              <div className="flex items-center justify-center p-cmd">
                <p className="text-on-surface-variant">No performance data available.</p>
              </div>
            ) : (
              <div className="space-y-csm">
                {(() => {
                  const connectedPlatforms = Object.keys(platformAccounts).map(p => p.toUpperCase());
                  const activePlatforms = stats.platform_breakdown.filter(p => 
                    connectedPlatforms.includes(p.platform.toUpperCase()) || 
                    p.published > 0 || p.scheduled > 0 || p.failed > 0 || p.drafts > 0
                  );
                  
                  if (activePlatforms.length === 0) {
                    return (
                      <div className="flex items-center justify-center p-cmd">
                        <p className="text-on-surface-variant text-center">Connect an account to see platform performance.</p>
                      </div>
                    );
                  }
                  
                  return activePlatforms.map((platform) => (
                    <div key={platform.platform} className="bg-surface-container-high p-csm rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3 w-32">
                        <PlatformIcon platform={platform.platform} className="text-xl text-on-surface" />
                        <div className="font-body-md font-semibold text-on-surface uppercase truncate">{platform.platform}</div>
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-2 text-center text-label-sm">
                        <div>
                          <div className="text-green-500 font-bold">{platform.published}</div>
                          <div className="text-on-surface-variant uppercase text-[10px] tracking-widest mt-1">Success</div>
                        </div>
                        <div>
                          <div className="text-secondary font-bold">{platform.scheduled}</div>
                          <div className="text-on-surface-variant uppercase text-[10px] tracking-widest mt-1">Pending</div>
                        </div>
                        <div>
                          <div className="text-error font-bold">{platform.failed}</div>
                          <div className="text-on-surface-variant uppercase text-[10px] tracking-widest mt-1">Failed</div>
                        </div>
                        <div>
                          <div className="text-tertiary font-bold">{platform.drafts}</div>
                          <div className="text-on-surface-variant uppercase text-[10px] tracking-widest mt-1">Drafts</div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
          {/* Upcoming Posts */}
          <section className="xl:col-span-8">
            <div className="flex items-center justify-between mb-cmd">
              <h2 className="font-headline-lg text-headline-lg">Upcoming Posts</h2>
              <Link href="/calendar" className="text-primary text-label-md hover:underline">View Calendar</Link>
            </div>
            
            {upcomingPosts.length === 0 ? (
              <div className="bg-surface-container-low border border-outline-variant p-csm rounded-xl flex items-center justify-center h-40">
                <p className="text-on-surface-variant">No upcoming posts scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-cmd">
                {upcomingPosts.map((post) => (
                  <div key={post.id} className="bg-surface-container-low border border-outline-variant p-csm rounded-xl group cursor-pointer hover:border-primary/50 transition-all">
                    <div className="relative rounded-lg overflow-hidden h-40 bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-on-surface-variant">play_circle</span>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-xs left-xs flex items-center gap-cxs">
                        <div className="bg-black/50 backdrop-blur-md rounded px-2 py-1 flex items-center justify-center gap-1">
                          <PlatformIcon platform={post.platform} className="text-white text-[12px]" />
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
              <div className="bg-surface-container-low border border-outline-variant p-csm rounded-xl flex items-center justify-center h-40">
                <p className="text-on-surface-variant">No videos uploaded yet.</p>
              </div>
            ) : (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant">
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
