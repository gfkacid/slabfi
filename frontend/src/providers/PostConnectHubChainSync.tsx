import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAccount, useSwitchChain } from "wagmi";
import { hubChain } from "@/lib/hub";

/** After connect/reconnect, switch to hub unless the user is on /lock (EVM lock flow). */
export function PostConnectHubChainSync() {
  const { pathname } = useLocation();
  const { status } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const prevStatus = useRef<typeof status | undefined>(undefined);

  useEffect(() => {
    const becameConnected =
      prevStatus.current !== undefined &&
      prevStatus.current !== "connected" &&
      status === "connected";

    prevStatus.current = status;

    if (!becameConnected) return;
    if (pathname === "/lock") return;
    if (!switchChainAsync) return;

    void switchChainAsync({ chainId: hubChain.id }).catch(() => {});
  }, [status, pathname, switchChainAsync]);

  return null;
}
