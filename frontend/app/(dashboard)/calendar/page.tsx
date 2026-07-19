"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";

import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduledPost } from "@/types";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const { data: posts, isLoading } = useQuery<ScheduledPost[]>({
    queryKey: ["calendar", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await api.get(`/calendar?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      return res.data;
    },
  });

  const nextMonth = () => setCurrentDate(addDays(monthEnd, 1));
  const prevMonth = () => setCurrentDate(addDays(monthStart, -1));

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      youtube: "bg-red-500",
      instagram: "bg-pink-500",
      facebook: "bg-blue-500",
      tiktok: "bg-neutral-900",
      threads: "bg-neutral-800",
      x: "bg-blue-400",
    };
    return colors[platform] || "bg-gray-500";
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Find posts for this day
        const dayPosts = posts?.filter(post => 
          post.schedule_datetime && isSameDay(parseISO(post.schedule_datetime), cloneDay)
        ) || [];

        days.push(
          <div
            className={`min-h-[120px] p-2 border border-muted/50 ${
              !isSameMonth(day, monthStart)
                ? "bg-muted/20 text-muted-foreground"
                : "bg-card"
            }`}
            key={day.toString()}
          >
            <div className="flex justify-end">
              <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? "bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center" : ""}`}>
                {formattedDate}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {isLoading ? (
                <Skeleton className="h-4 w-full mb-1" />
              ) : (
                dayPosts.map(post => (
                  <div key={post.id} className="text-xs truncate flex items-center gap-1 rounded bg-muted px-1.5 py-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${getPlatformColor(post.platform)} shrink-0`} />
                    <span className="truncate">{post.title || post.caption || post.post_text || "Untitled"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border border-muted/50 rounded-lg overflow-hidden">{rows}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground mt-1">View your scheduled content across all platforms.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground pb-2">
                {day}
              </div>
            ))}
          </div>
          
          {renderCells()}
        </CardContent>
      </Card>
    </div>
  );
}
