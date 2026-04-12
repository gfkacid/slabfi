export interface HubProgramIds {
  /** Unified hub program (`slab_hub` Anchor crate). */
  slabHub: string;
}

/** EVM lock path addresses for one chain (Polygon, Base, …). */
export interface EvmLockContractAddresses {
  collateralAdapter: `0x${string}`;
  collection: `0x${string}`;
}

/** @deprecated Use `EvmLockContractAddresses`; name kept for older imports. */
export type SepoliaContractAddresses = EvmLockContractAddresses;

/** @deprecated Hub is Solana; use `HubProgramIds` and `protocolConfig.hub`. */
export interface HubContractAddresses {
  lendingPool: `0x${string}`;
  collateralRegistry: `0x${string}`;
  oracleConsumer: `0x${string}`;
  healthFactorEngine: `0x${string}`;
  liquidationManager: `0x${string}`;
  usdc: `0x${string}`;
  ccipMessageRouter: `0x${string}`;
  chainlinkAutomationKeeper: `0x${string}`;
}
