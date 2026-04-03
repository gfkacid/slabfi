# NFT collateral deposit — product & UI spec

This document specifies the **end-to-end flow** for depositing (locking) card NFTs as collateral: discovering eligible cards across supported source chains, displaying pricing and card metadata, selecting cards, previewing health factor impact, and executing the lock transaction through CCIP. It complements [PRD.md](../PRD.md) §3.3 (protocol flow), §4.2 (source chain contracts), §5.1 (EXTERNAL_PRICE_API), §6 (cross-chain messaging), and [specs/lending-page.md](./lending-page.md).

---

## 1. Overview

A user who wants to **borrow USDC** must first deposit card NFTs as collateral. The cards live on one or more **source chains** (e.g. Ethereum Sepolia) while loans originate on the **hub chain** (Arc). The deposit flow bridges the gap: it lets users browse eligible cards they own, understand each card's borrowing power, preview the aggregate effect on their position, and commit to locking selected cards into the protocol's custody via `CollateralAdapter.lockAndNotify`.

---

## 2. Supported networks & whitelisted collections

### 2.1 Registry of eligible collections

The protocol maintains a **whitelist of NFT contracts** per source chain. Only tokens from these contracts can be locked as collateral. The whitelist is the set of collections for which a `CollateralAdapter` has been deployed and registered on the hub via `CCIPMessageRouter.registerAdapter`.

**Current whitelist (hackathon):**

| Source chain | Collection contract | Adapter | Description |
|---|---|---|---|
| Ethereum Sepolia | `CardFiCollectible` (`VITE_SLAB_FINANCE_COLLECTIBLE_ADDRESS`) | `CollateralAdapter_CardFiCollectible` | Demo graded card NFTs |

**Post-hackathon additions (planned):**

| Source chain | Collection | Adapter | Description |
|---|---|---|---|
| Polygon | Courtyard NFTs | `CollateralAdapter_Courtyard` | Physical cards tokenized via Courtyard |
| Ronin | Collector NFTs | `CollateralAdapter_Collector` | Cards tokenized via Collector |
| Base | Alt NFTs | `CollateralAdapter_Alt` | Cards tokenized via Alt |

### 2.2 Frontend collection config

The frontend maintains a static registry that maps each supported source chain to its whitelisted collection addresses and adapter addresses. This is loaded from environment variables and `@slabfinance/shared` constants.

```typescript
interface CollectionConfig {
  chainId: number;
  chainName: string;
  ccipChainSelector: bigint;
  collections: {
    address: `0x${string}`;
    adapterAddress: `0x${string}`;
    name: string;
    platform: string;   // "Slab.Finance" | "Courtyard" | "Collector" | "Alt"
  }[];
}
```

When new source chains or collections are added (see [PRD.md](../PRD.md) §6.3), the frontend config is extended with a new entry. No contract upgrade is required on the hub.

---

## 3. End-to-end flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER FLOW                                       │
│                                                                          │
│  1. Connect wallet (hub + source chains)                                 │
│  2. App enumerates eligible NFTs across all source chains                │
│  3. App fetches pricing + metadata for each NFT (EXTERNAL_PRICE_API)     │
│  4. User sees card grid: image, name, set, grade, price, LTV, borrow $   │
│  5. User selects cards → health factor preview updates live              │
│  6. User confirms → approve NFT → lockAndNotify per card                │
│  7. Track CCIP delivery → collateral enters PENDING on hub              │
│  8. Oracle prices → collateral becomes ACTIVE → borrowing unlocked       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Step 1 — Wallet connection

The app uses Reown AppKit for multi-chain sessions ([PRD.md](../PRD.md) §11.2). Before the collateral deposit flow, the user must be connected to:

- **Hub chain** — to read their existing position (debt, collateral, HF) for the live preview.
- **Source chain(s)** — to enumerate owned NFTs and execute `lockAndNotify`.

If the user is only connected to the hub, the UI prompts them to switch to or add a source chain wallet session. The connected hub address becomes the `hubOwner` parameter passed to `lockAndNotify`.

