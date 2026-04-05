import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { testnetConfig } from "@slabfinance/shared";
import { sepolia } from "@/lib/chains";
import { hubChain } from "@/lib/hub";
import { PostConnectHubChainSync } from "./PostConnectHubChainSync";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const networks = [hubChain, sepolia];

const hubCaip = `eip155:${hubChain.id}`;
const sepoliaCaip = `eip155:${sepolia.id}`;

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  // @ts-expect-error viem chains are compatible with AppKitNetwork at runtime
  networks,
  defaultNetwork: hubChain,
  projectId,
  universalProviderConfigOverride: {
    chains: {
      eip155: [String(hubChain.id), String(sepolia.id)],
    },
    rpcMap: {
      [hubCaip]: testnetConfig.hub.rpcUrl,
      [sepoliaCaip]: testnetConfig.source.rpcUrl,
    },
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
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PostConnectHubChainSync />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
