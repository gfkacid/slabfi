import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchActivity, isApiConfigured } from "@/lib/api";

export function useActivityFeed(page = 1, limit = 20) {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["activity-feed", address, page, limit],
    queryFn: () => fetchActivity(address as string, page, limit),
    enabled: Boolean(address && isApiConfigured()),
    staleTime: 15_000,
  });
}