### 3.2 Step 2 — Enumerate eligible NFTs

For each whitelisted collection on each supported source chain, the frontend queries the user's NFT balance:

**On-chain calls (source chain RPC):**

1. `ERC721.balanceOf(userAddress)` → total count.
2. If count > 0, enumerate token IDs via:
   - `ERC721Enumerable.tokenOfOwnerByIndex(userAddress, i)` for `i in [0, balance)` — if the collection supports ERC-721 Enumerable.
   - Fallback: an off-chain indexer / subgraph query filtered by `owner == userAddress` and `collection == whitelistedAddress`.
   - Fallback (hackathon): iterate known token ID ranges (acceptable for small demo sets).

**Already-locked filter:** Exclude tokens that are currently escrowed in the protocol's `NFTVault` on the same chain (i.e. `ownerOf(tokenId) == vaultAddress`). These are already contributing to the user's position and should appear in the "Active Collateral" section, not the deposit picker.

**Cross-chain aggregation:** Results from all source chains are merged into a single list in the UI. Each card carries a `sourceChain` label so the user knows where the lock transaction will execute.

### 3.3 Step 3 — Fetch pricing & metadata

For every eligible NFT discovered in step 2, the frontend issues two parallel requests:

#### A. EXTERNAL_PRICE_API (valuation)

```
GET {EXTERNAL_PRICE_API_BASE}/api/v1/cards/{collection}/{tokenId}/valuation
```

Response fields used (see [PRD.md](../PRD.md) §5.1 for the full schema):

| Field | Use in UI |
|---|---|
| `priceUSD` | Market value (cents → display as `$X.XX`) |
| `ltvBPS` | Suggested LTV ratio (display as `XX%`) |
| `tier` | Liquidity tier badge (1 = high, 2 = medium, 3 = illiquid) |
| `confidence` | Price confidence indicator |
| `volatility30dBPS` | 30-day volatility (optional tooltip) |
| `updatedAt` | Freshness timestamp |

**Max borrowable preview** (per card):

```
maxBorrowUSD = (priceUSD / 100) × (ltvBPS / 10000)
```

If the API returns an error (`404` or `503`), the card is still shown but with a "Pricing unavailable" badge and the lock button disabled for that card.

#### B. Token metadata (card details)

```
ERC721.tokenURI(tokenId) → base64 JSON or HTTPS URI → parse JSON
```

For `CardFiCollectible`, `tokenURI` returns a base64-encoded JSON with:

| Attribute | Display label |
|---|---|
| `name` | Card name |
| `image` | Card image (rendered in card tile) |
| `attributes[].Set` | Set name |
| `attributes[].Card Number` | Card number |
| `attributes[].Rarity` | Rarity |
| `attributes[].Printing` | Printing |
| `attributes[].Grade Service` | Grading company (PSA, BGS, CGC, etc.) — if graded |
| `attributes[].Grade` | Numeric grade (e.g. "9.5") — if graded |

For third-party collections (Courtyard, etc.), the metadata schema may differ. The frontend normalizes into a common `CardDisplayInfo` type:

```typescript
interface CardDisplayInfo {
  tokenId: string;
  collection: `0x${string}`;
  sourceChainId: number;
  sourceChainName: string;
  platform: string;

  // Metadata
  name: string;
  image: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  gradeService?: string;
  grade?: string;

  // Pricing
  priceUSD: number | null;         // null = pricing unavailable
  ltvBPS: number | null;
  tier: number | null;
  confidence: string | null;
  volatility30dBPS: number | null;
  maxBorrowUSD: number | null;
  priceFreshness: string | null;   // ISO-8601

  // State
  isSelected: boolean;
  isPricingAvailable: boolean;
  isAlreadyLocked: boolean;
}
```

### 3.4 Step 4 — Card grid UI

Display all eligible cards in a responsive grid. Each card tile shows:

