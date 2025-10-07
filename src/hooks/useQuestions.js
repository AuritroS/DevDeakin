// src/hooks/useQuestions.js
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchQuestionsPage } from "../services/questions";

const DEFAULT_PAGE_SIZE = 20;

export function useQuestions(pageSize = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: ["questions", pageSize],
    queryFn: ({ pageParam }) =>
      fetchQuestionsPage({ pageParam, limit: pageSize }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
