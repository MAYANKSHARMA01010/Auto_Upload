"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaXTwitter,
  FaSnapchat,
  FaThreads,
} from "react-icons/fa6";

import { api } from "@/lib/axios";
import { ConnectedAccount } from "@/types";
import { Button } from "@/components/ui/button";
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

// ─── Platform definitions ──────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "all",
    name: "All",
    icon: BarChart2,
    pill: "border-border text-muted-foreground bg-muted/40 hover:bg-muted",
    activePill: "border-primary/60 bg-primary/15 text-primary",
    cardAccent: "bg-gradient-to-br from-primary/20 to-primary/5",
    barColor: "bg-primary",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: FaYoutube,
    pill: "border-red-400/30 text-red-400 bg-red-400/10 hover:bg-red-400/20",
    activePill: "border-red-400/70 bg-red-500/20 text-red-300",
    cardAccent: "from-red-500/20 to-red-500/5",
    barColor: "bg-red-500",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: FaInstagram,
    pill: "border-pink-400/30 text-pink-400 bg-pink-400/10 hover:bg-pink-400/20",
    activePill: "border-pink-400/70 bg-pink-500/20 text-pink-300",
    cardAccent: "from-pink-500/20 to-pink-500/5",
    barColor: "bg-pink-500",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: FaTiktok,
    pill: "border-border text-foreground bg-muted/40 hover:bg-muted",
    activePill: "border-border bg-muted text-foreground",
    cardAccent: "from-neutral-700/20 to-neutral-700/5",
    barColor: "bg-neutral-400",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebook,
    pill: "border-blue-400/30 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20",
    activePill: "border-blue-400/70 bg-blue-500/20 text-blue-300",
    cardAccent: "from-blue-500/20 to-blue-500/5",
    barColor: "bg-blue-500",
  },
  {
    id: "x",
    name: "Twitter (X)",
    icon: FaXTwitter,
    pill: "border-sky-400/30 text-sky-400 bg-sky-400/10 hover:bg-sky-400/20",
    activePill: "border-sky-400/70 bg-sky-500/20 text-sky-300",
    cardAccent: "from-sky-500/20 to-sky-500/5",
    barColor: "bg-sky-500",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: FaSnapchat,
    pill: "border-yellow-400/30 text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20",
    activePill: "border-yellow-400/70 bg-yellow-500/20 text-yellow-300",
    cardAccent: "from-yellow-500/20 to-yellow-500/5",
    barColor: "bg-yellow-400",
  },
  {
    id: "threads",
    name: "Threads",
    icon: FaThreads,
    pill: "border-border text-foreground bg-muted/40 hover:bg-muted",
    activePill: "border-border bg-muted text-foreground",
    cardAccent: "from-neutral-600/20 to-neutral-600/5",
    barColor: "bg-neutral-400",
  },
];

const CONNECTABLE_PLATFORMS = PLATFORMS.filter((p) => p.id !== "all");

