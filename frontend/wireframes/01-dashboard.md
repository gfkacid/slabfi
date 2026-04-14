# Wireframe: Dashboard (`/`)

`StitchDashboardPage`: summary, protocol stats row, portfolio + collateral + activity; right rail when connected.

## Guest (wallet disconnected)

```
+--------------------------------------------------------------+
| Dashboard                                                  |
| Connect a wallet to view your portfolio…                   |
+--------------------------------------------------------------+
| STATS ROW (protocol-oriented, guest=true)                    |
| [ TVL ] [ Utilization ] [ Supply APR ] …                   |
+--------------------------------------------------------------+
| TWO COLUMN GRID (lg)                                       |
| +---------------------------+ +---------------------------+ |
| | PortfolioBreakdown       | | ActiveCollateralSection   | |
| | (guest placeholders)     | | (guest placeholders)      | |
| +---------------------------+ +---------------------------+ |
+--------------------------------------------------------------+
```

## Connected

```
+--------------------------------------------------------------+
| Dashboard                                                  |
| Welcome back, 0xabc…9f12                                   |
+--------------------------------------------------------------+
| STATS ROW                                                  |
| … live / API-backed metrics …                              |
+--------------------------------------------------------------+
| 8-col MAIN                         | 4-col ASIDE            |
| +--------------------------------+ +----------------------+ |
| | PortfolioBreakdown             | | LendingPositionCard  | |
| |  collateral $ | debt $ | …    | |  debt / supply / HF | |
| +--------------------------------+ +----------------------+ |
| | ActiveCollateralSection        | | QuickActionsSection  | |
| |  cards / list …                | | [ Lock ] [ Lend ] … | |
| +--------------------------------+ +----------------------+ |
| | RecentActivitySection          | |                      | |
| |  feed …                        | |                      | |
| +--------------------------------+ +----------------------+ |
+--------------------------------------------------------------+
```

Quick actions may open **Collateral deposit** modal (`openModal("collateralDeposit")`) or deep-link to `/lending`.
