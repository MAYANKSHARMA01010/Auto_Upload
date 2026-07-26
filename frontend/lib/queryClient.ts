import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes fresh data
      gcTime: 15 * 60 * 1000,   // 15 minutes cache garbage collection
    },
  },
});

export const CACHE_KEYS = {
  ACCOUNTS: ["accounts"],
  ANALYTICS: ["analytics"],
  SCHEDULED_POSTS: ["scheduled_posts"],
  USER_PROFILE: ["user_profile"],
} as const;
