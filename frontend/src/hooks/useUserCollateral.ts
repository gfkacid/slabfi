import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  fetchCollateralByOwner,
  isApiConfigured,
  type CollateralItemJson,
} from "@/lib/api";

export function useUserCollateral() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["collateral-by-owner", address],
    queryFn: (): Promise<CollateralItemJson[]> =>
      fetchCollateralByOwner(address as string),
    enabled: Boolean(address && isApiConfigured()),
    staleTime: 10_000,
  });
}
