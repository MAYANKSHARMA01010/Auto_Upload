"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Clock, FileEdit, LayoutDashboard, XCircle } from "lucide-react";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OverallStats {
  total_videos: number;
  total_posts: number;
  published: number;
  scheduled: number;
  failed: number;
  drafts: number;
  upcoming_today: number;
  platform_breakdown: Array<{
    platform: string;
    published: number;
    scheduled: number;
    failed: number;
    drafts: number;
  }>;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<OverallStats>({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const res = await api.get("/analytics/overview");
      return res.data;
    },
  });

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Scheduled Posts" 
          value={stats?.scheduled || 0} 
          icon={Clock} 
          description={`${stats?.upcoming_today || 0} upcoming today`} 
        />
        <StatCard 
          title="Published Videos" 
          value={stats?.published || 0} 
          icon={CheckCircle2} 
          description="Across all platforms" 
        />
        <StatCard 
          title="Failed Uploads" 
          value={stats?.failed || 0} 
          icon={XCircle} 
          description="Action required" 
        />
        <StatCard 
          title="Drafts" 
          value={stats?.drafts || 0} 
          icon={FileEdit} 
          description="Ready to be scheduled" 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground border border-dashed rounded-md">
                {/* Chart will go here - requires recharts */}
                <div className="text-center">
                  <BarChart3 className="mx-auto h-8 w-8 mb-2" />
                  <p>Timeline Chart Area</p>
                  <p className="text-xs mt-1">Shows daily activity over 30 days</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-6">
                {stats?.platform_breakdown.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">{platform.platform}</p>
                      <p className="text-sm text-muted-foreground">
                        {platform.published} published, {platform.scheduled} scheduled
                      </p>
                    </div>
                    <div className="font-medium text-sm">
                      Total: {platform.published + platform.scheduled + platform.failed}
                    </div>
                  </div>
                ))}
                {(!stats?.platform_breakdown || stats.platform_breakdown.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