```
┌──────────────────────────────────┐
│  [Card Image]                    │
│                                  │
│  Charizard VMAX                  │
│  Set: Darkness Ablaze            │
│  #020/189 · Ultra Rare           │
│  PSA 9.5                         │
│                                  │
│  ─────────────────────────────── │
│  Market Price    $150.00         │
│  LTV             40%            │
│  Max Borrow      $60.00         │
│  Tier 1 · High Liquidity        │
│                                  │
│  Source: Sepolia · Slab.Finance  │
│                                  │
│  [ Select for Deposit ]         │
└──────────────────────────────────┘
```

**Card tile elements:**

| Element | Source | Notes |
|---|---|---|
| Card image | `tokenURI` → `image` | Fallback to placeholder if missing |
| Card name | `tokenURI` → `name` | — |
| Set name | `tokenURI` → `attributes[Set]` | Hide row if absent |
| Card number + rarity | `tokenURI` → `attributes[Card Number]`, `attributes[Rarity]` | Combine in one line |
| Grade | `tokenURI` → `attributes[Grade Service]` + `attributes[Grade]` | Only show if card is graded |
| Market price | `EXTERNAL_PRICE_API` → `priceUSD` | Format as `$X.XX`; "N/A" if unavailable |
| LTV ratio | `EXTERNAL_PRICE_API` → `ltvBPS` | Format as `XX%` |
| Max borrow | Computed: `priceUSD × ltvBPS / 1_000_000` | Format as `$X.XX` |
| Tier badge | `EXTERNAL_PRICE_API` → `tier` | Color-coded: green (1), yellow (2), red (3) |
| Source chain + platform | Collection config | e.g. "Sepolia · Slab.Finance" |
| Select button / checkbox | UI state | Toggle card selection |

**Sorting & filtering controls:**

- Filter by source chain (dropdown: "All chains", "Sepolia", "Polygon", …)
- Filter by collection / platform
- Sort by: price (high → low), max borrow, name, grade
- Search by card name

**Empty states:**

| Condition | UI |
|---|---|
| No eligible NFTs on any chain | "You don't own any eligible card NFTs. Cards from whitelisted collections on supported chains can be deposited as collateral." + link to supported collections |
| All NFTs already locked | "All your eligible cards are already deposited as collateral." + link to dashboard |
| Pricing API down for all cards | Cards shown with metadata but "Pricing temporarily unavailable" banner; deposit disabled |

### 3.5 Step 5 — Health factor live preview

As the user selects or deselects cards, a **sidebar or bottom panel** updates in real time to show the projected impact on their position.

#### Preview panel layout

```
┌──────────────────────────────────────────────────────┐
│  COLLATERAL DEPOSIT PREVIEW                           │
│                                                       │
│  Selected cards: 2                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │ Charizard VMAX (PSA 9.5)       $150.00       │    │
│  │ Pikachu V (BGS 10)             $85.00        │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  New collateral value:   +$235.00                    │
│  New borrow capacity:    +$109.50                    │
│                                                       │
│  ──── Position After Deposit ────                    │
│                                                       │
│  Total collateral:  $485.00  (was $250.00)           │
│  Total debt:        $80.00                           │
│  Available credit:  $114.00  (was $14.50)            │
│                                                       │
│  Health Factor:     2.42 → 3.84  ██████████ ↑       │
│                     [===green bar================]    │
│                                                       │
│  [ Deposit 2 Cards ]                                 │
└──────────────────────────────────────────────────────┘
```

#### Health factor calculation (client-side preview)

The preview computes HF using the same formula as `HealthFactorEngine.previewHealthFactor`:

```
currentWeightedCollateral = Σ (existingPrice_i × existingEffectiveLTV_i)
newWeightedCollateral     = Σ (selectedPrice_j × selectedEffectiveLTV_j)

totalWeightedCollateral = currentWeightedCollateral + newWeightedCollateral
totalDebt               = principal + interestAccrued

previewHF = totalWeightedCollateral / totalDebt
```

Where `effectiveLTV` per card:

```
effectiveLTV = max(baseLTV[tier] × (1 - volatility30dBPS / 10000), MIN_LTV_BPS)
```

**Data sources for the preview:**

