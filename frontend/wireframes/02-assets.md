# Wireframe: Assets (`/assets`)

`StitchAssetsPage` renders `ProtocolAssetsView`: protocol catalog and user-scoped collateral management.

```
+--------------------------------------------------------------+
| Protocol assets (title area)                                 |
| subtitle / scope                                             |
+--------------------------------------------------------------+
| TOOLBAR / TABS                                               |
| [ Protocol catalog ] [ My collateral ]  { filters }          |
+--------------------------------------------------------------+
| PRIMARY LIST OR GRID                                       |
| +------+ +------+ +------+                                   |
| | card | | card | | card |  … scroll                        |
| | thumb| | thumb| | thumb|                                   |
| | meta | | meta | | meta |                                   |
| +------+ +------+ +------+                                   |
+--------------------------------------------------------------+
| ROW / CARD ACTIONS                                           |
| [ View ] [ Deposit collateral ]  → opens CollateralDepositModal |
+--------------------------------------------------------------+
```

**Deposit collateral:** calls `openModal("collateralDeposit")` from dashboard patterns; same modal wireframe in [08-modal-collateral-deposit.md](./08-modal-collateral-deposit.md).

**Guest:** list may be protocol-only; “mine” scope empty or prompts connect.
