# Wireframe: Modal — Place your bid

Opened via `openModal("bid", { entry, onPlaceBid })` from liquidation table rows. `BidModal` + `BaseModal`.

```
+------------------------------------------------------------------+
| SCRIM                                                            |
|   +----------------------------------------------------------+   |
|   | Place Your Bid                               [ X close ] |   |
|   +----------------------------------------------------------+   |
|   | +--------+  ACTIVE AUCTION                               |   |
|   | | image  |  Borrower: 0xabc…9f12                         |   |
|   | | thumb  |  Collateral id / labels …                     |   |
|   | +--------+                                               |   |
|   +----------------------------------------------------------+   |
|   | Reserve | Current high | Min next | Countdown            |   |
|   | …       | …            | …        | 00h 00m 00s          |   |
|   +----------------------------------------------------------+   |
|   | Secondary: liquidation fee on debt …                     |   |
|   +----------------------------------------------------------+   |
|   | Your USDC (hub): … balance                                 |   |
|   | ( bid amount USDC )                                        |   |
|   | { not on hub: switch message }                             |   |
|   +----------------------------------------------------------+   |
|   | [ Place bid ]  >> pending                                  |   |
|   +----------------------------------------------------------+   |
|   | Footer note: bids locked until settle/cancel; fee/premium|   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

**Validation:** bid ≥ reserve (first bid) or ≥ min increment over highest. **Disabled** when auction past bid window per `canPlace` logic.
