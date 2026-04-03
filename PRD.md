# Slab.Finance — Technical Specification
**Version:** 0.1.0-draft  
**Last Updated:** 2026-04-03  
**Status:** Pre-implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Glossary](#2-glossary)
3. [System Architecture](#3-system-architecture)
4. [Smart Contract Specifications](#4-smart-contract-specifications)
   - 4.1 [Hub Chain Contracts (Arc)](#41-hub-chain-contracts-arc)
   - 4.2 [Source Chain Contracts](#42-source-chain-contracts)
   - 4.3 [Contract Interface Catalogue](#43-contract-interface-catalogue)
5. [Oracle System](#5-oracle-system)
   - 5.1 [Chainlink CRE Price Workflow](#51-chainlink-cre-price-workflow)
   - 5.2 [Staleness & Health Factor Model](#52-staleness--health-factor-model)
   - 5.3 [Volatility-Adjusted LTV](#53-volatility-adjusted-ltv)
6. [Cross-Chain Messaging](#6-cross-chain-messaging)
   - 6.1 [CCIP Message Schemas](#61-ccip-message-schemas)
   - 6.2 [Message Lifecycle & State Machine](#62-message-lifecycle--state-machine)
   - 6.3 [Adding a New Source Chain](#63-adding-a-new-source-chain)
7. [Liquidation Engine](#7-liquidation-engine)
8. [Data Models](#8-data-models)
9. [Access Control & Roles](#9-access-control--roles)
10. [Error Handling & Edge Cases](#10-error-handling--edge-cases)
11. [Frontend & SDK](#11-frontend--sdk)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment Runbook](#13-deployment-runbook)
14. [Hackathon Scope vs. Future Work](#14-hackathon-scope-vs-future-work)
15. [Open Questions](#15-open-questions)

---

## 1. Overview

### 1.1 Summary

Slab.Finance is a cross-chain lending protocol that accepts tokenized physical collectibles (e.g. TCG cards on a source chain) as collateral in exchange for USDC loans. **Liquidity providers deposit USDC** into a hub vault; **borrow APR** adjusts with **vault utilization**. The protocol's liquidity and accounting live on **Arc** (Circle's L1), while collateral can be locked across multiple source chains. Chainlink CCIP carries collateral proof messages between source chains and Arc. Card **USD value** and **suggested LTV** come from **`EXTERNAL_PRICE_API`** (see §5.1); on-chain prices are ingested via **Chainlink CRE** workflows that fetch that API under DON consensus and deliver signed reports to **`OracleConsumer`** through **KeystoneForwarder**.

### 1.2 Design Principles

- **Extensibility first.** Every source chain integration is encapsulated behind a `ICollateralAdapter` interface. Adding a new chain or tokenization partner is a new adapter deployment, not a protocol upgrade.
- **Oracle conservatism.** Because collectible prices update infrequently, the system is designed to be safe under stale data: conservative LTV tiers, two-zone health factors, and **per-card liquidation auctions** with anti-sniping (see §7).
- **Minimal trust surface.** Price data is delivered via Chainlink CRE (consensus-verified HTTP + signed on-chain reports), not pushed by an arbitrary admin key. Cross-chain messages are carried by CCIP, not a custom relayer.
- **Human-readable transactions.** All user-facing contract functions are covered by ERC-7730 Clear Signing descriptors so hardware wallet users see plain-English summaries, not hex calldata.
- **USDC-native.** All loans, repayments, and liquidations are denominated in USDC via Circle's native stablecoin on Arc.

### 1.3 In-Scope (Hackathon)

- Hub chain contracts on Arc testnet
- Source chain contracts on Polygon (or testnet) for the initial NFT collection
- Chainlink CRE workflow pushing **EXTERNAL_PRICE_API** results to `OracleConsumer` (or `setMockPrice` for dev)
- Chainlink CCIP for lock/unlock messages
- Chainlink Automation for post-oracle health factor sweep
- Reown AppKit frontend with borrow/repay/collateral UI, **vault deposit/withdraw**, and **utilization-based APR** display
- ERC-7730 clear signing descriptors for all public functions

### 1.4 Out-of-Scope (Hackathon)

- Additional source chains (Ronin, Base, Ethereum)
- Additional tokenization partners
- Governance token / DAO
- Native mobile app
- Insurance/risk fund

---

## 2. Glossary

| Term | Definition |
|---|---|
| **Hub Chain** | Arc — the chain where the lending pool, collateral registry, and all accounting live |
| **Source Chain** | Any chain where collateral NFTs reside (currently Polygon) |
| **CollateralAdapter** | A source-chain contract that locks NFTs and sends CCIP messages to the hub |
| **CollateralRegistry** | Hub contract that records all cross-chain collateral positions |
| **Health Factor (HF)** | Ratio of weighted collateral value to outstanding debt. HF < 1.0 = undercollateralized |
| **LTV** | Loan-to-Value ratio. The max fraction of collateral value that can be borrowed |
| **Effective LTV** | Max borrow as a fraction of collateral value: tier / API-suggested LTV, clamped on-chain, then volatility haircut (§5.3) |
| **EXTERNAL_PRICE_API** | HTTP API returning `priceUSD`, `ltvBPS`, and metadata for a `(collection, tokenId)` before lock and for the CRE price workflow |
| **Vault share** | Pro-rata claim on `LendingPool` USDC (assets + accrued borrow interest), minted on `deposit`, burned on `withdraw` |
| **Utilization** | `totalBorrowed / totalAssets` — drives dynamic borrow and supply APR |
| **Oracle Price** | The latest attested daily market price for a specific card (token ID) in USD |
| **Price Epoch** | The daily window during which an oracle price is considered fresh (0–24h) |
| **Attestation** | The timestamped price record on `OracleConsumer` after a CRE-signed report (or mock) |
| **Liquidation auction** | Per-card USDC auction when HF &lt; 1; anti-sniping extends the deadline; settlement via `claim` (see §7 and [specs/liquidation-auctions.md](specs/liquidation-auctions.md)) |
| **Nullifier** | A World ID commitment; not used in this protocol but referenced for future sybil-resistance |
| **CCIP** | Chainlink Cross-Chain Interoperability Protocol — the message transport layer |
| **CRE** | Chainlink Runtime Environment — workflows, triggers, and DON consensus for off-chain + on-chain orchestration |
| **KeystoneForwarder** | Chainlink contract that validates signed CRE reports and calls `IReceiver.onReport` on the consumer |
| **ERC-7730** | An Ethereum standard for machine-readable transaction metadata enabling clear signing |
| **Position** | A single borrower's aggregate loan state: all their locked collateral + outstanding debt |

---

## 3. System Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SOURCE CHAIN (Polygon)                          │
│                                                                              │
│   User Wallet ──► CollateralAdapter (collection-specific)                    │
│                        │  lockNFT(tokenId)                                  │
│                        │  unlockNFT(tokenId, recipient)                     │
│                        │                                                    │
│                   NFT Vault (holds escrowed NFTs)                           │
└─────────────────────────┬───────────────────────────────────────────────────┘
                           │
                    CCIP Message
                    (LockNotice / UnlockCommand)
                           │
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                              HUB CHAIN (Arc)                                 │
│                                                                              │
│  ┌─────────────────────┐     ┌──────────────────────────┐                  │
│  │  CollateralRegistry │◄────│  CCIPMessageRouter       │                  │
│  │  - positions[]      │     │  - validates sender       │                  │
│  │  - collateral[]     │     │  - routes by messageType  │                  │
│  └──────────┬──────────┘     └──────────────────────────┘                  │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐     ┌──────────────────────────┐                  │
│  │  HealthFactorEngine │◄────│  OracleConsumer           │                  │
│  │  - computeHF()      │     │  - latestPrices[]         │                  │
│  │  - flagPositions()  │     │  - priceHistory[]         │                  │
│  └──────────┬──────────┘     │  - onReport() (CRE)      │                  │
│             │                └────────────┬─────────────┘                  │
│             ▼                             │                                  │
│  ┌─────────────────────┐         Chainlink CRE price report               │
│  │  LendingPool        │                                                    │
│  │  - deposit/withdraw │     ┌──────────────────────────┐                  │
│  │  - borrow/repay     │     │  AuctionLiquidationMgr   │                  │
│  │  - vault shares     │◄────│  - per-card USDC bids    │                  │
│  │  - util-based APR   │     │  - placeBid / claim      │                  │
│  └─────────────────────┘     │  - anti-sniping timer    │                  │
│                               └──────────────────────────┘                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │  Chainlink Automation Keeper                          │                  │
│  │  - checkUpkeep(): scans positions after price update │                  │
│  │  - performUpkeep(): calls flagPositions() in batch   │                  │
│  └──────────────────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORACLE LAYER                                    │
│                                                                              │
│  EXTERNAL_PRICE_API    ──► CRE workflow (HTTP + report) ──► OracleConsumer   │
│  (USDC/USD feeds)      ──► Optional future data feeds ──► OracleConsumer    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Contract Deployment Map

| Contract | Chain | Upgradeable |
|---|---|---|
| `CollateralRegistry` | Arc | Yes (UUPS) |
| `HealthFactorEngine` | Arc | Yes (UUPS) |
| `LendingPool` | Arc | Yes (UUPS) |
| `OracleConsumer` | Arc | Yes (UUPS) |
| `AuctionLiquidationManager` | Arc | Yes (UUPS) |
| `CCIPMessageRouter` | Arc | No |
| `CollateralAdapter_Courtyard` | Polygon | No |
| `NFTVault_Courtyard` | Polygon | No |

All hub contracts use OpenZeppelin UUPS proxy pattern. Source chain contracts are intentionally non-upgradeable — if a source chain contract needs to change, a new adapter is deployed and registered.

### 3.3 Protocol Flow (Happy Path)

**Borrow flow:**
1. User calls `CollateralAdapter.lockAndNotify(tokenId)` on Polygon
2. Adapter transfers NFT to `NFTVault`, emits CCIP `LockNotice` message to Arc
3. `CCIPMessageRouter` on Arc receives message, calls `CollateralRegistry.registerCollateral()`
4. `CollateralRegistry` calls `OracleConsumer.getPrice(collection, tokenId)` to get latest attested price
5. `HealthFactorEngine.recomputePosition(borrower)` is called; HF and borrowable amount updated
6. User calls `LendingPool.borrow(amount)` on Arc; USDC transferred to user wallet

**Repay & unlock flow:**
1. User approves USDC and calls `LendingPool.repay(amount)` on Arc
2. If loan fully repaid, user calls `CollateralRegistry.initiateUnlock(collateralId)`
3. `CCIPMessageRouter` sends `UnlockCommand` to source chain
4. `CollateralAdapter` on Polygon receives command, calls `NFTVault.release(tokenId, user)`
5. NFT returned to user wallet on Polygon

---

## 4. Smart Contract Specifications

### 4.1 Hub Chain Contracts (Arc)

---

#### `CollateralRegistry.sol`

**Responsibility:** Central accounting ledger for all cross-chain collateral positions.

**Storage:**

```solidity
// Unique ID for each piece of locked collateral
struct CollateralItem {
    bytes32 id;               // keccak256(chainId, collection, tokenId)
    uint64  sourceChainId;    // CCIP chain selector of source chain
    address collection;       // NFT contract address on source chain
    uint256 tokenId;
    address owner;            // borrower address (on hub chain)
    uint256 lockedAt;         // block.timestamp when lock was confirmed
    CollateralStatus status;
}

enum CollateralStatus {
    PENDING,      // LockNotice received, awaiting first oracle price
    ACTIVE,       // Priced and contributing to borrower's HF
    UNLOCK_SENT,  // UnlockCommand has been dispatched via CCIP
    RELEASED      // Confirmed released on source chain
}

// Per-borrower position aggregate
struct Position {
    address borrower;
    bytes32[] collateralIds;      // all ACTIVE collateral items
    uint256   principal;          // USDC borrowed (18 decimals)
    uint256   interestAccrued;    // simple interest accumulator
    uint256   lastInterestUpdate;
    PositionStatus status;
}

enum PositionStatus { HEALTHY, WARNING, LIQUIDATABLE, CLOSED }

mapping(bytes32 => CollateralItem) public collateralItems;
mapping(address => Position)       public positions;
mapping(bytes32 => bool)           public processedMessages; // replay protection
```

**Key Functions:**

```solidity
/// Called by CCIPMessageRouter after validating a LockNotice message
function registerCollateral(
    uint64  sourceChainId,
    address collection,
    uint256 tokenId,
    address owner
) external onlyRouter returns (bytes32 collateralId);

/// Called by borrower to start the unlock flow (requires position healthy)
function initiateUnlock(bytes32 collateralId)
    external
    returns (bytes32 ccipMessageId);

/// Called by AuctionLiquidationManager after a winning auction is settled (`claim`) to seize collateral
function seizeLiquidatedCollateral(
    bytes32 collateralId,
    address liquidator
) external onlyLiquidationManager;

/// View: returns borrowable amount remaining for a borrower
function availableCredit(address borrower)
    external view returns (uint256 usdcAmount);
```

**Events:**

```solidity
event CollateralRegistered(bytes32 indexed id, address indexed owner, uint64 sourceChainId);
event CollateralStatusChanged(bytes32 indexed id, CollateralStatus newStatus);
event UnlockInitiated(bytes32 indexed collateralId, bytes32 ccipMessageId);
```

---

#### `OracleConsumer.sol`

**Responsibility:** Ingests and stores price data from Chainlink CRE (`IReceiver.onReport`). Acts as the single source of truth for collateral valuations.

**Storage:**

```solidity
struct PriceRecord {
    uint256 priceUSD;        // 8 decimals, e.g. 15000000000 = $150.00
    uint256 attestedAt;      // timestamp when price was attested (CRE report or mock)
    uint256 updatedAt;       // block.timestamp when stored on-chain
    uint8   tier;            // 1 = high liquidity, 2 = medium, 3 = illiquid
}

// collection address (source chain) → tokenId → latest price
mapping(address => mapping(uint256 => PriceRecord)) public prices;

// collection → tokenId → rolling daily history (last 30 entries)
mapping(address => mapping(uint256 => uint256[30])) public priceHistory;
mapping(address => mapping(uint256 => uint8))       public historyIndex;

uint256 public constant PRICE_FRESHNESS_WINDOW = 26 hours; // 24h + 2h grace
```

**Key Functions:**

```solidity
/// Chainlink CRE / KeystoneForwarder — report is abi.encode(collection, tokenId, priceUSD)
function onReport(bytes calldata metadata, bytes calldata report) external;

/// Returns latest price; reverts if stale
function getPrice(address collection, uint256 tokenId)
    external view returns (uint256 priceUSD, uint256 age);

/// Returns 30-day rolling std deviation (in basis points) for volatility haircut
function getPriceVolatility(address collection, uint256 tokenId)
    external view returns (uint256 sigmaBps);

/// Admin: set tier for a collection (governance action post-hackathon)
function setCollectionTier(address collection, uint8 tier)
    external onlyOwner;
```

**LTV Configuration (storage):**

```solidity
// Base LTV by tier (BPS)
uint256[4] public baseLTV = [0, 4000, 2500, 1500]; // index 0 unused; tiers 1-3

// Absolute LTV floor (volatility haircut cannot reduce below this)
uint256 public constant MIN_LTV_BPS = 500; // 5%

// Liquidation thresholds by tier
uint256[4] public liquidationThreshold = [0, 8000, 8500, 9000];
// i.e. for tier 1: liquidate when debt > 80% of collateral value (HF < 1.25)
```

---

#### `HealthFactorEngine.sol`

**Responsibility:** Stateless computation engine. Reads from `CollateralRegistry` and `OracleConsumer`, writes position status back to `CollateralRegistry`.

**Key Functions:**

```solidity
/// Recompute health factor for a single borrower; called after any state change
function recomputePosition(address borrower)
    external
    returns (uint256 healthFactor, PositionStatus newStatus);

/// Batch sweep called by Chainlink Automation after each oracle update
/// positions: array of borrowers to check
/// Returns list of borrowers that changed status
function sweepPositions(address[] calldata borrowers)
    external
    returns (address[] memory changed);

/// Pure view: compute HF from raw inputs (used by frontend)
function previewHealthFactor(
    uint256[] calldata collateralValuesUSD,
    uint8[]   calldata tiers,
    uint256   totalDebtUSD
) external pure returns (uint256 healthFactor);
```

**Health Factor Formula:**

```
Weighted Collateral Value = Σ (price_i × effectiveLTV_i)

effectiveLTV_i = max(baseLTV_tier_i × (1 - σ_30d_i), MIN_LTV_BPS)
               where σ_30d_i = 30-day rolling std dev of daily prices (in BPS / 10000)

Health Factor = Weighted Collateral Value / (principal + interestAccrued)

Status:
  HF > 1.30  → HEALTHY
  1.00 ≤ HF ≤ 1.30  → WARNING
  HF < 1.00  → LIQUIDATABLE (per-card auctions queued in AuctionLiquidationManager; see §7)
```

---

#### `LendingPool.sol`

**Responsibility:** Holds USDC from **open vault deposits** (share-based liquidity providers), originates **variable-rate** loans to borrowers, and accrues borrow interest into pool assets so depositors earn pro-rata yield.

**Utilization & rates:**

```
utilization = totalBorrowed / totalAssets   // 0 if totalAssets == 0; cap at 1e18 fixed-point

Below optimal utilization (e.g. util ≤ 80%):
  borrowAPR_BPS = baseRateBPS + (utilization * slope1BPS) / 1e18

Above optimal:
  excessUtil = utilization - optimalUtilizationBPS (scaled consistently)
  borrowAPR_BPS = baseRateBPS + slope1BPS + (excessUtil * slope2BPS) / excessDenom

supplyAPR_BPS = borrowAPR_BPS * utilization / 1e18 * (10000 - protocolFeeBPS) / 10000
```

Rates are defined as **annual BPS** in configuration; implementation converts to **per-second** accrual for `block.timestamp` updates. Before any state change that affects assets, shares, or debt, the pool calls `_accrue()` to (1) compound borrower interest into `totalBorrowed` / per-borrower accounting and (2) increase **totalAssets** implied by outstanding debt so depositor **share price** rises with interest paid by borrowers.

**Storage (illustrative):**

```solidity
IERC20 public usdc;
CollateralRegistry public collateralRegistry;

// Depositor vault (ERC-4626–style accounting)
mapping(address => uint256) public balanceOfShares;
uint256 public totalShares;

// Borrow side
mapping(address => uint256) public principal;
mapping(address => uint256) public interestAccrued;
mapping(address => uint256) public lastInterestUpdate;
uint256 public totalBorrowed; // aggregate principal; interest accrual updates this / internal index per implementation

// Interest rate model (governance-set)
uint256 public baseRateBPS;
uint256 public optimalUtilizationBPS; // e.g. 8000 = 80%
uint256 public slope1BPS;
uint256 public slope2BPS;
uint256 public protocolFeeBPS; // reserve factor: portion of borrow interest retained by protocol / treasury
```

**Key Functions:**

```solidity
/// Deposit USDC; mint vault shares pro-rata to current totalAssets / totalShares
/// First depositor: 1:1 shares to assets (or defined initial exchange rate)
function deposit(uint256 amount) external;

/// Burn shares; receive USDC. Reverts if idle USDC < amount to pay (insufficient liquidity)
function withdraw(uint256 shares) external;

/// Borrow USDC against registered collateral; accrues first; checks availableCredit
function borrow(uint256 amount) external;

/// Repay debt; USDC stays in pool (increases idle, reduces debt), accrues first
function repay(uint256 amount) external;

/// Called by AuctionLiquidationManager after USDC (debt portion) is sent to the pool; reduces debt without transferFrom
function partialClearDebt(address borrower, uint256 amount) external onlyLiquidator;

function outstandingDebt(address borrower)
    external view returns (uint256 principal, uint256 interest, uint256 total);

/// Views for frontend
function totalAssets() external view returns (uint256); // idle USDC + totalBorrowed (post-accrual math)
function exchangeRate() external view returns (uint256); // assets per share (1e18 scaled)
function previewDeposit(uint256 assets) external view returns (uint256 shares);
function previewWithdraw(uint256 shares) external view returns (uint256 assets);
function currentBorrowAPR() external view returns (uint256 annualBPS);
function currentSupplyAPR() external view returns (uint256 annualBPS);
function utilization() external view returns (uint256); // fixed-point 0–1e18

/// Optional: admin seed or parameter updates
function setInterestRateParams(uint256 base, uint256 optimal, uint256 s1, uint256 s2, uint256 feeBps) external onlyOwner;
```

**Events:**

```solidity
event Deposited(address indexed depositor, uint256 assets, uint256 sharesMinted);
event Withdrawn(address indexed depositor, uint256 assets, uint256 sharesBurned);
event Borrowed(address indexed borrower, uint256 amount);
event Repaid(address indexed borrower, uint256 amount, bool fullyRepaid);
```

---

#### `AuctionLiquidationManager.sol`

**Responsibility:** When HF &lt; 1, queues **one auction per ACTIVE collateral** for a borrower. Bidders lock USDC in the contract (`placeBid`). After the deadline (with **anti-sniping** extensions on late bids), anyone calls `claim` to: transfer the card’s **proportional debt share** to `LendingPool` and call `partialClearDebt`, send the **liquidation fee** (BPS of debt share, snapshotted at queue time) **directly to treasury**, split **excess** bid amount per `surplusShareBPS` between pool and treasury, refund losing bidders, and `seizeLiquidatedCollateral` to the winner (CCIP unlock). If the borrower cures (HF ≥ 1), `cancelAllAuctionsForBorrower` refunds all bids.

**Configurable admin parameters (storage + setters):** `auctionDuration`, `minBidIncrementBPS`, `liquidationFeeBPS`, `antiSnipingWindow`, `surplusShareBPS`, `treasury`.

**Key Functions:**

```solidity
function queueLiquidation(address borrower, bytes32 collateralId) external onlyHF_ENGINE_ROLE;
function cancelAllAuctionsForBorrower(address borrower) external onlyHF_ENGINE_ROLE;
function placeBid(bytes32 auctionId, uint256 amount) external;
function claim(bytes32 auctionId) external;
function activeAuctionIds() external view returns (bytes32[] memory);
```

**Product spec:** [specs/liquidation-auctions.md](specs/liquidation-auctions.md).

---

#### `CCIPMessageRouter.sol`

**Responsibility:** Single entry/exit point for all CCIP messages. Routes inbound messages to correct handler. Constructs and sends outbound messages.

**Storage:**

```solidity
IRouterClient public ccipRouter; // Chainlink CCIP router on Arc

// sourceChainSelector => trusted adapter address
mapping(uint64 => address) public trustedAdapters;

// messageType => handler contract on hub
mapping(bytes4 => address) public messageHandlers;
```

**Registered Message Types:**

```solidity
bytes4 constant LOCK_NOTICE     = bytes4(keccak256("LOCK_NOTICE"));
bytes4 constant UNLOCK_CONFIRM  = bytes4(keccak256("UNLOCK_CONFIRM"));
```

**Key Functions:**

```solidity
/// Receive and route inbound CCIP messages (implements CCIPReceiver)
function ccipReceive(Client.Any2EVMMessage calldata message)
    external override onlyCCIPRouter;

/// Send UnlockCommand to a source chain (called by CollateralRegistry)
function sendUnlockCommand(
    uint64  destinationChainSelector,
    address adapter,
    bytes32 collateralId,
    address recipient
) external onlyRegistry returns (bytes32 messageId);

/// Admin: register a new source chain adapter
function registerAdapter(uint64 chainSelector, address adapterAddress)
    external onlyOwner;

/// Admin: deregister a source chain (emergency pause)
function deregisterAdapter(uint64 chainSelector) external onlyOwner;
```

---

#### `ChainlinkAutomationKeeper.sol`

**Responsibility:** Chainlink Automation compatible contract that triggers position sweeps after oracle updates.

```solidity
/// checkUpkeep: returns true if new price has been attested since last sweep
function checkUpkeep(bytes calldata)
    external view override returns (bool upkeepNeeded, bytes memory performData);

/// performUpkeep: calls HealthFactorEngine.sweepPositions() with active borrowers
function performUpkeep(bytes calldata performData) external override;
```

---

### 4.2 Source Chain Contracts

---

#### `CollateralAdapter.sol` (Polygon — Courtyard)

**Responsibility:** Extensibility entry point. Each tokenization partner gets its own implementation of this contract, but all implement `ICollateralAdapter`. The hub chain is only coupled to the *interface*, not any specific implementation.

**Interface (`ICollateralAdapter.sol`):**

```solidity
interface ICollateralAdapter {
    /// Lock an NFT in the vault and notify the hub via CCIP
    function lockAndNotify(uint256 tokenId) external returns (bytes32 ccipMessageId);

    /// Receive an UnlockCommand from hub and release NFT to recipient
    function receiveUnlock(bytes32 collateralId, address recipient) external;

    /// Return the collection address this adapter manages
    function collection() external view returns (address);

    /// Return the CCIP chain selector for this chain
    function chainSelector() external view returns (uint64);

    event Locked(uint256 indexed tokenId, address indexed owner, bytes32 ccipMessageId);
    event Unlocked(uint256 indexed tokenId, address indexed recipient);
}
```

**Courtyard-Specific Implementation:**

```solidity
contract CollateralAdapter_Courtyard is ICollateralAdapter, CCIPReceiver {
    IERC721      public immutable courtyardCollection;
    NFTVault     public immutable vault;
    IRouterClient public immutable ccipRouter;
    uint64       public immutable hubChainSelector;
    address      public immutable hubRouter;      // CCIPMessageRouter on Arc
    uint64       public immutable _chainSelector; // Polygon CCIP selector

    function lockAndNotify(uint256 tokenId) external returns (bytes32 ccipMessageId) {
        // 1. Transfer NFT from caller to vault
        courtyardCollection.safeTransferFrom(msg.sender, address(vault), tokenId);

        // 2. Construct LOCK_NOTICE payload
        bytes memory payload = abi.encode(
            LOCK_NOTICE,
            _chainSelector,
            address(courtyardCollection),
            tokenId,
            msg.sender       // owner on hub chain (same address assumed; see §10.2)
        );

        // 3. Send CCIP message to hub
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(hubRouter),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({ gasLimit: 200_000 })),
            feeToken: address(0) // pay in native
        });

        ccipMessageId = ccipRouter.ccipSend{value: ccipRouter.getFee(hubChainSelector, message)}(
            hubChainSelector,
            message
        );

        emit Locked(tokenId, msg.sender, ccipMessageId);
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external override onlyRouter {
        require(message.sourceChainSelector == hubChainSelector, "Unauthorized chain");
        require(abi.decode(message.sender, (address)) == hubRouter, "Unauthorized sender");

        (bytes4 msgType, bytes32 collateralId, address recipient) =
            abi.decode(message.data, (bytes4, bytes32, address));

        require(msgType == UNLOCK_COMMAND, "Unknown message type");
        vault.release(collateralId, recipient);
        emit Unlocked(/* tokenId from vault record */, recipient);
    }
}
```

---

#### `NFTVault.sol` (Polygon)

**Responsibility:** Holds escrowed NFTs. Only releases on instruction from its paired `CollateralAdapter`.

```solidity
contract NFTVault {
    address public immutable adapter;

    // collateralId => (collection, tokenId)
    mapping(bytes32 => VaultRecord) public records;

    struct VaultRecord {
        address collection;
        uint256 tokenId;
        address originalOwner;
        bool    released;
    }

    function deposit(address collection, uint256 tokenId, address owner, bytes32 collateralId)
        external onlyAdapter;

    function release(bytes32 collateralId, address recipient)
        external onlyAdapter;

    modifier onlyAdapter() {
        require(msg.sender == adapter, "Only adapter");
        _;
    }
}
```

---

### 4.3 Contract Interface Catalogue

> This section lists every external/public function across all contracts with their signature, expected caller, and side effects. Use this as the integration reference for frontend and agent development.

| Function | Contract | Caller | Side Effects |
|---|---|---|---|
| `lockAndNotify(tokenId)` | CollateralAdapter | User (Polygon) | NFT escrowed; CCIP message sent |
| `deposit(amount)` | LendingPool | User (Arc) | USDC received; shares minted |
| `withdraw(shares)` | LendingPool | User (Arc) | Shares burned; USDC sent if liquidity available |
| `borrow(amount)` | LendingPool | User (Arc) | USDC transferred; debt recorded |
| `repay(amount)` | LendingPool | User (Arc) | USDC received; debt reduced |
| `initiateUnlock(collateralId)` | CollateralRegistry | User (Arc) | CCIP UnlockCommand sent |
| `getPrice(collection, tokenId)` | OracleConsumer | Any | Read-only |
| `availableCredit(borrower)` | CollateralRegistry | Any | Read-only |
| `outstandingDebt(borrower)` | LendingPool | Any | Read-only |
| `totalAssets()` / `exchangeRate()` / `currentBorrowAPR()` / `currentSupplyAPR()` | LendingPool | Any | Read-only |
| `previewHealthFactor(...)` | HealthFactorEngine | Any (frontend) | Read-only |
| `onReport(...)` | OracleConsumer | KeystoneForwarder only (`forwarderAddress`) | Price updated |
| `placeBid(auctionId, amount)` | AuctionLiquidationManager | Bidder | USDC pulled; anti-sniping may extend deadline |
| `claim(auctionId)` | AuctionLiquidationManager | Any (after deadline, if bids) | Distributes USDC; partial debt clear; CCIP NFT to winner |
| `cancelAllAuctionsForBorrower(borrower)` | AuctionLiquidationManager | HF engine | Refunds bids when borrower cures |
| `registerAdapter(chainSelector, addr)` | CCIPMessageRouter | Owner | New chain enabled |
| `setCollectionTier(collection, tier)` | OracleConsumer | Owner | LTV parameters updated |

---

## 5. Oracle System

### 5.1 Chainlink CRE Price Workflow & EXTERNAL_PRICE_API

#### Overview

**Chainlink CRE** runs a **workflow** on a DON: a **cron trigger** (e.g. every 23h) invokes a callback that uses the **HTTP capability** to call **`EXTERNAL_PRICE_API`** with Byzantine-fault-tolerant consensus on the response. The workflow then **generates a signed report** and submits it on-chain via **`evmClient.writeReport`**, which routes through **KeystoneForwarder** to **`OracleConsumer.onReport(bytes metadata, bytes report)`**. The consumer **ABI-decodes** `report` as `(address collection, uint256 tokenId, uint256 priceUSD)` and stores a **`PriceRecord`**. Reference implementation: [`cre/price-oracle/`](cre/price-oracle/) in this repository.

**Off-chain source of truth** for card valuations and suggested LTV is **`EXTERNAL_PRICE_API`**: a partner-agnostic HTTP API (implementations may wrap Courtyard, TCGPlayer aggregates, or internal pricing). The **frontend** calls this API **before** the user locks an NFT so they see **price, effective LTV, and borrowable preview**; the **hub oracle** ingests price updates **via the CRE workflow** (or admin **`setMockPrice`** in development) so on-chain state tracks the consensus-fetched API.

#### EXTERNAL_PRICE_API — Request / Response Spec

**Endpoint**

```
GET {EXTERNAL_PRICE_API_BASE}/api/v1/cards/{collection}/{tokenId}/valuation
```

| Path parameter | Description |
|---|---|
| `collection` | NFT contract address on the **source chain** (checksummed `0x…`) or a registered collection id string agreed by the app |
| `tokenId` | Decimal token id as string |

**Headers**

| Header | Required | Description |
|---|---|---|
| `Authorization` | If configured | `Bearer {API_KEY}` |
| `Accept` | Recommended | `application/json` |

**Response `200 OK`**

```json
{
  "collection": "0xABCdef1234567890ABCDEF1234567890abcdef12",
  "tokenId": "12345",
  "priceUSD": 15000,
  "ltvBPS": 4000,
  "tier": 1,
  "confidence": "high",
  "volatility30dBPS": 1200,
  "updatedAt": "2026-04-03T00:00:00Z"
}
```

| Field | Type | Description |
|---|---|---|
| `collection` | string | Echo of queried collection |
| `tokenId` | string | Echo of queried token id |
| `priceUSD` | integer | **USD price in cents** (e.g. `15000` = $150.00). On-chain storage may use 8 decimals; conversion is a documented constant factor. |
| `ltvBPS` | integer | Suggested max LTV in basis points (e.g. `4000` = 40%). **Advisory** for UX; `OracleConsumer` clamps to configured min/max and may combine with tier and volatility haircuts. |
| `tier` | integer | `1` = high liquidity, `2` = medium, `3` = illiquid |
| `confidence` | string | `high` \| `medium` \| `low` |
| `volatility30dBPS` | integer | Optional rolling 30d volatility in BPS for display and optional on-chain haircut |
| `updatedAt` | string | ISO-8601 timestamp of quote freshness |

**Errors**

```json
{ "error": "card_not_found" }
```
HTTP `404` — unknown `(collection, tokenId)`.

```json
{ "error": "pricing_unavailable" }
```
HTTP `503` — transient upstream failure.

**Frontend usage:** For each card the user may lock, call this endpoint, render **USD value**, **LTV %**, **max borrowable** (`priceUSD/100 * ltvBPS / 10000` in USD), and **confidence / updatedAt**. If the API errors, disable lock or show “pricing unavailable.”

**On-chain mapping:** `OracleConsumer` stores attested `priceUSD` (scaled), `tier`, and `attestedAt`. The API’s `ltvBPS` is **not trusted blindly**: the contract applies `min(max(ltvBPS, MIN_LTV_API), MAX_LTV_API)` and still applies **volatility-adjusted effective LTV** (see §5.3) where history exists.

#### CRE workflow configuration

- **`config.json`**: `schedule` (cron), `apiUrl` (full URL to the valuation endpoint or a stable quote URL), and `evms[]` with `oracleConsumerAddress`, `chainSelectorName`, `gasLimit`, `collection`, `tokenId`.
- **`project.yaml` / `workflow.yaml`**: CRE CLI targets and workflow artifact paths (see [`cre/price-oracle/workflow.yaml`](cre/price-oracle/workflow.yaml)).
- **Secrets:** Use `secrets.yaml` + Vault DON for deployed workflows; local simulation uses `.env` per Chainlink docs.
- **Forwarder:** Deploy `OracleConsumer` with the **MockKeystoneForwarder** address for simulation or the **KeystoneForwarder** for production on your hub chain; set **`CRE_FORWARDER_ADDRESS`** for `Deploy_Hub.s.sol` or call **`setForwarderAddress`** after deploy.

The workflow encodes **`priceUSD` in 8 decimals** (wei-style integer) to match `OracleConsumer`. If the API returns **cents** or another unit, normalize in the workflow before encoding.

For **`ltvBPS` / `tier`**, extend the report encoding and `_updatePrice` path in a future upgrade, or set tiers via **`setCollectionTier`** / **`setMockPrice`** as today.

#### On-chain delivery flow

1. Cron trigger fires on each DON node; HTTP capability fetches **`EXTERNAL_PRICE_API`** under consensus.
2. Workflow builds **`report = abi.encode(collection, tokenId, priceUSD)`** and **`runtime.report(prepareReportRequest(...))`**.
3. **`writeReport`** delivers to **`OracleConsumer`** via **KeystoneForwarder**; **`onReport`** checks **`msg.sender == forwarderAddress`**, decodes **`report`**, and calls **`_updatePrice`**.
4. **`PriceUpdated`** is emitted; **`priceHistory`** is updated.
5. **`ChainlinkAutomationKeeper`** may sweep positions where configured.

#### Update frequency

CRE triggers are configurable (e.g. **every 23 hours**) to align with staleness windows (see §5.2). Collectible quotes may change less often than the cron interval.

---

### 5.2 Staleness & Health Factor Model

#### Freshness Window

| Scenario | Behaviour |
|---|---|
| Price age < 24h | Normal — full LTV applied |
| Price age 24–26h (grace period) | LTV reduced by 50% as staleness penalty |
| Price age > 26h | `getPrice()` reverts with `PriceStale`; new borrows blocked for this collateral |

A position with stale-priced collateral contributes **zero** to the borrower's weighted collateral value for the purpose of new borrows, but existing debt continues to accrue. The borrower must repay or wait for the next price update.

#### Two-Zone Liquidation Model

```
Health Factor Formula:

  HF = Weighted Collateral Value / Total Debt

  Weighted Collateral Value = Σ_i [ price_i × effectiveLTV_i ]

Status Zones:

  HF ≥ 1.30        HEALTHY    — normal operation
  1.00 ≤ HF < 1.30 WARNING    — new borrows disabled; repayment encouraged
                                frontend shows countdown to liquidation threshold
  HF < 1.00        LIQUIDATABLE — AuctionLiquidationManager queues per-card auctions;
                                  borrower can cure (repay / add collateral) to cancel auctions and refund bids
```

The WARNING zone exists because daily-priced assets can gap down significantly between oracle updates. A borrower should have time to react to a price drop without being instantly liquidated.

---

### 5.3 Volatility-Adjusted LTV

After 30 days of price history have accumulated for a `(collection, tokenId)` pair, the effective LTV is dynamically reduced based on recent price volatility.

**Formula:**

```
σ_30d = stddev(dailyPrices[-30:]) / mean(dailyPrices[-30:])
      = coefficient of variation (normalized std dev)

effectiveLTV = max(baseLTV × (1 - σ_30d), MIN_LTV_BPS)
```

**Example:**
- Tier 1 card, base LTV = 40%
- 30-day price returns have σ = 18%
- effectiveLTV = 40% × (1 - 0.18) = 32.8%

**Implementation note:** The `priceHistory` array stores 30 entries in a circular buffer. `getPriceVolatility()` computes mean and variance in a single pass using integer arithmetic (scaled by 1e8 to preserve precision before sqrt).

**Bootstrap period:** For the first 30 days of a collection's history, the full base LTV applies without volatility haircut. This is a known limitation — the team may choose to set conservative manual tiers for new collections until history accumulates.

---

## 6. Cross-Chain Messaging

### 6.1 CCIP Message Schemas

All payloads are ABI-encoded. The first 4 bytes of `data` are always the message type selector (analogous to a function selector), used by `CCIPMessageRouter` to route to the correct handler.

#### `LOCK_NOTICE` (Source → Hub)

Sent by `CollateralAdapter` when an NFT is locked.

```
ABI encoding of:
  bytes4   messageType     = LOCK_NOTICE (0x...)
  uint64   sourceChainId   // CCIP chain selector of originating chain
  address  collection      // NFT contract on source chain
  uint256  tokenId
  address  owner           // borrower's address (hub chain)
```

#### `UNLOCK_COMMAND` (Hub → Source)

Sent by `CCIPMessageRouter` when a borrower initiates unlock or liquidation executes.

```
ABI encoding of:
  bytes4   messageType     = UNLOCK_COMMAND (0x...)
  bytes32  collateralId    // keccak256(sourceChainId, collection, tokenId)
  address  recipient       // address to receive NFT on source chain
```

#### `UNLOCK_CONFIRM` (Source → Hub) — Optional / Post-Hackathon

Sent by `CollateralAdapter` after NFT is released, to confirm the hub can mark the collateral as `RELEASED`. For the hackathon, the hub marks collateral as `RELEASED` optimistically after sending `UNLOCK_COMMAND`, with a reconciliation pass possible later.

---

### 6.2 Message Lifecycle & State Machine

```
[Source Chain]                         [Hub Chain]
     │                                      │
     │──── lockAndNotify() ────────────────►│
     │     (NFT → vault)                    │  registerCollateral()
     │                                      │  CollateralItem: PENDING
     │                                      │
     │                                      │  onReport() via KeystoneForwarder
     │                                      │  CollateralItem: ACTIVE
     │                                      │  position HF updated
     │                                      │
     │                           borrow() ◄─│  (user borrows USDC)
     │                                      │
     │◄─── UnlockCommand (CCIP) ────────────│  initiateUnlock()
     │     vault.release(recipient)         │  CollateralItem: UNLOCK_SENT
     │                                      │
     │──── UnlockConfirm (CCIP) ───────────►│  (post-hackathon)
     │     (optional confirmation)          │  CollateralItem: RELEASED
```

**Replay Protection:** `processedMessages[ccipMessageId]` is set to `true` upon processing. Any duplicate delivery is rejected.

**Failed CCIP Delivery:** If CCIP fails to deliver an `UNLOCK_COMMAND` (rare, but possible), the collateral remains in `UNLOCK_SENT` status on the hub. An admin function `retryUnlock(collateralId)` can resend the CCIP message. The NFT remains safely in the vault on the source chain until the command is delivered.

---

### 6.3 Adding a New Source Chain

This is the extensibility core of the protocol. Adding a new source chain (e.g., Ronin for a different NFT collection) requires:

**Step 1: Deploy source chain contracts**
```bash
# Deploy NFTVault on the new chain
forge create NFTVault \
  --constructor-args <adapter_address_placeholder> \
  --rpc-url <new_chain_rpc>

# Deploy CollateralAdapter implementation for the new collection
forge create CollateralAdapter_NewPartner \
  --constructor-args <collection_address> <vault_address> <ccip_router> \
                     <hub_chain_selector> <hub_ccip_router_address> \
  --rpc-url <new_chain_rpc>
```

**Step 2: Register on hub chain**
```solidity
// Call on CCIPMessageRouter (Arc)
ccipMessageRouter.registerAdapter(
    NEW_CHAIN_CCIP_SELECTOR,   // Chainlink CCIP chain selector
    adapterAddressOnNewChain
);
```

**Step 3: Register the collection's oracle**
```solidity
// Set the API endpoint configuration for CRE HTTP fetch
oracleConsumer.setCollectionTier(collectionAddressOnNewChain, 2); // set tier
// Configure CRE workflow / cron to pull from the new tokenization partner's API
```

**Step 4: Set collection-level LTV parameters (if different from defaults)**
```solidity
// Optional: override base LTV for this collection
oracleConsumer.setCollectionBaseLTV(collectionAddress, 3000); // 30%
```

No hub logic contracts need to be redeployed or upgraded. The `ICollateralAdapter` interface ensures the hub never needs to know which specific adapter implementation is running on a source chain.

**New adapter checklist:**
- [ ] Implements `ICollateralAdapter` exactly
- [ ] Encodes `LOCK_NOTICE` payload correctly (field order matters for ABI decode)
- [ ] Stores `collateralId = keccak256(abi.encodePacked(chainSelector, collection, tokenId))` — must match hub computation
- [ ] Only accepts `UNLOCK_COMMAND` from `hubChainSelector` + `hubRouter` address
- [ ] Handles CCIP fee payment (native token)
- [ ] NFT vault uses `onlyAdapter` modifier

---

## 7. Liquidation Engine

Full behaviour (timing, anti-sniping, bid increments, fund splits) is specified in **[specs/liquidation-auctions.md](specs/liquidation-auctions.md)**.

### 7.1 Liquidation Flow

```
1. Oracle prices update (e.g. every few hours); keeper / `sweepPositions` recomputes HF.
   ↓
2. If HF < 1.0 for borrower B, HealthFactorEngine calls AuctionLiquidationManager.queueLiquidation(B, collateralId)
   for each ACTIVE collateral (idempotent skip if an auction for that id is already live).
   - debtShareSnapshot = B’s total debt × (this card’s weighted value / sum weighted values)
   - reservePrice = debtShare + fee (fee = BPS of debt share, snapshotted)
   - deadline = now + auctionDuration; extended by anti-sniping on late bids
   ↓
3. While HF < 1.0, anyone may placeBid (min increment over last bid; bids non-withdrawable).
   If HF returns to ≥ 1.0 (HEALTHY or WARNING), cancelAllAuctionsForBorrower refunds all bidders.
   ↓
4. If there are zero bids and the initial duration elapses, the auction stays open for a first bid.
   After at least one bid, the auction ends antiSnipingWindow after the last bid (unless extended again).
   ↓
5. claim(auctionId) after deadline when highestBid > 0:
   - USDC: debt share → LendingPool + partialClearDebt; fee → treasury; excess split surplusShareBPS to pool, rest to treasury
   - Refund losing bidders; seizeLiquidatedCollateral → CCIP unlock NFT to winner on source chain
```

### 7.2 Liquidation Economics

| Parameter | Default / note | Rationale |
|---|---|---|
| Auction duration | Admin-set (e.g. 24h) | Notice window; configurable |
| Anti-sniping | Admin-set (e.g. 5 min) | Extends deadline when bids arrive near the end |
| Min bid step | Admin-set BPS (e.g. 1%) | Ensures meaningful price discovery |
| Liquidation fee | Admin-set BPS of **debt share** (e.g. 5%) | Always sent **to treasury** (not mixed with vault share of excess) |
| Excess over debt + fee | Split per `surplusShareBPS` (e.g. 50% pool, 50% treasury) | Boosts depositor APR + treasury |
| Minimum position | $50 USDC total debt (queue) | Prevents dust griefing |
| Per-card settlement | `partialClearDebt` | Each auction clears only that card’s share of debt |

**Bidder incentive:** Win the NFT on the source chain; losing bids are refunded at settlement or cancellation.

---

## 8. Data Models

### 8.1 Off-Chain Storage (Hackathon: ephemeral; Production: indexer)

The frontend and any monitoring scripts should index the following events to reconstruct state without RPC calls to every function:

```
CollateralRegistry:
  CollateralRegistered(id, owner, sourceChainId)
  CollateralStatusChanged(id, newStatus)
  UnlockInitiated(collateralId, ccipMessageId)

LendingPool:
  Deposited(depositor, assets, sharesMinted)
  Withdrawn(depositor, assets, sharesBurned)
  Borrowed(borrower, amount)
  Repaid(borrower, amount, fullyRepaid)

OracleConsumer:
  PriceUpdated(collection, tokenId, newPrice, attestedAt)

AuctionLiquidationManager:
  AuctionQueued(auctionId, borrower, collateralId, reservePrice, debtShareSnapshot, deadline)
  BidPlaced(auctionId, bidder, amount, newDeadline)
  AuctionSettled(auctionId, winner, winningBid, debtToPool, feeToTreasury, excessToPool, excessToTreasury)
  AuctionCancelled(auctionId)
  BidRefunded(auctionId, bidder, amount)
```

For the hackathon, the frontend can query these events directly from the RPC using `eth_getLogs`. For production, a subgraph (The Graph) should index these for efficient querying.

### 8.2 Collateral ID Derivation

The `collateralId` is the canonical identifier for a locked NFT across all systems:

```solidity
bytes32 collateralId = keccak256(abi.encodePacked(
    uint64(sourceChainSelector),
    address(collectionOnSourceChain),
    uint256(tokenId)
));
```

This must be computed identically on both the source chain and hub chain. Any mismatch will cause `UNLOCK_COMMAND` delivery to fail silently — **test this carefully in integration tests.**

---

## 9. Access Control & Roles

The protocol uses OpenZeppelin `AccessControl` on all hub contracts.

| Role | Holder | Permissions |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer multisig | Grant/revoke all roles |
| *(none)* | *Replaced by forwarder* | `OracleConsumer.onReport` is only callable by `forwarderAddress` (KeystoneForwarder) |
| `HF_ENGINE` | HealthFactorEngine | (indirect) triggers `queueLiquidation` / `cancelAllAuctionsForBorrower` on auction manager |
| `HF_ENGINE` on auction manager | HealthFactorEngine | `queueLiquidation`, `cancelAllAuctionsForBorrower` |
| `LIQUIDATION_MANAGER` | AuctionLiquidationManager | `CollateralRegistry.seizeLiquidatedCollateral()` |
| `ROUTER` | CCIPMessageRouter | `registerCollateral()` in CollateralRegistry |
| `KEEPER` | ChainlinkAutomationKeeper | `sweepPositions()` |

For the hackathon, the deployer EOA can hold `DEFAULT_ADMIN_ROLE`. Post-hackathon, this should transition to a Gnosis Safe multisig.

---

## 10. Error Handling & Edge Cases

### 10.1 CCIP Message Fails to Deliver

**Scenario:** `UNLOCK_COMMAND` is sent by hub but never arrives at source chain (CCIP outage, insufficient gas).

**Handling:**
- `CollateralItem` stays in `UNLOCK_SENT` status
- NFT remains safely locked in `NFTVault` — it cannot be moved or seized
- Admin function `retryUnlock(collateralId)` re-sends the CCIP message
- No user funds are lost; the borrower's debt has already been cleared (for liquidation path) or position is marked as unlocking (for voluntary path)

### 10.2 Cross-Chain Address Mismatch

**Scenario:** User locks NFT on Polygon using address A, but their Arc wallet is address B (different seed, or hardware wallet).

**Handling (v1 — hackathon):** The `CollateralAdapter` takes an explicit `hubOwner` parameter in `lockAndNotify(tokenId, hubOwner)`. The frontend populates this from the connected Arc wallet. Document clearly that both wallets must be connected simultaneously before locking.

**Handling (v2):** ENS reverse resolution — if both addresses point to the same ENS primary name, they are treated as the same owner.

### 10.3 NFT Transferred Out of Vault (Direct ERC-721 Transfer Bypass)

**Scenario:** A malicious or buggy source chain contract somehow transfers an NFT out of `NFTVault` without going through the adapter.

**Handling:**
- `NFTVault` implements `onERC721Received` and records every incoming NFT
- It **does not implement** any `transfer` or `safeTransfer` function — the only exit is `release()`, callable only by the adapter
- If an NFT is removed via a direct call to the underlying ERC-721's transfer (i.e., the vault contract itself calls `transferFrom`), that is only possible if the vault contract has a bug — which is why `NFTVault` has zero business logic beyond the `release` function and is kept minimal and non-upgradeable

### 10.4 Oracle Price for Un-priced Collateral

**Scenario:** A new NFT is locked but the oracle has not yet received a CRE report or mock price (PENDING status).

**Handling:**
- `availableCredit()` returns 0 for PENDING collateral
- Borrowing is blocked until the collateral transitions to ACTIVE
- The frontend should show "Awaiting price attestation — usually within 24 hours" for PENDING items
- Maximum wait time is one CRE workflow interval (e.g. ≤24h after next scheduled fetch)

### 10.5 Simultaneous auction settlement and cure

**Scenario:** Borrower submits `repay()` (or HF improves) in the same block as `claim()` on an auction.

**Handling:** Ordering determines the outcome. If `recomputePosition` / keeper runs first and HF ≥ 1, `cancelAllAuctionsForBorrower` runs and later `claim` reverts on a cancelled auction. If `claim` runs first, debt is partially cleared and the NFT is seized; subsequent HF may still change depending on remaining debt and collateral.

---

## 11. Frontend & SDK

### 11.1 Stack

- **Framework:** Next.js 14 (App Router)
- **Wallet / Auth:** Reown AppKit (social login, embedded wallets, multi-chain)
- **Chain interaction:** Wagmi v2 + Viem
- **Styling:** Tailwind CSS
- **State:** React Query for contract reads, Zustand for UI state

### 11.2 Multi-Chain Wallet Session

The frontend requires the user to be connected to **two chains** over the session:
- **Hub** (Arc Testnet): for **Lending** actions — deposit, borrow, repay — and dashboard reads
- **Source** (Ethereum Sepolia): for **locking** NFTs as collateral

Reown AppKit supports multi-chain sessions natively. On first visit, the user connects their hub wallet. Before the "Lock Collateral" flow, the app prompts to switch to or connect the source chain wallet (can be the same seed or different). The hub owner address is passed as **`hubOwner`** to `lockAndNotify` on the adapter.

### 11.3 Key Frontend Pages

**Lending page (`/lending` — canonical; see [specs/lending-page.md](specs/lending-page.md))**

The **Lending** surface consolidates all hub-chain interactions with the **`LendingPool`** for liquidity and borrowing:

1. **Deposit USDC in the vault** — Liquidity providers approve USDC and call **`deposit(amount)`** (share-based vault per §4.1). Show supply APR, utilization, and position; detailed UX in [specs/vault-deposits.md](specs/vault-deposits.md). *If the deployed pool only exposes admin-only `depositLiquidity`, retail deposit is disabled until the contract matches the PRD.*

2. **Borrow USDC** — Only when the user has **registered collateral** from **locked NFTs on the source chain** (`lockAndNotify` on Sepolia) and **`availableCredit(borrower) > 0`**. Slider or input capped at `availableCredit`; optional live HF preview via `previewHealthFactor`; submit **`LendingPool.borrow(amount)`**.

3. **Repay active loans** — Show principal + interest (`outstandingDebt`); approve USDC + **`LendingPool.repay(amount)`** (partial or full). When debt is zero, surface **unlock collateral** (`initiateUnlock`) or link to the repay/unlock step.

Implementation may ship as **one route** with tabs/sections (**Deposit | Borrow | Repay**) or as separate routes (**`/borrow`**, **`/repay`**, **`/vault`**) sharing the same layout until unified.

**`/dashboard`**
- Current health factor (color-coded: green/yellow/red)
- Total collateral value (USD)
- Total debt (USDC + accrued interest)
- Available to borrow
- List of locked collateral items with individual prices and status badges
- Active liquidation warning banner (if in WARNING or LIQUIDATABLE zone)
- **Vault / LP position** (if any): deposited USDC value (from shares), current **supply APR**, interest earned vs. cost basis, link to **Lending** or `/vault`

**`/vault`** (optional dedicated route; may overlap with Lending → Deposit / Withdraw)
- **Deposit:** USDC amount input, wallet balance, projected shares, current **supply APR** and pool utilization; approve + `deposit(amount)`
- **Position:** shares, USDC-equivalent balance, earnings since deposit (mark-to-pool), current supply APR
- **Withdraw:** shares or USDC-out preview, idle liquidity hint, `withdraw(shares)`; explain revert when utilization is high and cash is insufficient

**`/lock`**
- Connect source-chain wallet (Ethereum Sepolia per current deployment)
- Enumerate user NFTs (collection contract or indexer); for each candidate card call **`EXTERNAL_PRICE_API`** (§5.1) for **priceUSD**, **ltvBPS**, **confidence**, **updatedAt**
- Display cards with **USD value**, **LTV %**, **estimated max borrow** before on-chain lock
- Approve NFT + call `lockAndNotify(tokenId, hubOwnerAddress)`
- Track CCIP message status (link to CCIP Explorer)
- Show "Awaiting price confirmation" state while PENDING

**`/borrow` and `/repay`** (legacy or secondary routes)
- Same behaviors as **Borrow** and **Repay** sections of the **Lending page** above; prefer routing users to **`/lending`** when implemented.

**`/liquidations`**
- Public page listing **active auctions** (`activeAuctionIds` + `auctions` reads)
- For each: collateral preview, **debt share**, **reserve / min next bid**, **highest bid**, **deadline** countdown (anti-sniping aware)
- Flow: approve USDC → `placeBid(auctionId, amount)`; after close → `claim(auctionId)` (any caller)
- See [specs/liquidation-auctions.md](specs/liquidation-auctions.md) §10

### 11.4 ERC-7730 Clear Signing Descriptors

ERC-7730 JSON descriptor files must be created for every user-facing transaction. These enable Ledger and any compatible wallet to display human-readable summaries.

**File: `eip7730/lockAndNotify.json`**
```json
{
  "$schema": "https://eips.ethereum.org/assets/eip-7730/registry-schema-v1.json",
  "context": {
    "contract": {
      "deployments": [{ "chainId": 137, "address": "<CollateralAdapter_Polygon>" }]
    }
  },
  "metadata": { "owner": "Slab.Finance" },
  "display": {
    "formats": {
      "lockAndNotify(uint256,address)": {
        "intent": "Lock NFT as Collateral",
        "fields": [
          { "path": "tokenId", "label": "Card Token ID", "format": "raw" },
          { "path": "hubOwner", "label": "Receiving Address (Arc)", "format": "addressName" }
        ]
      }
    }
  }
}
```

Similar descriptors are required for: `deposit`, `withdraw`, `borrow`, `repay`, `placeBid`, `claim`, `initiateUnlock`.

---

## 12. Testing Strategy

### 12.1 Unit Tests (Foundry)

Each contract has a corresponding test file. Minimum coverage targets for hackathon:

| Contract | Tests Required |
|---|---|
| `OracleConsumer` | Price acceptance, staleness revert, volatility computation |
| `HealthFactorEngine` | HF formula correctness, all status zone transitions |
| `LendingPool` | Deposit/withdraw shares, exchange rate, borrow cap, repay full/partial, **utilization-based** accrual |
| `AuctionLiquidationManager` | Queue, bids, anti-sniping, `claim` distribution, cancel-on-cure |
| `CCIPMessageRouter` | Trusted sender validation, replay protection, unknown message type |
| `CollateralAdapter_Courtyard` | Lock encoding, CCIP fee forwarding, unlock receipt |
| `NFTVault` | Only adapter can release, onERC721Received |

### 12.2 Integration Tests (Foundry Fork Tests)

```bash
# Fork Polygon mainnet to use real Courtyard NFTs
forge test --fork-url $POLYGON_RPC --match-path test/integration/

# Fork Arc testnet for hub contract interactions
forge test --fork-url $ARC_RPC --match-path test/integration/
```

**Integration test scenarios:**
1. Full happy path: lock → price update → borrow → repay → unlock
2. Liquidation path: lock → price drop → queue auctions → bids → claim
3. Multi-collateral: lock two NFTs → borrow against combined credit

### 12.3 CCIP Local Simulation

Use **Chainlink Local** (the CCIP simulator for Hardhat/Foundry) to test cross-chain message flows without deploying to testnets:

```solidity
// In test setup
CCIPLocalSimulator simulator = new CCIPLocalSimulator();
(uint64 chainSelector, IRouterClient sourceRouter, IRouterClient destRouter, ...) 
    = simulator.configuration();
```

This allows full end-to-end lock/unlock flow testing in a single Foundry test file.

### 12.4 Manual Demo Script

For the hackathon demo, a Foundry script should execute the full happy path against live testnets:

```bash
forge script script/HappyPath.s.sol \
  --rpc-url $ARC_TESTNET_RPC \
  --broadcast \
  -vvvv
```

The script should:
1. (Optional) `deposit` USDC into the vault as a liquidity provider
2. Lock a test NFT on the source chain
3. Wait for CCIP message delivery (~3–5 minutes)
4. Print the CCIP Explorer link for the message
5. Run the CRE price workflow in simulation or call `setMockPrice`
6. Borrow 100 USDC
7. Repay 100 USDC
8. Initiate unlock and print second CCIP Explorer link

---

## 13. Deployment Runbook

### 13.1 Prerequisites

```bash
# Environment variables required
ARC_TESTNET_RPC=
POLYGON_TESTNET_RPC=
DEPLOYER_PRIVATE_KEY=
CRE_FORWARDER_ADDRESS=  # MockKeystoneForwarder or production KeystoneForwarder (see Chainlink CRE forwarder directory)
CHAINLINK_CCIP_ROUTER_ARC=       # from Chainlink CCIP docs
CHAINLINK_CCIP_ROUTER_POLYGON=
ARC_CHAIN_CCIP_SELECTOR=
POLYGON_CHAIN_CCIP_SELECTOR=
COURTYARD_COLLECTION_ADDRESS=    # Polygon mainnet: 0x...
USDC_ADDRESS_ARC=
```

### 13.2 Deployment Order

Hub chain contracts must be deployed before source chain contracts (source chain adapter needs the hub router address).

```bash
# 1. Deploy hub contracts (Arc testnet)
forge script script/Deploy_Hub.s.sol --rpc-url $ARC_TESTNET_RPC --broadcast

# Captures and exports:
# - ORACLE_CONSUMER_ADDRESS
# - COLLATERAL_REGISTRY_ADDRESS
# - HEALTH_FACTOR_ENGINE_ADDRESS
# - LENDING_POOL_ADDRESS
# - LIQUIDATION_MANAGER_ADDRESS
# - CCIP_MESSAGE_ROUTER_ADDRESS (hub)
# - AUTOMATION_KEEPER_ADDRESS

# 2. Deploy source chain contracts (Ethereum Sepolia)
forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url $SEPOLIA_RPC --broadcast
# Requires: CCIP_MESSAGE_ROUTER_ADDRESS from step 1

# Captures and exports:
# - NFT_VAULT_ADDRESS
# - COLLATERAL_ADAPTER_COURTYARD_ADDRESS

# 3. Wire up: register adapter on hub
cast send $CCIP_MESSAGE_ROUTER_ADDRESS \
  "registerAdapter(uint64,address)" \
  $POLYGON_CHAIN_CCIP_SELECTOR \
  $COLLATERAL_ADAPTER_COURTYARD_ADDRESS \
  --rpc-url $ARC_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# 4. Fund CCIP Message Router on Arc with LINK for outbound messages
cast send $CCIP_MESSAGE_ROUTER_ADDRESS \
  --value 0.1ether \
  --rpc-url $ARC_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# 5. (Optional) Seed LendingPool with USDC via open deposit — any EOA can call deposit()
cast send $USDC_ADDRESS_ARC \
  "approve(address,uint256)" $LENDING_POOL_ADDRESS 10000000000 \
  --rpc-url $ARC_TESTNET_RPC --private-key $DEPLOYER_PRIVATE_KEY
cast send $LENDING_POOL_ADDRESS \
  "deposit(uint256)" 10000000000 \
  --rpc-url $ARC_TESTNET_RPC --private-key $DEPLOYER_PRIVATE_KEY

# 6. Register Chainlink Automation upkeep
# → Do this manually via https://automation.chain.link using AUTOMATION_KEEPER_ADDRESS

# 7. Deploy / simulate CRE price workflow (cre/price-oracle/)
# → cre workflow simulate . --target local-simulation --broadcast
# → Production: cre workflow deploy (Early Access) with secrets and correct forwarder on hub chain
# → Optional: scripts/deploy-all.sh with DEPLOY_CRE_WORKFLOW=1 (see .env.example)
```

### 13.3 Post-Deployment Verification

```bash
# Verify all contracts on Arc explorer
forge verify-contract $COLLATERAL_REGISTRY_ADDRESS CollateralRegistry \
  --chain arc-testnet

# Check role assignments
cast call $COLLATERAL_REGISTRY_ADDRESS \
  "hasRole(bytes32,address)" $(cast keccak "ROUTER") $CCIP_MESSAGE_ROUTER_ADDRESS \
  --rpc-url $ARC_TESTNET_RPC
# Expected: true

# Verify pool assets (implementation may expose totalAssets() and/or share totals)
cast call $LENDING_POOL_ADDRESS "totalAssets()" --rpc-url $ARC_TESTNET_RPC
```

---

## 14. Hackathon Scope vs. Future Work

### Must Ship (Hackathon)
- [x] All hub contracts (Arc testnet)
- [x] CollateralAdapter + NFTVault (Polygon testnet)
- [x] Chainlink CRE price path (1 collection; dev: `setMockPrice`, prod: workflow + forwarder)
- [x] Chainlink CCIP lock/unlock flow (demonstrable end-to-end)
- [x] Chainlink Automation health factor sweep (registered and running)
- [x] Frontend: dashboard, lock, borrow, repay, **vault** flows
- [x] **Open vault deposits / withdrawals** (share-based) and **dynamic utilization-based borrow & supply APR**
- [x] Reown AppKit multi-chain wallet
- [x] ERC-7730 JSON descriptors for all user functions

### Ship If Time Allows
- [ ] `/liquidations` public page
- [ ] Second source chain (Ronin or Base)
- [ ] Full Foundry test suite

### Post-Hackathon Roadmap
- [ ] Governance (Gnosis Safe → DAO)
- [ ] Partial liquidations
- [ ] ZK-based cross-chain address linking (ENS or World ID)
- [ ] The Graph subgraph for efficient event indexing
- [ ] Insurance fund (% of interest → risk buffer)
- [ ] Mobile app with Ledger hardware wallet integration
- [ ] Additional tokenization partners: Collector (Ronin), Alt (Base), Sorare
- [ ] PSA population report integration via CRE (rarity-adjusted LTV)

---

## 15. Open Questions

These are unresolved design decisions that the team needs to align on before or during the hackathon:

| # | Question | Options | Recommended Default |
|---|---|---|---|
| 1 | Which Arc testnet? Does Arc have a public testnet at hackathon time? | Arc testnet / fallback to Sepolia with Circle testnet USDC | Confirm with Arc team at hackathon kickoff |
| 2 | Is Arc supported by CRE KeystoneForwarder for our hub? | Check [Chainlink CRE forwarder directory](https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts); use supported hub or bridge pattern | Use a CRE-supported testnet hub or document manual `setMockPrice` for demo |
| 3 | EXTERNAL_PRICE_API hosting & auth | Self-hosted mock; partner API; API key in env | Mock for hackathon; production key in secrets manager |
| 4 | Same-address assumption: is the borrower's source-chain address always the same as their Arc address? | (a) Yes, require same address; (b) No, accept `hubOwner` param | Accept `hubOwner` param (safer, more flexible) |
| 5 | Interest rate curve parameters | base / optimal util / slopes / protocol fee | Tune in testnet; document defaults in deploy script |
| 6 | USDC on Arc: is native USDC available on Arc testnet? | Native USDC / CCTP mint / mock ERC-20 | Deploy mock ERC-20 USDC if native not available |
| 7 | Liquidation fee `LIQUIDATION_FEE_BPS` | 3% / 5% / 7% of debt | 5% default; avoid under-incentivizing keepers vs. gas |
| 8 | Should `LOCK_NOTICE` include the NFT metadata (card name, image URL) for display? | Yes (larger CCIP payload, richer UX) / No (fetch off-chain in frontend) | No — fetch metadata from token URI / indexer / EXTERNAL_PRICE_API where applicable; keep CCIP payload minimal |

---

*End of Specification*

**Prepared by:** Slab.Finance Core Team  
**Review before implementation:** Confirm Arc testnet availability and CCIP support (Question #1)  
**First implementation priority:** Hub contract skeleton + CollateralAdapter + CCIP happy path test