| Data | Source | Chain |
|---|---|---|
| Existing collateral items + prices | `CollateralRegistry.positions(borrower)` + `OracleConsumer.getPrice(collection, tokenId)` | Hub |
| Existing debt | `LendingPool.outstandingDebt(borrower)` | Hub |
| New card prices + LTV | `EXTERNAL_PRICE_API` (already fetched in step 3) | Off-chain |
| Base LTV by tier | `OracleConsumer.baseLTV[tier]` or hardcoded constants from `@slabfinance/shared` | Hub / config |
| MIN_LTV_BPS | Constant `500` (5%) | Config |

**Edge cases:**

| Case | Behavior |
|---|---|
| User has no existing position (first deposit) | Debt = 0 → HF is infinite / "N/A"; show "Available credit: $X.XX" only |
| Selected card has no pricing | Exclude from weighted collateral preview; show warning "1 card excluded — pricing unavailable" |
| All selected cards unpriced | Disable deposit button; show "Cannot estimate position — pricing unavailable for selected cards" |

**Optional on-chain validation:** For higher confidence, the frontend can call `HealthFactorEngine.previewHealthFactor(collateralValuesUSD, tiers, totalDebtUSD)` as a pure view to cross-check the client-side math. This is a hub-chain RPC call and should be debounced (e.g. 500ms after last selection change).

### 3.6 Step 6 — Execute deposit (lock)

When the user clicks **"Deposit N Cards"**, the following sequence executes per selected card. If multiple cards are selected, they are processed **sequentially** (each requires a separate on-chain transaction on the source chain).

#### Per-card transaction flow

```
Source Chain (e.g. Sepolia)
──────────────────────────────────────────────────
1. Switch wallet to source chain (if not already)
2. ERC-721 approval check:
   a. isApprovedForAll(user, adapterAddress) → if true, skip
   b. getApproved(tokenId) → if == adapterAddress, skip
   c. Else: prompt setApprovalForAll(adapterAddress, true)
      or approve(adapterAddress, tokenId)
3. Call CollateralAdapter.lockAndNotify(tokenId, hubOwnerAddress)
   - NFT transferred to NFTVault
   - CCIP LOCK_NOTICE sent to hub
   - Returns ccipMessageId
4. Emit UI confirmation with CCIP Explorer link
```

**Multi-card UX:** Show a stepper or progress indicator:

```
Depositing 3 cards...

✓ Charizard VMAX — Locked (tx: 0xabc…)
◌ Pikachu V — Awaiting approval...
○ Blastoise EX — Pending
```

**Gas estimation:** Before submitting, display estimated gas cost per transaction (source chain native token) plus CCIP fee. The CCIP fee can be estimated via `ccipRouter.getFee(hubChainSelector, message)` on the source chain.

#### Transaction parameters

| Parameter | Value | Source |
|---|---|---|
| `tokenId` | Selected card's token ID | User selection |
| `hubOwnerAddress` | User's connected hub wallet address | Reown AppKit session |
| CCIP fee | `ccipRouter.getFee(...)` in native token | Source chain estimate |

### 3.7 Step 7 — Post-deposit tracking

After each `lockAndNotify` transaction confirms on the source chain:

1. **Show CCIP message status.** Link to `https://ccip.chain.link/msg/{ccipMessageId}`. Typical delivery time: 3–20 minutes depending on lane and finality.

2. **Poll hub for registration.** Query `CollateralRegistry` for the new `CollateralItem`:
   ```
   collateralId = keccak256(abi.encodePacked(sourceChainSelector, collection, tokenId))
   CollateralRegistry.collateralItems(collateralId) → status
   ```
   Display status badges:
   - **PENDING** — "Awaiting price attestation — usually within 24 hours"
   - **ACTIVE** — "Collateral is active — you can now borrow against it"

3. **Redirect or update.** Once all selected cards are locked and CCIP messages sent, offer:
   - "Go to Lending → Borrow" button (link to `/lending`)
   - "View Dashboard" (link to `/dashboard`)
   - Inline summary of new available credit (if oracle has already priced the collateral)

---

## 4. API calls summary

### 4.1 Source chain RPC (per collection, per chain)

