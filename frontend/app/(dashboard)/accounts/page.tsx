"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link as LinkIcon, Loader2, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/axios";
import { ConnectedAccount } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PLATFORMS = [
  { id: "youtube", name: "YouTube Shorts", color: "bg-red-500", textColor: "text-red-500" },
  { id: "instagram", name: "Instagram", color: "bg-pink-500", textColor: "text-pink-500" },
  { id: "facebook", name: "Facebook Page", color: "bg-blue-500", textColor: "text-blue-500" },
  { id: "tiktok", name: "TikTok", color: "bg-neutral-900 dark:bg-neutral-100", textColor: "text-neutral-900 dark:text-neutral-100" },
  { id: "threads", name: "Threads", color: "bg-neutral-800", textColor: "text-neutral-800" },
  { id: "x", name: "X (Twitter)", color: "bg-blue-400", textColor: "text-blue-400" },
];

export default function AccountsPage() {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const { data: accounts, isLoading, refetch } = useQuery<ConnectedAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get("/accounts");
      return res.data;
    },
  });

  const handleConnect = async (platformId: string) => {
    setIsConnecting(platformId);
    try {
      const res = await api.get(`/accounts/oauth/${platformId}/init`);
      // Redirect user to OAuth authorization URL
      window.location.href = res.data.authorization_url;
    } catch (error: any) {
      toast.error(`Failed to initiate connection for ${platformId}`);
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await api.delete(`/accounts/${accountId}`);
      toast.success("Account disconnected");
      refetch();
    } catch (error) {
      toast.error("Failed to disconnect account");
    }
  };

  const getPlatformDetails = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || { name: platformId, color: "bg-gray-500", textColor: "text-gray-500" };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Accounts</h2>
          <p className="text-muted-foreground mt-1">Manage your social media platform connections.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Connect Platform
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect New Platform</DialogTitle>
              <DialogDescription>
                Select a platform to authorize ClipScheduler to post on your behalf.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {PLATFORMS.map((platform) => {
                const isAlreadyConnected = accounts?.some(a => a.platform === platform.id);
                return (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isAlreadyConnected || isConnecting === platform.id}
                  >
                    {isConnecting === platform.id ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <span className={`h-3 w-3 rounded-full ${platform.color}`} />
                    )}
                    <span className="font-medium">{platform.name}</span>
                    {isAlreadyConnected && (
                      <span className="text-xs text-muted-foreground">Connected</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : accounts?.length === 0 ? (
          <div className="col-span-full flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No accounts connected</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect a social media account to start scheduling posts.
            </p>
          </div>
        ) : (
          accounts?.map((account) => {
            const platform = getPlatformDetails(account.platform);
            return (
              <Card key={account.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${platform.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant={account.is_active ? "default" : "destructive"}>
                      {account.is_active ? "Active" : "Expired"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className={`text-xl mt-2 ${platform.textColor}`}>
                    {platform.name}
                  </CardTitle>
                  <CardDescription>
                    {account.username ? `@${account.username}` : "Connected"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mt-4">
                    Added on {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
