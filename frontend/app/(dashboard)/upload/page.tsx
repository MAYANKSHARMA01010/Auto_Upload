"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud, Image as ImageIcon, CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";

import { api } from "@/lib/axios";
import { ConnectedAccount } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Stub components for Date/Time picker since date-picker wasn't added successfully
const DatePickerStub = ({ date, setDate }: any) => (
  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
);

const TimePickerStub = ({ time, setTime }: any) => (
  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full" />
);

const PLATFORMS = [
  { id: "youtube", label: "YouTube Shorts", color: "bg-red-500/10 text-red-500" },
  { id: "instagram", label: "Instagram Reels", color: "bg-pink-500/10 text-pink-500" },
  { id: "facebook", label: "Facebook Reels", color: "bg-blue-500/10 text-blue-500" },
  { id: "tiktok", label: "TikTok", color: "bg-neutral-500/10 text-neutral-500 dark:text-neutral-300" },
  { id: "threads", label: "Threads", color: "bg-neutral-800/10 text-neutral-800 dark:text-white" },
  { id: "x", label: "X (Twitter)", color: "bg-blue-400/10 text-blue-400" },
];

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  // State
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const { data: accounts } = useQuery<ConnectedAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get("/accounts");
      return res.data;
    },
  });

  // Platform specific forms state
  const [platformData, setPlatformData] = useState<Record<string, any>>({});

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post("/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setVideoId(res.data.video.id);
      setVideoUrl(res.data.video.video_url);
      toast.success("Video uploaded successfully");
      setStep(2);
    } catch (err: any) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post(`/videos/${videoId}/thumbnail`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setThumbnailUrl(res.data.thumbnail_url);
      toast.success("Thumbnail uploaded successfully");
    } catch (err: any) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Thumbnail upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    );
  };

  const handlePlatformDataChange = (platform: string, field: string, value: any) => {
    setPlatformData(prev => ({
      ...prev,
      [platform]: {
        ...(prev[platform] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async (status: "draft" | "scheduled") => {
    if (!videoId) return toast.error("Please upload a video first");
    if (selectedAccounts.length === 0) return toast.error("Select at least one account");

    if (status === "scheduled" && (!scheduleDate || !scheduleTime)) {
      return toast.error("Please select schedule date and time");
    }

    setIsUploading(true);

    try {
      let schedule_datetime = null;
      if (scheduleDate && scheduleTime) {
        // Simple combination for this example (assumes local timezone)
        schedule_datetime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const posts = selectedAccounts.map(accountId => {
        const acc = accounts?.find(a => a.id === accountId);
        return {
          platform: acc?.platform,
          connected_account_id: accountId,
          status,
          ...(platformData[acc?.platform || ""] || {})
        };
      });

      await api.post("/schedules/bulk", {
        video_id: videoId,
        schedule_datetime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        posts
      });

      toast.success(status === "scheduled" ? "Posts scheduled successfully!" : "Saved as draft");
      router.push(status === "scheduled" ? "/scheduled" : "/drafts");
    } catch (err: any) {
      toast.error(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Failed to save posts");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Create Post</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left Column - File Upload & Schedule */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Media</CardTitle>
              <CardDescription>Upload video and thumbnail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Video File</Label>
                {!videoUrl ? (
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="file" accept="video/*" className="hidden" id="video-upload" onChange={handleVideoUpload} disabled={isUploading} />
                    <label htmlFor="video-upload" className="cursor-pointer w-full flex flex-col items-center">
                      {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" /> : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />}
                      <span className="text-sm font-medium">Click to upload video</span>
                      <span className="text-xs text-muted-foreground mt-1">MP4, MOV up to 500MB</span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">Video uploaded</span>
                    </div>
                  </div>
                )}
              </div>

              {videoId && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Thumbnail (Optional)</Label>
                  {!thumbnailUrl ? (
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input type="file" accept="image/*" className="hidden" id="thumbnail-upload" onChange={handleThumbnailUpload} disabled={isUploading} />
                      <label htmlFor="thumbnail-upload" className="cursor-pointer w-full flex flex-col items-center">
                        {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" /> : <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />}
                        <span className="text-sm font-medium">Click to upload thumbnail</span>
                        <span className="text-xs text-muted-foreground mt-1">JPG, PNG up to 20MB</span>
                      </label>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">Thumbnail uploaded</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={!videoId ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>2. Schedule</CardTitle>
              <CardDescription>When to publish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePickerStub date={scheduleDate} setDate={setScheduleDate} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <TimePickerStub time={scheduleTime} setTime={setScheduleTime} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Platforms & Metadata */}
        <div className="md:col-span-2 space-y-6">
          <Card className={!videoId ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>3. Platforms</CardTitle>
              <CardDescription>Select where to publish</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {accounts?.map((account) => {
                  const plat = PLATFORMS.find(p => p.id === account.platform);
                  const color = plat?.color || "bg-gray-100 text-gray-900";
                  const label = plat?.label || account.platform;
                  return (
                    <div
                      key={account.id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${selectedAccounts.includes(account.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => toggleAccount(account.id)}
                    >
                      <Checkbox
                        checked={selectedAccounts.includes(account.id)}
                        onCheckedChange={() => toggleAccount(account.id)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label className="cursor-pointer">{label}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {account.username ? `@${account.username}` : "Connected"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {accounts?.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">No connected accounts. Please connect an account in the Accounts tab.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>4. Platform Details</CardTitle>
                <CardDescription>Customize metadata for each platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion className="w-full">
                  {(() => {
                    const activePlatforms = [...new Set(selectedAccounts.map(id => accounts?.find(a => a.id === id)?.platform).filter(Boolean))];
                    return (
                      <>
                  {activePlatforms.includes("youtube") && (
                    <AccordionItem value="youtube">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-red-500" />
                          YouTube Shorts
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4 px-1">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            placeholder="Enter video title"
                            onChange={(e) => handlePlatformDataChange("youtube", "title", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Enter video description"
                            rows={4}
                            onChange={(e) => handlePlatformDataChange("youtube", "description", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tags (comma separated)</Label>
                          <Input
                            placeholder="tag1, tag2, tag3"
                            onChange={(e) => handlePlatformDataChange("youtube", "tags", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="yt-kids"
                            onCheckedChange={(c) => handlePlatformDataChange("youtube", "made_for_kids", c)}
                          />
                          <Label htmlFor="yt-kids">Made for kids</Label>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {activePlatforms.includes("instagram") && (
                    <AccordionItem value="instagram">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-pink-500" />
                          Instagram Reels
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4 px-1">
                        <div className="space-y-2">
                          <Label>Caption</Label>
                          <Textarea
                            placeholder="Write a caption..."
                            rows={4}
                            onChange={(e) => handlePlatformDataChange("instagram", "caption", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            placeholder="e.g. New York, NY"
                            onChange={(e) => handlePlatformDataChange("instagram", "location", e.target.value)}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Add similar accordion items for Facebook, TikTok, Threads, X */}
                  {activePlatforms.includes("tiktok") && (
                    <AccordionItem value="tiktok">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                          TikTok
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4 px-1">
                        <div className="space-y-2">
                          <Label>Caption</Label>
                          <Textarea
                            placeholder="Write a caption..."
                            rows={4}
                            onChange={(e) => handlePlatformDataChange("tiktok", "caption", e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="tk-stitch" defaultChecked onCheckedChange={(c) => handlePlatformDataChange("tiktok", "allow_stitch", c)} />
                            <Label htmlFor="tk-stitch">Allow Stitch</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="tk-duet" defaultChecked onCheckedChange={(c) => handlePlatformDataChange("tiktok", "allow_duet", c)} />
                            <Label htmlFor="tk-duet">Allow Duet</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {activePlatforms.includes("x") && (
                    <AccordionItem value="x">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-blue-400" />
                          X (Twitter)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4 px-1">
                        <div className="space-y-2">
                          <Label>Post Text</Label>
                          <Textarea
                            placeholder="What's happening?"
                            rows={4}
                            onChange={(e) => handlePlatformDataChange("x", "post_text", e.target.value)}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                      </>
                    );
                  })()}
                </Accordion>
              </CardContent>
              <CardFooter className="flex justify-end gap-4 border-t pt-6 mt-4">
                <Button variant="outline" onClick={() => handleSave("draft")} disabled={isUploading}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleSave("scheduled")} disabled={isUploading}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Posts
                </Button>
              </CardFooter>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
