# Wireframe: App shell (global chrome)

Wraps every route: `AppShell` → `Sidebar` + `AppHeader` + `main` + `MobileBottomNav`.

## Desktop (md+)

```
+------------------------------------------------------------------+
| SIDEBAR (fixed left)          | HEADER (fixed top, inset left)   |
| +---------------------------+ +--------------------------------+ |
| | Slab.Finance (brand link) | | HeaderPortfolioMetrics … … …   | |
| +---------------------------+ |                    [ Connect ]  | |
| | > Dashboard               | +--------------------------------+ |
| |   Assets                  | MAIN (scrollable, padded max)    |
| |   Lending Hub             | +------------------------------+ |
| |   Liquidation Queue       | |                              | |
| +---------------------------+ |   <Outlet /> page content    | |
| | { avatar } 0xab…cd        | |                              | |
| | (truncated address)       | +------------------------------+ |
| +---------------------------+                                    |
+------------------------------------------------------------------+

Sidebar: `NavLink` rows with icon + label; active row = accent + inset bar.
Header: metrics strip (net worth, APY, HF, link to lending) + Reown `AppKitButton`.
Main: `max-w-[1600px]` container, horizontal padding.
```

## Mobile (md hidden sidebar)

```
+------------------------------------------+
| HEADER                                   |
|  metrics … …              [ Connect ]    |
+------------------------------------------+
|                                          |
|  MAIN (pb for bottom nav)                |
|  +------------------------------------+  |
|  |  page content                      |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
| MOBILE BOTTOM NAV (fixed)                |
| [Home] [Assets] [Lend] [Menu]            |
+------------------------------------------+
```

Bottom nav items: Home `/`, Assets `/assets`, Lend `/lending`, Menu `/` (placeholder route per implementation).

## Z-order (conceptual)

- Sidebar `z-[60]`, mobile nav `z-[70]`, header `z-50` — modals/toasts sit above when open.
