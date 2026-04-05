import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCollateralCatalog, isApiConfigured, type CollateralItemJson } from "@/lib/api";

export function useCollateralCatalog() {
  return useQuery({
    queryKey: ["collateral-catalog"],
    queryFn: fetchCollateralCatalog,
    enabled: isApiConfigured(),
    staleTime: 30_000,
  });
}

/** Match hub `collateralId` (bytes32) to a catalog row when `VITE_API_BASE` is set. */
export function useCatalogCollateralItem(
  collateralId: `0x${string}` | undefined,
): CollateralItemJson | undefined {
  const { data: catalog } = useCollateralCatalog();
  const key = collateralId?.toLowerCase();
  return useMemo(() => {
    if (!key || !catalog?.length) return undefined;
    return catalog.find((c) => c.id.toLowerCase() === key);
  }, [key, catalog]);
}
