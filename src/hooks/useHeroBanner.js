// src/hooks/useHeroBanner.js
import { useQuery } from "@tanstack/react-query";
import { fetchHeroBanner } from "../services/banner";

export function useHeroBanner() {
  return useQuery({
    queryKey: ["hero-banner"],
    queryFn: fetchHeroBanner,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    // show previous cached URL while refetching to avoid flicker
    keepPreviousData: true,
  });
}

