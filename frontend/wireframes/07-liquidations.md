# Wireframe: Liquidations (`/liquidations`)

`LiquidationsPage`: education header, tabbed queue, stat grid, table with bid/claim; `LiquidationPromoCard` may be commented out in code—show as optional promo strip.

## Page structure

```
+--------------------------------------------------------------+
| Liquidations                                               |
| Long description: HF < 1, per-card auctions, USDC bids,    |
| anti-sniping, claim settlement…                            |
+--------------------------------------------------------------+
| [ Active queue ] [ History ]                               |
+--------------------------------------------------------------+
| LiquidationStatGrid (3 tiles, tab-dependent)               |
| +-------------+ +-------------+ +-------------+            |
| | stat 1      | | stat 2      | | stat 3      |            |
| +-------------+ +-------------+ +-------------+            |
+--------------------------------------------------------------+
| { LiquidationPromoCard }  (optional / currently commented)  |
+--------------------------------------------------------------+
| GATE (if !connected or !hub)                               |
| +----------------------------------------------------------+|
| | Connect… / Switch to hub…                                ||
| +----------------------------------------------------------+|
+--------------------------------------------------------------+
| TABLE (active) or HISTORY TABLE                            |
| | Auction | Collateral | Reserve | High bid | Deadline |…||
| | …       | …          | …       | …        | [ Bid ]   |…||
| | …       | …          | …       | …        | [ Claim ] |…||
+--------------------------------------------------------------+
```

**Bid:** row opens `BidModal` via `openModal("bid", { entry, onPlaceBid })`. **Claim:** after deadline when rules allow.

**Active tab stats** (example): active auctions count, open positions, protocol TVL. **History tab:** resolved auctions, TVL, utilization.