| Call | Purpose | When |
|---|---|---|
| `ERC721.balanceOf(user)` | Count of eligible NFTs | Page load |
| `ERC721Enumerable.tokenOfOwnerByIndex(user, i)` | Enumerate token IDs | Page load |
| `ERC721.tokenURI(tokenId)` | Card metadata (name, image, attributes) | Per discovered token |
| `ERC721.ownerOf(tokenId)` | Confirm ownership / filter vault-held tokens | Per discovered token |
| `ERC721.isApprovedForAll(user, adapter)` | Check blanket approval | Before lock |
| `ERC721.getApproved(tokenId)` | Check per-token approval | Before lock (if no blanket) |
| `ERC721.setApprovalForAll(adapter, true)` | Grant adapter transfer rights | User tx (once per collection) |
| `CollateralAdapter.lockAndNotify(tokenId, hubOwner)` | Lock NFT + send CCIP | User tx (per card) |
| `ccipRouter.getFee(hubChainSelector, message)` | Estimate CCIP fee | Before lock (gas display) |

### 4.2 Hub chain RPC

| Call | Purpose | When |
|---|---|---|
| `CollateralRegistry.positions(borrower)` | Existing position (debt, collateral IDs, status) | Page load |
| `LendingPool.outstandingDebt(borrower)` | Principal + interest | Page load (HF preview) |
| `OracleConsumer.getPrice(collection, tokenId)` | On-chain price for existing collateral | Page load (HF preview) |
| `OracleConsumer.baseLTV(tier)` | Base LTV per tier | Page load or from config |
| `HealthFactorEngine.previewHealthFactor(values, tiers, debt)` | Optional on-chain HF cross-check | Debounced on selection change |
| `CollateralRegistry.collateralItems(collateralId)` | Post-deposit status polling | After lock tx confirms |

### 4.3 Off-chain API

| Call | Purpose | When |
|---|---|---|
| `GET {EXTERNAL_PRICE_API_BASE}/api/v1/cards/{collection}/{tokenId}/valuation` | Market price, LTV, tier, confidence | Per discovered token |

---

## 5. Smart contract interactions

### 5.1 Source chain — `CollateralAdapter.lockAndNotify`

```solidity
function lockAndNotify(uint256 tokenId, address hubOwner)
    external
    returns (bytes32 ccipMessageId);
```

**Caller:** User (on source chain).

**Preconditions:**
- User owns `tokenId` on the collection managed by this adapter.
- Adapter has approval to transfer the token (via `approve` or `setApprovalForAll`).
- User has sufficient native token to cover CCIP fee.

**Effects:**
1. NFT transferred from user to `NFTVault`.
2. CCIP `LOCK_NOTICE` message sent to `CCIPMessageRouter` on the hub chain.
3. `Locked(tokenId, owner, ccipMessageId)` emitted.

**Errors:**

| Error | Cause | UI handling |
|---|---|---|
| `ERC721: caller is not token owner or approved` | Missing approval | Prompt approval step |
| Insufficient native balance for CCIP fee | Gas + fee > balance | Show required amount |
| CCIP router revert | Lane unavailable | "Cross-chain messaging temporarily unavailable. Try again later." |

### 5.2 Hub chain — `CollateralRegistry.registerCollateral`

Called automatically by `CCIPMessageRouter` when a `LOCK_NOTICE` arrives. Not user-facing but important for understanding the post-deposit state machine.

```solidity
function registerCollateral(
    uint64  sourceChainId,
    address collection,
    uint256 tokenId,
    address owner
) external onlyRouter returns (bytes32 collateralId);
```

Creates a `CollateralItem` in `PENDING` status. Transitions to `ACTIVE` once `OracleConsumer` has a valid price (either via FDC attestation or `setMockPrice` for hackathon).

### 5.3 Hub chain — health factor preview

```solidity
function previewHealthFactor(
    uint256[] calldata collateralValuesUSD,
    uint8[]   calldata tiers,
    uint256   totalDebtUSD
) external pure returns (uint256 healthFactor);
```

Pure view function. The frontend can call this to validate client-side HF math, passing the combined array of existing + new collateral values and tiers.

