"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, Info } from "lucide-react";

import { api } from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from "@/types";

export default function LogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", page],
    queryFn: async () => {
      const res = await api.get(`/logs?page=${page}&per_page=50`);
      return res.data;
    },
  });

  const getActionIcon = (action: string) => {
    if (action.includes("FAILED") || action.includes("ERROR")) {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    if (action.includes("PUBLISHED") || action.includes("SUCCESS")) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>
          <p className="text-muted-foreground mt-1">Audit trail of all actions performed in your account.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.logs?.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-center p-6">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No activity logs found</h3>
              <p className="text-sm text-muted-foreground">
                Actions you perform will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {data?.logs?.map((log: ActivityLog) => (
                <div key={log.id} className="p-4 md:p-6 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.description}</span>
                        <Badge variant="outline" className="text-[10px] py-0">{log.action}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm:ss a")}
                      </span>
                    </div>
                    {log.metadata_json && Object.keys(log.metadata_json).length > 0 && (
                      <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto text-muted-foreground">
                        {JSON.stringify(log.metadata_json, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
