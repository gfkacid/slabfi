# Wireframe: Modal — Collateral deposit

Opened via `openModal("collateralDeposit")` from dashboard quick actions, `ProtocolAssetsView`, etc. `CollateralDepositModal` + `BaseModal`.

## Overlay

```
+------------------------------------------------------------------+
| SCRIM (dimmed page)                                              |
|   +----------------------------------------------------------+   |
|   | BASE MODAL                                    [ X close ] |   |
|   | Deposit collateral (title)                                 |   |
|   +----------------------------------------------------------+   |
|   | HEADER STRIP: hub credit / debt / HF summary (when data) |   |
|   +----------------------------------------------------------+   |
|   | CHAIN TABS: [ All ] [ Polygon ] [ Base ]                 |   |
|   +----------------------------------------------------------+   |
|   | SEARCH ( search tokens… )   Sort: [ name v] [ price ]    |   |
|   +----------------------------------------------------------+   |
|   | MULTI-SELECT LIST / GRID                                  |   |
|   | [ ] NFT row  price  tier  projected borrow …             |   |
|   | [x] NFT row  …                                           |   |
|   | … scroll …                                               |   |
|   +----------------------------------------------------------+   |
|   | SELECTION SUMMARY + projected HF bar                     |   |
|   +----------------------------------------------------------+   |
|   | { Switch chain inline }  { Approve NFT }                 |   |
|   | [ Lock & notify ]  >> loading                             |   |
|   +----------------------------------------------------------+   |
|   | Footer: link to /lock  (i) LZ / explorer notes          |   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

**Disconnected:** modal content prompts connect or shows limited state per implementation.

**Pricing:** valuations when external price API configured; warnings when not.
