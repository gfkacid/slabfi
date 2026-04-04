import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import {
  fetchPosition,
  isApiConfigured,
  type PositionDetailResponse,
} from "@/lib/api";
import { hubChain } from "@/lib/hub";
import { useOutstandingDebt } from "./useLendingPool";

/**
 * Indexed position from API plus live outstanding debt on the hub when connected.
 */
export function useUserPosition() {
  const { address } = useAccount();
  const chainId = useChainId();
  const onHub = chainId === hubChain.id;

  const positionQuery = useQuery({
    queryKey: ["position-detail", address],
    queryFn: (): Promise<PositionDetailResponse> =>
      fetchPosition(address as string),
    enabled: Boolean(address && isApiConfigured()),
    staleTime: 10_000,
  });

  const outstanding = useOutstandingDebt();
  const debtTuple = outstanding.data;

  return {
    address,
    onHub,
    ...positionQuery,
    outstanding,
    liveTotalDebt: onHub ? debtTuple?.[2] : undefined,
    livePrincipal: onHub ? debtTuple?.[0] : undefined,
    liveInterest: onHub ? debtTuple?.[1] : undefined,
  };
}
