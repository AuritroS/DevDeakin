import { useQuery } from "@tanstack/react-query";
import { fetchArticle } from "../services/articles";

export function useArticle(id) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchArticle(id),
    enabled: !!id, // only fetch if id is available
    staleTime: 1000 * 60, // cache for 1 min
  });
}
