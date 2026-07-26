"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link as LinkIcon, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";

import { api } from "@/lib/axios";
import { ConnectedAccount } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { FaYoutube, FaInstagram, FaFacebook, FaTiktok, FaThreads, FaXTwitter } from "react-icons/fa6";

const PLATFORMS = [
  { id: "youtube", name: "YouTube", subtitle: "", color: "bg-red-500", textColor: "text-red-500", icon: FaYoutube },
  { id: "instagram", name: "Instagram", subtitle: "Reels & Posts", color: "bg-pink-500", textColor: "text-pink-500", icon: FaInstagram },
  { id: "facebook", name: "Facebook Page", subtitle: "Reels & Videos", color: "bg-blue-500", textColor: "text-blue-500", icon: FaFacebook },
  { id: "tiktok", name: "TikTok", subtitle: "Shorts & Videos", color: "bg-neutral-900 dark:bg-neutral-100", textColor: "text-neutral-900 dark:text-neutral-100", icon: FaTiktok },
  { id: "threads", name: "Threads", subtitle: "Posts & Media", color: "bg-neutral-800 dark:bg-neutral-200", textColor: "text-neutral-800 dark:text-neutral-200", icon: FaThreads },
  { id: "x", name: "Twitter / X", subtitle: "Posts & Videos", color: "bg-neutral-900 dark:bg-neutral-100", textColor: "text-neutral-900 dark:text-neutral-100", icon: FaXTwitter },
];

// Delete Confirmation Dialog
interface DeleteConfirmDialogProps {
  account: ConnectedAccount;
  platformName: string;
  onConfirm: () => Promise<void>;
}

function DeleteConfirmDialog({ account, platformName, onConfirm }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const requiredPhrase = (account.handle || account.username || platformName).trim();
  const isMatch = confirmText.trim() === requiredPhrase;

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setConfirmText("");
    } else {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  const handleDelete = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive -mr-2 -mt-2"
          aria-label="Disconnect account"
        />
      }>
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base">Disconnect {platformName} account?</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{account.username || "Connected Account"}</p>
            {account.handle && (
              <p className="text-xs text-primary font-medium">{account.handle}</p>
            )}
            {account.email && (
              <p className="text-xs text-muted-foreground">📧 {account.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To confirm, type{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground font-bold select-all">
                {requiredPhrase}
              </code>{" "}
              below:
            </p>
            <Input
              ref={inputRef}
              id="disconnect-confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && isMatch && handleDelete()}
              placeholder={`Type "${requiredPhrase}"`}
              className={`font-mono text-sm transition-colors ${
                confirmText && !isMatch
                  ? "border-destructive/60 focus-visible:ring-destructive/40"
                  : confirmText && isMatch
                  ? "border-green-500/60 focus-visible:ring-green-500/30"
                  : ""
              }`}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={!isMatch || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect Account"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Page
export default function AccountsPage() {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const { data: accounts, isLoading, refetch } = useQuery<ConnectedAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get("/accounts");
      return res.data;
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const error = params.get("error");
    const platform = params.get("connected") || params.get("platform");

    if (status === "success" && platform) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected!`);
    } else if (error === "no_handle") {
      toast.error(
        "YouTube account not connected: Your channel doesn't have a custom handle (@handle) yet. Set one in YouTube Studio first.",
        { duration: 8000 }
      );
    }

    if (status || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    api.post("/accounts/sync").then(() => {
      refetch();
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (platformId: string) => {
    setIsConnecting(platformId);
    try {
      const res = await api.get(`/accounts/oauth/${platformId}/init`);
      window.location.href = res.data.authorization_url;
    } catch {
      toast.error(`Failed to initiate connection for ${platformId}`);
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    await api.delete(`/accounts/${accountId}`);
    toast.success("Account disconnected successfully");
    refetch();
  };

  const getPlatformDetails = (platformId: string) =>
    PLATFORMS.find((p) => p.id === platformId) || {
      name: platformId,
      subtitle: "",
      color: "bg-gray-500",
      textColor: "text-gray-500",
      icon: LinkIcon,
    };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Accounts</h2>
          <p className="text-muted-foreground mt-1">Manage your social media platform connections.</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button id="connect-platform-btn" />}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Platform
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
                const connectionCount = accounts?.filter((a) => a.platform === platform.id).length || 0;
                return (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 relative"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting === platform.id}
                  >
                    {isConnecting === platform.id ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <platform.icon className={`h-8 w-8 ${platform.textColor}`} />
                    )}
                    <span className="font-medium">{platform.name}</span>
                    {connectionCount > 0 && (
                      <span className="text-xs text-muted-foreground">{connectionCount} Connected</span>
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

                    <DeleteConfirmDialog
                      account={account}
                      platformName={platform.name}
                      onConfirm={() => handleDisconnect(account.id)}
                    />
                  </div>

                  <CardTitle className={`text-xl mt-2 flex items-center justify-between ${platform.textColor}`}>
                    <div className="flex items-center gap-2">
                      <platform.icon className="h-5 w-5" />
                      <span>{platform.name}</span>
                    </div>
                    {platform.subtitle && (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {platform.subtitle}
                      </span>
                    )}
                  </CardTitle>

                  <CardDescription className="mt-2 space-y-1.5">
                    <span className="font-semibold text-foreground text-sm block leading-snug">
                      {account.username || "Connected Account"}
                    </span>

                    {account.handle && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {account.handle}
                      </span>
                    )}

                    {account.email ? (
                      <span className="text-xs text-muted-foreground block">
                        📧 {account.email}
                      </span>
                    ) : account.platform === "youtube" && (
                      <span className="text-[11px] text-amber-500/80 block italic">
                        ↻ Reconnect to show Gmail
                      </span>
                    )}

                    {account.platform_user_id && (
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        ID: {account.platform_user_id}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-muted-foreground mt-2">
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
