export interface HubContractAddresses {
  lendingPool: `0x${string}`;
  collateralRegistry: `0x${string}`;
  oracleConsumer: `0x${string}`;
  healthFactorEngine: `0x${string}`;
  liquidationManager: `0x${string}`;
  usdc: `0x${string}`;
  /** Protocol CCIP router on Arc; fund with native USDC for outbound unlock messages. */
  ccipMessageRouter: `0x${string}`;
  chainlinkAutomationKeeper: `0x${string}`;
}

export interface SepoliaContractAddresses {
  collateralAdapter: `0x${string}`;
  slabFinanceCollectible: `0x${string}`;
}
