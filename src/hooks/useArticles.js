// hooks/useArticles.js
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchArticles } from "../services/articles";

export function useArticles() {
  return useInfiniteQuery({
    queryKey: ["articles"],
    queryFn: ({ pageParam }) => fetchArticles({ pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    staleTime: 1000 * 60, // 1 minute cache
  });
}
