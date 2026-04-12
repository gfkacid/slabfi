import type { HubProgramIds } from "../types/contracts";

/** Per-chain ERC-721 lock path (LayerZero adapter + vault + collection). */
export type EvmSourceContracts = {
  /** Courtyard / Beezie / other ERC-721 the adapter escrows. */
  collection: string;
  nftVault: string;
  collateralAdapterLayerZero: string;
};

export type EvmSourceConfig = {
  id: string;
  chainId: number;
  name: string;
  rpcUrl: string;
  /** LayerZero V2 endpoint id for this chain (mainnet `30xxx`). */
  lzEndpointId: number;
  contracts: EvmSourceContracts;
};

/**
 * Protocol configuration: Solana mainnet-beta hub + Polygon / Base (LayerZero sources).
 * RPC URLs are defaults; override with env in apps (`POLYGON_RPC_URL`, `BASE_RPC_URL`, …).
 */
export const protocolConfig = {
  hub: {
    family: "solana" as const,
    cluster: "mainnet-beta" as const,
    rpcUrl: "https://api.mainnet-beta.solana.com",
    blockExplorer: "https://explorer.solana.com",
    programs: {
      slabHub: "Fg6PaFpoGXkYsidJQWCH3S6H6DH8pS9Nxn52v5Z3r1Kv",
    } satisfies HubProgramIds,
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    whitelistedCollections: {
      collectorCrypt: {
        mint: "",
        kind: "pnft" as const,
      },
      phygitals: {
        mint: "",
        kind: "cnft" as const,
      },
    },
  },
  evmSources: {
    polygon: {
      id: "polygon",
      chainId: 137,
      name: "Polygon Mainnet",
      rpcUrl: "https://polygon-rpc.com",
      lzEndpointId: 30109,
      contracts: {
        // @slabfi-sync:evm-polygon-contracts-begin
        collection: "",
        nftVault: "",
        collateralAdapterLayerZero: "",
        // @slabfi-sync:evm-polygon-contracts-end
      },
    },
    base: {
      id: "base",
      chainId: 8453,
      name: "Base Mainnet",
      rpcUrl: "https://mainnet.base.org",
      lzEndpointId: 30184,
      contracts: {
        // @slabfi-sync:evm-base-contracts-begin
        collection: "",
        nftVault: "",
        collateralAdapterLayerZero: "",
        // @slabfi-sync:evm-base-contracts-end
      },
    },
  },
  integrations: {
    courtyard: {
      evmSourceId: "polygon" as const,
      label: "Courtyard",
      /** Reference Polygon ERC-721; keep in sync with `evmSources.polygon.contracts.collection` after deploy. */
      referenceErc721: "0x251be3a17af4892035c37ebf5890f4a4d889dcad" as const,
    },
    beezie: {
      evmSourceId: "base" as const,
      label: "Beezie",
      /** Reference Base ERC-721; keep in sync with `evmSources.base.contracts.collection` after deploy. */
      referenceErc721: "0xbb5ec6fd4b61723bd45c399840f1d868840ca16f" as const,
    },
  },
  layerzero: {
    /** Solana mainnet OApp destination EID. */
    solanaDstEid: 30168,
  },
} as const;

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export function hubProgramsFromConfig(): HubProgramIds {
  return { ...protocolConfig.hub.programs };
}

/** Collateral adapter + collection for an EVM chain (by EIP-155 chain id). */
export function evmContractsForChain(chainId: number): {
  collateralAdapter: `0x${string}`;
  collection: `0x${string}`;
} {
  const src = Object.values(protocolConfig.evmSources).find((s) => s.chainId === chainId);
  const adapter = (src?.contracts.collateralAdapterLayerZero || "").trim() || ZERO;
  const collection = (src?.contracts.collection || "").trim() || ZERO;
  return {
    collateralAdapter: adapter as `0x${string}`,
    collection: collection as `0x${string}`,
  };
}

/** @deprecated Use `evmContractsForChain` or `protocolConfig.evmSources`. */
export function sepoliaContractsFromConfig(): {
  collateralAdapter: `0x${string}`;
  slabFinanceCollectible: `0x${string}`;
} {
  const poly = protocolConfig.evmSources.polygon.contracts;
  const adapter = (poly.collateralAdapterLayerZero || "").trim() || ZERO;
  const collection = (poly.collection || "").trim() || ZERO;
  return {
    collateralAdapter: adapter as `0x${string}`,
    slabFinanceCollectible: collection as `0x${string}`,
  };
}

/** @deprecated Returns zero EVM addresses; hub logic lives in `hubProgramsFromConfig().slabHub`. */
export function hubContractsFromConfig(): import("../types/contracts").HubContractAddresses {
  return {
    lendingPool: ZERO,
    collateralRegistry: ZERO,
    oracleConsumer: ZERO,
    healthFactorEngine: ZERO,
    liquidationManager: ZERO,
    usdc: ZERO,
    ccipMessageRouter: ZERO,
    chainlinkAutomationKeeper: ZERO,
  };
}
