# Wireframe: Protocol stats (cross-cutting)

Protocol-facing numbers are **not** a dedicated route; they appear in multiple surfaces fed by `useProtocolStats`, snapshots, and on-chain reads.

## Dashboard (`/`)

`StatsRow` — tiles such as TVL, utilization, borrow/supply APR (guest vs connected variants).

```
+--------------------------------------------------------------+
| [ TVL ] [ Utilization ] [ Borrow APR ] [ Supply APR ] { … } |
+--------------------------------------------------------------+
```

## Header (all pages)

`HeaderPortfolioMetrics` in `AppHeader` — portfolio-oriented strip when connected (net worth, blended APY, health factor, “Risk details” → `/lending`).

```
+------------------------------------------------------------------+
| Net … | APY … | HF … | [ Risk details -> ]     |    [ Connect ] |
+------------------------------------------------------------------+
```

## Lending Hub sidebar

`LendingSidebar` — pool utilization, APR, links/context for the active lending tab.

```
+----------------------+
| Pool / rates summary |
| Utilization …        |
| Links / callouts     |
+----------------------+
```

## Liquidations page

`LiquidationStatGrid` — tab-specific trio (active auctions, positions, TVL vs history stats).

## API-off / loading

```
+--------------+
| [ — ] [ — ]  |  placeholders or skeletons
+--------------+
```

Use this file when designing **consistent stat labeling** across dashboard, header, lending, and liquidations.