// ─── Delete Confirmation Dialog ────────────────────────────────────────────────
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
    if (!o) setConfirmText("");
    else setTimeout(() => inputRef.current?.focus(), 120);
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
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          aria-label="Disconnect account"
          onClick={(e) => e.stopPropagation()}
        />
      }>
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base">Disconnect {platformName}?</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{account.username || "Connected Account"}</p>
            {account.handle && <p className="text-xs text-primary font-medium">{account.handle}</p>}
            {account.email && <p className="text-xs text-muted-foreground">📧 {account.email}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground font-bold">
                {requiredPhrase}
              </code>{" "}
              to confirm:
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

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => handleOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={!isMatch || isDeleting}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disconnecting…</> : "Disconnect Account"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Insight View (drill-down) ────────────────────────────────────────
function AccountInsightView({
  account,
  platformDef,
  onBack,
}: {
  account: ConnectedAccount;
  platformDef: (typeof PLATFORMS)[0];
  onBack: () => void;
}) {
  const Icon = platformDef.icon;

  const { data, isLoading } = useQuery({
    queryKey: ["account-insight", account.id],
    queryFn: async () => {
      const res = await api.get(
        `/analytics/social-insights?platform=${account.platform}&account_id=${account.id}`
      );
      return res.data;
    },
    staleTime: 60_000,
  });

  const stats = data?.stats ?? { total_posts: 0, published: 0, scheduled: 0, failed: 0 };
  const videos = data?.videos ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${platformDef.activePill.includes("red") ? "text-red-400" : "text-primary"}`} />
          <div>
            <p className="text-sm font-bold text-foreground">{account.username || "Account"}</p>
            {account.handle && <p className="text-xs text-primary">{account.handle}</p>}
          </div>
        </div>
        {account.email && (
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">📧 {account.email}</span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Posts", value: stats.total_posts, icon: BarChart2, color: "text-foreground" },
          { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-primary" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-rose-400" },
        ].map(({ label, value, icon: StatIcon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <StatIcon className={`h-3.5 w-3.5 ${color}`} />
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>{label}</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Posts table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Posts & Video Dispatch Log ({videos.length})
          </h3>
          {videos.length > 0 && (
            <Link href="/shorts-factory" className="text-xs text-primary hover:underline font-semibold">
              + Dispatch New
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">No posts dispatched yet</p>
            <p className="text-xs text-muted-foreground">Schedule or publish via Shorts Factory to see analytics here.</p>
            <Link
              href="/shorts-factory"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all"
            >
              Go to Shorts Factory
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Scheduled</th>
                    <th className="py-3 px-4 text-right">Published</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {videos.map((vid: any) => (
                    <tr key={vid.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{vid.title}</td>
                      <td className="py-3 px-4">
                        <span
                          className={[
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                            vid.status === "published"
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : vid.status === "scheduled"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-rose-400/10 text-rose-400 border-rose-400/20",
                          ].join(" ")}
                        >
                          {vid.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {vid.scheduled_at ? new Date(vid.scheduled_at).toLocaleString() : "Immediate"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-muted-foreground">
                        {vid.published_at ? new Date(vid.published_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({
  account,
  platformDef,
  onClick,
  onDelete,
  onRefresh,
}: {
  account: ConnectedAccount;
  platformDef: (typeof PLATFORMS)[0];
  onClick: () => void;
  onDelete: () => Promise<void>;
  onRefresh: () => void;
}) {
  const Icon = platformDef.icon;
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(account.username || "");
  const [editHandle, setEditHandle] = useState(account.handle || "");
  const [saving, setSaving] = useState(false);
  const [refreshingLive, setRefreshingLive] = useState(false);

  const handleRefreshAccount = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRefreshingLive(true);
      await api.get(`/analytics/social-insights?platform=${account.platform}&account_id=${account.id}&refresh=true`);
      toast.success(`Refreshed live metrics for ${account.username || platformDef.name}!`);
      onRefresh();
    } catch {
      toast.error(`Failed to refresh metrics for ${account.username}`);
    } finally {
      setRefreshingLive(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await api.patch(`/accounts/${account.id}`, {
        username: editUsername,
        handle: editHandle,
      });
      toast.success("Account details updated!");
      setIsEditing(false);
      onRefresh();
    } catch {
      toast.error("Failed to update account details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={isEditing ? undefined : onClick}
      className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-200 min-h-[240px]"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${platformDef.barColor}`} />

      {/* Gradient bg glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${platformDef.cardAccent} transition-opacity duration-300 pointer-events-none`} />

      <div className="relative p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Top row: shiny status dot next to refresh + pencil + delete icons */}
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {account.is_active ? (
              <span className="relative flex h-3 w-3 items-center justify-center mr-1.5" title="Account Active & Connected">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-emerald-400/40" />
              </span>
            ) : (
              <span className="relative flex h-3 w-3 items-center justify-center mr-1.5" title="Account Token Expired">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ring-2 ring-red-500/40" />
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
              title="Refresh Live Analytics & Cache"
              disabled={refreshingLive}
              onClick={handleRefreshAccount}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshingLive ? "animate-spin text-primary" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Edit Account Details"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <DeleteConfirmDialog
              account={account}
              platformName={platformDef.name}
              onConfirm={onDelete}
            />
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-[10px] text-muted-foreground font-semibold">Account Name</label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="e.g. Mayank Sharma"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-semibold">Handle / Username</label>
              <Input
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value)}
                placeholder="e.g. @sharmamayank1221"
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Middle Section: Platform Icon + Username + Handle & Details */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${platformDef.barColor}/20 border border-white/10 shrink-0`}>
                  <Icon className={`h-4 w-4 ${platformDef.barColor === "bg-red-500" ? "text-red-400" : platformDef.barColor === "bg-pink-500" ? "text-pink-400" : platformDef.barColor === "bg-blue-500" ? "text-blue-400" : platformDef.barColor === "bg-sky-500" ? "text-sky-400" : platformDef.barColor === "bg-yellow-400" ? "text-yellow-400" : "text-foreground"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {account.platform === "facebook" ? (account.email?.includes("Belongs to") ? "Facebook Page" : "Facebook User") : platformDef.name}
                  </p>
                  <p className="text-sm font-bold text-foreground truncate">{account.username || "Connected Account"}</p>
                </div>
              </div>

              {/* Handle pill & Email / Metadata */}
              <div className="space-y-1">
                {account.handle ? (
                  <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {account.handle}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded-full">
                    @{account.username?.toLowerCase().replace(/\s+/g, "") || "account"}
                  </span>
                )}

                {account.email ? (
                  <p className="text-xs text-muted-foreground truncate pt-0.5">
                    {account.email.includes("Belongs to") ? `📄 ${account.email}` : `📧 ${account.email}`}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 truncate pt-0.5">
                    {account.platform === "youtube" ? "↻ Reconnect to show Gmail" : "• Connected via OAuth"}
                  </p>
                )}
              </div>
            </div>

            {/* Footer: ID + View Analytics Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[50%]">
                {account.platform_user_id ? `${account.platform_user_id.slice(0, 14)}…` : "ID: Connected"}
              </p>
              <Link
                href={`/analytics?platform=${account.platform}&account_id=${account.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary font-semibold hover:underline transition-colors ml-auto flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20"
              >
                View Analytics <span className="material-symbols-outlined text-xs">trending_up</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const router = useRouter();
  const [activePlatform, setActivePlatform] = useState("all");
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
        "YouTube account not connected: Your channel needs a custom handle (@handle). Set one in YouTube Studio first.",
        { duration: 8000 }
      );
    }

    if (status || error) window.history.replaceState({}, "", window.location.pathname);

    api.post("/accounts/sync").then(() => refetch()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (platformId: string) => {
    setIsConnecting(platformId);
    try {
      const res = await api.get(`/accounts/oauth/${platformId}/init`);
      window.location.href = res.data.authorization_url;
    } catch {
      toast.error(`Failed to connect ${platformId}`);
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    await api.delete(`/accounts/${accountId}`);
    toast.success("Account disconnected");
    refetch();
  };

  const getPlatformDef = (platformId: string) =>
    PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];

  // Filter accounts by active platform tab
  const filteredAccounts =
    activePlatform === "all" ? accounts ?? [] : (accounts ?? []).filter((a) => a.platform === activePlatform);

  // ── List view ──
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Accounts</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Click any account to view its analytics & post history.
          </p>
        </div>

        {/* Connect Platform Dialog */}
        <Dialog>
          <DialogTrigger render={<Button id="connect-platform-btn" />}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Platform
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect New Platform</DialogTitle>
              <DialogDescription>Select a platform to authorize ClipScheduler.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {CONNECTABLE_PLATFORMS.map((platform) => {
                const count = accounts?.filter((a) => a.platform === platform.id).length || 0;
                const Icon = platform.icon;
                return (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-1.5"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting === platform.id}
                  >
                    {isConnecting === platform.id ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Icon className={`h-6 w-6 ${platform.pill.includes("red") ? "text-red-400" : platform.pill.includes("pink") ? "text-pink-400" : platform.pill.includes("blue-4") ? "text-blue-400" : platform.pill.includes("sky") ? "text-sky-400" : platform.pill.includes("yellow") ? "text-yellow-400" : "text-foreground"}`} />
                    )}
                    <span className="text-sm font-medium">{platform.name}</span>
                    {count > 0 && <span className="text-[10px] text-muted-foreground">{count} connected</span>}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platform filter tabs */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const isActive = activePlatform === p.id;
          const count = p.id === "all" ? (accounts?.length ?? 0) : (accounts?.filter((a) => a.platform === p.id).length ?? 0);
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={[
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200",
                isActive ? p.activePill : p.pill,
              ].join(" ")}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.name}</span>
              {count > 0 && (
                <span className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-white/20" : "bg-black/10 dark:bg-white/10"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Account cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          ))
        ) : filteredAccounts.length === 0 ? (
          <div className="col-span-full flex h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center gap-3">
            <BarChart2 className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activePlatform === "all" ? "No accounts connected yet" : `No ${getPlatformDef(activePlatform).name} accounts`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect a platform to start scheduling and tracking posts.
              </p>
            </div>
          </div>
        ) : (
          filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              platformDef={getPlatformDef(account.platform)}
              onClick={() => router.push(`/analytics?platform=${account.platform}&account_id=${account.id}`)}
              onDelete={() => handleDisconnect(account.id)}
              onRefresh={refetch}
            />
          ))
        )}
      </div>
    </div>
  );
}
