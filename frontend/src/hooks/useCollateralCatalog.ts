import { useQuery } from "@tanstack/react-query";
import { fetchCollateralCatalog, isApiConfigured } from "@/lib/api";

export function useCollateralCatalog() {
  return useQuery({
    queryKey: ["collateral-catalog"],
    queryFn: fetchCollateralCatalog,
    enabled: isApiConfigured(),
    staleTime: 30_000,
  });
}
