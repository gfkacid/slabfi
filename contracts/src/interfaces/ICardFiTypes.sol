// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Message type selectors (first 4 bytes of keccak256)
bytes4 constant LOCK_NOTICE = bytes4(keccak256("LOCK_NOTICE"));
bytes4 constant UNLOCK_COMMAND = bytes4(keccak256("UNLOCK_COMMAND"));
bytes4 constant UNLOCK_CONFIRM = bytes4(keccak256("UNLOCK_CONFIRM"));

enum CollateralStatus {
    PENDING,      // LockNotice received, awaiting first oracle price
    ACTIVE,       // Priced and contributing to borrower's HF
    UNLOCK_SENT,  // UnlockCommand has been dispatched via CCIP
    RELEASED      // Confirmed released on source chain
}

enum PositionStatus {
    HEALTHY,      // HF > 1.30
    WARNING,      // 1.00 <= HF <= 1.30
    LIQUIDATABLE, // HF < 1.00
    CLOSED
}

struct CollateralItem {
    bytes32 id;               // keccak256(chainId, collection, tokenId)
    uint64 sourceChainId;     // CCIP chain selector of source chain
    address collection;       // NFT contract address on source chain
    uint256 tokenId;
    address owner;            // borrower address (on hub chain)
    uint256 lockedAt;         // block.timestamp when lock was confirmed
    CollateralStatus status;
}

struct Position {
    address borrower;
    bytes32[] collateralIds;   // all ACTIVE collateral items
    uint256 principal;         // USDC borrowed (18 decimals)
    uint256 interestAccrued;  // simple interest accumulator
    uint256 lastInterestUpdate;
    PositionStatus status;
}

struct PriceRecord {
    uint256 priceUSD;         // 8 decimals, e.g. 15000000000 = $150.00
    uint256 attestedAt;       // timestamp of Flare FDC attestation
    uint256 updatedAt;        // block.timestamp when stored on-chain
    bool disputed;           // flagged by Chainlink Functions circuit breaker
    uint8 tier;               // 1 = high liquidity, 2 = medium, 3 = illiquid
}