---

## 6. UI requirements

### 6.1 Page route

**Recommended:** `/deposit` or `/lock` (standalone page).

**Alternative:** A section within `/lending` under a "Deposit Collateral" tab.

The navigation label should read **"Deposit Cards"** or **"Lock Collateral"**.

### 6.2 Page sections

| Section | Content |
|---|---|
| **Chain selector** | Tabs or dropdown to filter cards by source chain; default "All Chains" |
| **Card grid** | Responsive grid of `CardDisplayInfo` tiles (see §3.4) |
| **Preview panel** | Sticky sidebar (desktop) or bottom sheet (mobile) with HF preview (see §3.5) |
| **Transaction progress** | Modal or inline stepper during multi-card deposit (see §3.6) |
| **Post-deposit status** | CCIP tracking + collateral status polling (see §3.7) |

### 6.3 Responsive behavior

| Viewport | Layout |
|---|---|
| Desktop (≥1024px) | Card grid (3–4 columns) + sticky right sidebar for preview panel |
| Tablet (768–1023px) | Card grid (2 columns) + collapsible bottom panel |
| Mobile (<768px) | Card list (1 column) + floating bottom sheet for preview |

### 6.4 Loading states

| State | UI |
|---|---|
| Fetching NFTs from source chains | Skeleton card grid + "Loading your cards from N networks…" |
| Fetching prices from API | Card tiles render metadata first; price fields show shimmer until API responds |
| Waiting for CCIP delivery | Animated progress bar with estimated time + CCIP Explorer link |
| Waiting for oracle price (PENDING → ACTIVE) | "Awaiting price confirmation" badge on the collateral item in dashboard |

### 6.5 Error states

| Error | UI | Recovery |
|---|---|---|
| Source chain RPC unreachable | "Unable to load cards from [chain name]. Check your connection." | Retry button |
| EXTERNAL_PRICE_API 503 | "Pricing temporarily unavailable" badge on affected cards; deposit disabled for those cards | Auto-retry on 30s interval |
| EXTERNAL_PRICE_API 404 | "Card not recognized by pricing oracle" badge; deposit disabled for that card | — |
| Approval tx reverted | Toast: "Approval failed — [revert reason]" | Retry approval |
| lockAndNotify reverted | Toast: "Lock failed — [revert reason]" | Retry lock |
| CCIP message not delivered after 30 min | "Delivery taking longer than expected" + support link | Manual retry via admin `retryUnlock` if stuck on hub side |

---

## 7. Multi-chain considerations

### 7.1 Network switching

When the user has cards across multiple source chains and selects cards from different chains, the deposit flow must handle **network switching**:

1. Group selected cards by source chain.
2. Process one chain at a time.
3. Before processing a chain's cards, prompt the user to switch their wallet to that chain (Reown AppKit `switchChain`).
4. Execute all approvals and locks for that chain.
5. Move to the next chain group.

**UX:** Show a chain progress indicator:

```
Chain 1 of 2: Ethereum Sepolia
  ✓ Charizard VMAX — Locked
  ✓ Pikachu V — Locked

Chain 2 of 2: Polygon
  ◌ Blastoise EX — Awaiting approval...
```

### 7.2 Hub owner address consistency

The `hubOwner` parameter in `lockAndNotify` must be the user's address on the hub chain. The frontend reads this from the hub wallet session and passes it automatically. If the user changes their hub wallet mid-flow, all pending selections should be cleared and the card grid re-fetched.

### 7.3 CCIP fee tokens

Each source chain may use a different native token for CCIP fees:

| Source chain | Fee token | Notes |
|---|---|---|
| Ethereum Sepolia | ETH | Standard |
| Polygon | MATIC / POL | Standard |
| Ronin | RON | Check CCIP lane support |

Display the fee amount in the correct denomination per chain.

---

