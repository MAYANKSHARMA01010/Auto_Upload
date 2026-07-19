"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp } from "lucide-react";
import { api } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ["analytics", "timeline"],
    queryFn: async () => {
      const res = await api.get("/analytics/timeline?days=30");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-1">Detailed performance metrics and historical data.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Post Volume Timeline (Last 30 Days)</CardTitle>
            <CardDescription>Published vs Scheduled vs Failed posts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="h-[400px] w-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-md bg-muted/10">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">Chart visualization pending</p>
                <p className="text-sm mt-2 max-w-md text-center">
                  In a production environment, this would integrate with Recharts or Chart.js to render the timeline data returned from the `/analytics/timeline` API endpoint.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Platforms</CardTitle>
            <CardDescription>Based on successful publish rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground border border-dashed rounded-md">
              <div className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Platform Engagement Stats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Statistics</CardTitle>
            <CardDescription>Storage and bandwidth usage</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex h-[200px] items-center justify-center text-muted-foreground border border-dashed rounded-md">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Storage Metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
