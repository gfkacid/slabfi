# Wireframe: Lending Hub (`/lending`)

`StitchLendingPage`: title, description, `PillTabs` (Deposit | Borrow | Repay), main panel + `LendingSidebar`.

## Page frame (all tabs)

```
+--------------------------------------------------------------+
| Lending Hub                                                |
| Deposit, borrow, and repay USDC on the hub — one workspace.|
+--------------------------------------------------------------+
| [ Deposit ] [ Borrow ] [ Repay ]                             |
+--------------------------------------------------------------+
| 8-col PANEL                        | 4-col SIDEBAR          |
| +--------------------------------+ +----------------------+ |
| | <ActivePanel />                | | LendingSidebar       | |
| | (see below per tab)            | | pool stats, APR,   | |
| |                                | | utilization, links | |
| +--------------------------------+ +----------------------+ |
+--------------------------------------------------------------+
```

## Tab: Deposit (`DepositLendingPanel`)

```
+------------------------------------------+
| Supply USDC                              |
| (i) Hub chain + pool address checks     |
+------------------------------------------+
| Your USDC balance: …                     |
| ( amount USDC )                         |
| { [ Approve USDC ] } [ Deposit ]        |
| >> pending: "Confirm in wallet…"        |
+------------------------------------------+
| { error: pool not configured }          |
+------------------------------------------+
```

## Tab: Borrow (`BorrowLendingPanel`)

```
+------------------------------------------+
| Borrow USDC                            |
| HubCollateralSyncCallout { … }         |
+------------------------------------------+
| Available credit …                     |
| Tier / LTV cards { … }                 |
| Health factor preview { bar }         |
| ( borrow amount )                      |
| [ Borrow ]                             |
| { Switch to hub chain prompt }         |
+------------------------------------------+
```

## Tab: Repay (`RepayLendingPanel`)

```
+------------------------------------------+
| Repay loan                             |
| Outstanding: principal / interest …   |
| ( repay amount )  [ Max ]               |
| { [ Approve ] } [ Repay ]              |
| { HF warning after partial }           |
+------------------------------------------+
```

**URL:** default tab = deposit (`?tab=` omitted). Borrow/repay: `?tab=borrow`, `?tab=repay`.