## 8. Data flow diagram

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐
│  Source RPC  │     │ PRICE API    │     │     Hub RPC        │
│  (per chain) │     │ (off-chain)  │     │     (Arc)          │
└──────┬──────┘     └──────┬───────┘     └────────┬───────────┘
       │                    │                       │
       │ balanceOf          │                       │ positions(user)
       │ tokenOfOwnerByIndex│                       │ outstandingDebt(user)
       │ tokenURI           │                       │ getPrice(existing)
       │ ownerOf            │                       │ baseLTV
       ▼                    ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND STATE                            │
│                                                               │
│  eligibleCards[]  ← merge(sourceRPC results)                 │
│  cardPricing{}    ← EXTERNAL_PRICE_API per card              │
│  cardMetadata{}   ← tokenURI per card                        │
│  existingPosition ← hub RPC                                  │
│  selectedCards[]  ← user interaction                         │
│  previewHF        ← compute(existing + selected, debt)       │
└──────────────────────────────────────────────────────────────┘
       │
       │ User confirms
       ▼
┌──────────────────────────────────────────────────────────────┐
│                  TRANSACTION EXECUTION                        │
│                                                               │
│  For each selected card (grouped by source chain):           │
│    1. Switch to source chain                                 │
│    2. Approve adapter (if needed)                            │
│    3. lockAndNotify(tokenId, hubOwner) → ccipMessageId       │
│    4. Poll hub: collateralItems(collateralId).status         │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Edge cases

| Case | Behavior |
|---|---|
| User sells/transfers NFT between enumeration and lock | `lockAndNotify` reverts with `ERC721: caller is not token owner`; UI catches and removes the card from the grid |
| Same NFT locked twice (race condition) | `NFTVault` or adapter reverts if token is already in vault; hub `processedMessages` prevents duplicate `LOCK_NOTICE` |
| Price drops between API fetch and oracle attestation | On-chain LTV may differ from preview; the preview is advisory. The on-chain `availableCredit` is the source of truth for borrowing. |
| User disconnects wallet mid-flow | Persist selection in local state; resume when wallet reconnects |
| CCIP lane paused or congested | `lockAndNotify` may revert if CCIP router rejects the message; UI shows lane status if available |
| Card has no metadata (empty `tokenURI`) | Show token ID and collection address; omit card details section |
| User has 100+ eligible NFTs | Paginate the card grid (20 per page); lazy-load pricing; virtualize the list for performance |

---

## 10. Analytics & events (frontend)

Track the following for product analytics:

| Event | Properties |
|---|---|
| `collateral_page_viewed` | `chainFilter`, `cardCount`, `hasExistingPosition` |
| `card_selected` | `tokenId`, `collection`, `sourceChain`, `priceUSD`, `ltvBPS` |
| `card_deselected` | `tokenId`, `collection`, `sourceChain` |
| `deposit_initiated` | `cardCount`, `totalValueUSD`, `projectedHF`, `sourceChains[]` |
| `deposit_card_locked` | `tokenId`, `collection`, `sourceChain`, `ccipMessageId`, `txHash` |
| `deposit_card_failed` | `tokenId`, `collection`, `errorReason` |
| `deposit_completed` | `cardCount`, `totalValueUSD`, `newHF` |

---

## 11. References

| Document | Relevance |
|---|---|
| [PRD.md](../PRD.md) §3.3 | Protocol borrow flow (happy path) |
| [PRD.md](../PRD.md) §4.2 | Source chain contracts (`CollateralAdapter`, `NFTVault`) |
| [PRD.md](../PRD.md) §5.1 | `EXTERNAL_PRICE_API` request/response spec |
| [PRD.md](../PRD.md) §5.3–5.4 | Staleness, volatility-adjusted LTV |
| [PRD.md](../PRD.md) §6.1 | CCIP message schemas (`LOCK_NOTICE`) |
| [PRD.md](../PRD.md) §11.2 | Multi-chain wallet session (Reown AppKit) |
| [specs/lending-page.md](./lending-page.md) | Lending page — borrow action (downstream of this flow) |
| [specs/vault-deposits.md](./vault-deposits.md) | Vault deposits (separate from NFT collateral) |
| [DOCS.md](../DOCS.md) | Deployment, env vars, `CardFiCollectible` metadata |
