export const LENDING_POOL_EVENTS_ABI = [
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "sharesMinted", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "sharesBurned", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Borrowed",
    inputs: [
      { name: "borrower", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Repaid",
    inputs: [
      { name: "borrower", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fullyRepaid", type: "bool", indexed: false },
    ],
  },
] as const;

export const COLLATERAL_REGISTRY_EVENTS_ABI = [
  {
    type: "event",
    name: "CollateralRegistered",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "sourceChainId", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CollateralStatusChanged",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "newStatus", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UnlockInitiated",
    inputs: [
      { name: "collateralId", type: "bytes32", indexed: true },
      { name: "ccipMessageId", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const AUCTION_MANAGER_EVENTS_ABI = [
  {
    type: "event",
    name: "AuctionQueued",
    inputs: [
      { name: "auctionId", type: "bytes32", indexed: true },
      { name: "borrower", type: "address", indexed: true },
      { name: "collateralId", type: "bytes32", indexed: true },
      { name: "reservePrice", type: "uint256", indexed: false },
      { name: "debtShareSnapshot", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BidPlaced",
    inputs: [
      { name: "auctionId", type: "bytes32", indexed: true },
      { name: "bidder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "newDeadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AuctionSettled",
    inputs: [
      { name: "auctionId", type: "bytes32", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "winningBid", type: "uint256", indexed: false },
      { name: "debtToPool", type: "uint256", indexed: false },
      { name: "feeToTreasury", type: "uint256", indexed: false },
      { name: "excessToPool", type: "uint256", indexed: false },
      { name: "excessToTreasury", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AuctionCancelled",
    inputs: [{ name: "auctionId", type: "bytes32", indexed: true }],
  },
  {
    type: "event",
    name: "BidRefunded",
    inputs: [
      { name: "auctionId", type: "bytes32", indexed: true },
      { name: "bidder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ORACLE_CONSUMER_EVENTS_ABI = [
  {
    type: "event",
    name: "PriceUpdated",
    inputs: [
      { name: "collection", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "newPrice", type: "uint256", indexed: false },
      { name: "attestedAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PriceDisputed",
    inputs: [
      { name: "collection", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "primaryPrice", type: "uint256", indexed: false },
      { name: "secondaryPrice", type: "uint256", indexed: false },
      { name: "deviationBps", type: "uint256", indexed: false },
    ],
  },
] as const;

export const NFT_VAULT_EVENTS_ABI = [
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "collateralId", type: "bytes32", indexed: true },
      { name: "collection", type: "address", indexed: false },
      { name: "tokenId", type: "uint256", indexed: false },
      { name: "owner", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Released",
    inputs: [
      { name: "collateralId", type: "bytes32", indexed: true },
      { name: "recipient", type: "address", indexed: false },
    ],
  },
] as const;

export const COLLATERAL_ADAPTER_EVENTS_ABI = [
  {
    type: "event",
    name: "Locked",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "ccipMessageId", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Unlocked",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: false },
    ],
  },
] as const;

export const LENDING_POOL_READ_ABI = [
  {
    inputs: [{ name: "borrower", type: "address" }],
    name: "outstandingDebt",
    outputs: [
      { name: "principal", type: "uint256" },
      { name: "interest", type: "uint256" },
      { name: "total", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "totalAssets", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBorrows", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "utilization", outputs: [{ name: "uWad", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentBorrowAPR", outputs: [{ name: "annualBPS", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentSupplyAPR", outputs: [{ name: "annualBPS", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "exchangeRate", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupplyShares", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;
