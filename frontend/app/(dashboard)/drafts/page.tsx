"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Edit, FileEdit, MoreVertical, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/axios";
import { ScheduledPost } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function DraftPostsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["schedules", page, "draft"],
    queryFn: async () => {
      const res = await api.get(`/schedules?page=${page}&per_page=${perPage}&status=draft`);
      return res.data;
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/schedules/${id}`);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      youtube: "bg-red-500/10 text-red-500 border-red-500/20",
      instagram: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      facebook: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      tiktok: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
      threads: "bg-neutral-800/10 text-neutral-800 border-neutral-800/20",
      x: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    };
    return colors[platform] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Drafts</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : data?.schedules.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed text-center">
          <FileEdit className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No drafts found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Saved drafts will appear here for you to edit and schedule later.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.schedules.map((post: ScheduledPost) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="h-40 md:h-32 md:w-48 bg-muted relative flex items-center justify-center shrink-0">
                    <Play className="h-8 w-8 text-muted-foreground/50" />
                    <Badge className={`absolute top-2 left-2 ${getPlatformColor(post.platform)}`} variant="outline">
                      {post.platform}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 md:p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {post.title || post.caption || post.post_text || "Untitled Draft"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            Last updated {format(new Date(post.updated_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/upload?draft=${post.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit & Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Draft
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
