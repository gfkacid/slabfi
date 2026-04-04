import { useQuery } from "@tanstack/react-query";
import { fetchAuctionHistory, isApiConfigured } from "@/lib/api";

export function useAuctionHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["auction-history", page, limit],
    queryFn: () => fetchAuctionHistory(page, limit),
    enabled: isApiConfigured(),
    staleTime: 15_000,
  });
}
