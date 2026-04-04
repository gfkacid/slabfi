import { useQuery } from "@tanstack/react-query";
import {
  fetchProtocolStats,
  isApiConfigured,
  type ProtocolStatsResponse,
} from "@/lib/api";

export function useProtocolStats() {
  return useQuery({
    queryKey: ["protocol-stats"],
    queryFn: (): Promise<ProtocolStatsResponse> => fetchProtocolStats(),
    enabled: isApiConfigured(),
    staleTime: 15_000,
  });
}
