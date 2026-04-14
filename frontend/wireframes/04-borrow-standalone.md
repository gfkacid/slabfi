# Wireframe: Borrow standalone (`/borrow`)

`BorrowPage`: same lending intent as hub **Borrow** tab, narrower single column (`max-w-4xl`), `PageHeader` + `Card`.

## Disconnected

```
+---------------------------+
| Borrow                    |
+---------------------------+
| +-----------------------+ |
| | Connect your wallet   | |
| | to borrow.            | |
| +-----------------------+ |
+---------------------------+
```

## Wrong hub chain

```
+---------------------------+
| Borrow                    |
+---------------------------+
| +-----------------------+ |
| | Switch to {hubChain}  | |
| | to borrow.            | |
| +-----------------------+ |
+---------------------------+
```

## Ready to borrow

```
+---------------------------+
| Borrow                    |
+---------------------------+
| HubCollateralSyncCallout  |
+---------------------------+
| Available credit: … USDC  |
| ( amount )                |
| [ Borrow ]                |
+---------------------------+
```

Uses `useAvailableCredit`, `useBorrow`, `AmountInput`, `TransactionButton` patterns; gated by `isHubEvm(chainId)` (see hub config in app).
