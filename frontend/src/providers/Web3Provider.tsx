import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { protocolConfig } from "@slabfinance/shared";
import { evmAppChains, slabHubPlaceholder } from "@/lib/chains";
import { PostConnectHubChainSync } from "./PostConnectHubChainSync";

import "@solana/wallet-adapter-react-ui/styles.css";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const networks = [slabHubPlaceholder, ...evmAppChains];

const hubCaip = `eip155:${slabHubPlaceholder.id}`;
const eip155Ids = [String(slabHubPlaceholder.id), ...evmAppChains.map((c) => String(c.id))];
const rpcMap: Record<string, string> = {
  [hubCaip]: protocolConfig.hub.rpcUrl,
};
for (const c of evmAppChains) {
  rpcMap[`eip155:${c.id}`] = c.rpcUrls.default.http[0]!;
}

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  // @ts-expect-error viem chains are compatible with AppKitNetwork at runtime
  networks,
  defaultNetwork: slabHubPlaceholder,
  projectId,
  universalProviderConfigOverride: {
    chains: {
      eip155: eip155Ids,
    },
    rpcMap,
    defaultChain: hubCaip,
  },
  metadata: {
    name: "Slab.Finance",
    description: "Cross-chain lending for tokenized collectibles",
    url: typeof window !== "undefined" ? window.location.origin : "https://slab.finance",
    icons: ["https://slab.finance/icon.png"],
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  return (
    <ConnectionProvider endpoint={protocolConfig.hub.rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <PostConnectHubChainSync />
              {children}
            </QueryClientProvider>
          </WagmiProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
