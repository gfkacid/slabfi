export const LENDING_POOL_ABI = [
  { inputs: [{ name: "amount", type: "uint256" }], name: "borrow", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "amount", type: "uint256" }], name: "repay", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "amount", type: "uint256" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "shares", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
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
  { inputs: [], name: "totalReserves", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBorrows", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupplyShares", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOfShares", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "availableLiquidity", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "assets", type: "uint256" }], name: "previewDeposit", outputs: [{ name: "shares", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "shares", type: "uint256" }], name: "previewWithdraw", outputs: [{ name: "assets", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "exchangeRate", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "utilization", outputs: [{ name: "uWad", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentBorrowAPR", outputs: [{ name: "annualBPS", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentSupplyAPR", outputs: [{ name: "annualBPS", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export const COLLATERAL_REGISTRY_ABI = [
  { inputs: [{ name: "borrower", type: "address" }], name: "availableCredit", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "borrower", type: "address" }], name: "getPosition", outputs: [{ name: "", type: "tuple", components: [{ name: "borrower", type: "address" }, { name: "collateralIds", type: "bytes32[]" }, { name: "principal", type: "uint256" }, { name: "interestAccrued", type: "uint256" }, { name: "lastInterestUpdate", type: "uint256" }, { name: "status", type: "uint8" }] }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "collateralId", type: "bytes32" }], name: "getCollateralItem", outputs: [{ name: "", type: "tuple", components: [{ name: "id", type: "bytes32" }, { name: "sourceChainId", type: "uint64" }, { name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "owner", type: "address" }, { name: "lockedAt", type: "uint256" }, { name: "status", type: "uint8" }] }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "collateralId", type: "bytes32" }], name: "initiateUnlock", outputs: [{ name: "", type: "bytes32" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "collateralId", type: "bytes32" }], name: "activateCollateral", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "HF_ENGINE_ROLE", outputs: [{ name: "", type: "bytes32" }], stateMutability: "pure", type: "function" },
  { inputs: [], name: "DEFAULT_ADMIN_ROLE", outputs: [{ name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const HEALTH_FACTOR_ENGINE_ABI = [
  { inputs: [{ name: "collateralValuesUSD", type: "uint256[]" }, { name: "tiers", type: "uint8[]" }, { name: "totalDebtUSD", type: "uint256" }], name: "previewHealthFactor", outputs: [{ name: "", type: "uint256" }], stateMutability: "pure", type: "function" },
  { inputs: [{ name: "borrower", type: "address" }], name: "getHealthFactor", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "borrower", type: "address" }], name: "getPositionStatus", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "borrower", type: "address" }],
    name: "recomputePosition",
    outputs: [
      { name: "healthFactor", type: "uint256" },
      { name: "newStatus", type: "uint8" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ORACLE_CONSUMER_ABI = [
  { inputs: [{ name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }], name: "getPrice", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
    ],
    name: "prices",
    outputs: [
      { name: "priceUSD", type: "uint256" },
      { name: "attestedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "tier", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "priceUSD", type: "uint256" },
      { name: "tier", type: "uint8" },
    ],
    name: "setMockPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [{ name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }], name: "getEffectiveLTV", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "isInStalenessPenaltyWindow",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "tokenTier",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/** AuctionLiquidationManager (hub) — per-card auctions */
export const LIQUIDATION_MANAGER_ABI = [
  { inputs: [], name: "activeAuctionIds", outputs: [{ name: "", type: "bytes32[]" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "", type: "bytes32" }],
    name: "auctions",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "borrower", type: "address" },
          { name: "collateralId", type: "bytes32" },
          { name: "startedAt", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "reservePrice", type: "uint256" },
          { name: "debtShareSnapshot", type: "uint256" },
          { name: "feeSnapshot", type: "uint256" },
          { name: "highestBid", type: "uint256" },
          { name: "highestBidder", type: "address" },
          { name: "settled", type: "bool" },
          { name: "cancelled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "minBidIncrementBPS", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [
      { name: "auctionId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    name: "placeBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [{ name: "auctionId", type: "bytes32" }], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "auctionId", type: "bytes32" },
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "winningBid", type: "uint256" },
      { indexed: false, name: "debtToPool", type: "uint256" },
      { indexed: false, name: "feeToTreasury", type: "uint256" },
      { indexed: false, name: "excessToPool", type: "uint256" },
      { indexed: false, name: "excessToTreasury", type: "uint256" },
    ],
    name: "AuctionSettled",
    type: "event",
  },
] as const;

export const COLLATERAL_ADAPTER_VIEW_ABI = [
  {
    inputs: [],
    name: "collection",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "chainSelector",
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const COLLATERAL_ADAPTER_ABI = [
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
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "hubOwner", type: "address" },
    ],
    name: "quoteCcipFee",
    outputs: [{ name: "fee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [{ name: "tokenId", type: "uint256" }, { name: "hubOwner", type: "address" }], name: "lockAndNotify", outputs: [{ name: "", type: "bytes32" }], stateMutability: "payable", type: "function" },
] as const;

/** IERC165 + minimal ERC-721 for Courtyard / Beezie and other standard collections. */
export const ERC721_STANDARD_ABI = [
  {
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
] as const;

/** OpenZeppelin IERC721Enumerable — interface id `0x780e9d63`. */
export const IERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63" as const;

export const SLAB_COLLECTIBLE_ABI = [
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "cardMetadata",
    outputs: [
      { name: "cardName", type: "string" },
      { name: "cardImage", type: "string" },
      { name: "setName", type: "string" },
      { name: "cardNumber", type: "string" },
      { name: "cardRarity", type: "string" },
      { name: "cardPrinting", type: "string" },
      { name: "gradeService", type: "string" },
      { name: "grade", type: "uint16" },
      { name: "tier", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;
