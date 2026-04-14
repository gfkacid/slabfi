# Wireframe: Repay standalone (`/repay`)

`RepayPage`: debt breakdown, repay flow, **initiate unlock** when debt is zero and collateral exists.

## Disconnected / wrong chain

Same pattern as [04-borrow-standalone.md](./04-borrow-standalone.md): amber `Card` with “Connect…” or “Switch to {hub}…”.

## Has debt

```
+---------------------------+
| Repay                     |
+---------------------------+
| Principal: …              |
| Interest: …               |
| Total: …                  |
+---------------------------+
| ( repay amount ) [ Max ]  |
| [ Repay ]                 |
+---------------------------+
```

## Zero debt, has collateral

```
+---------------------------+
| Repay                     |
+---------------------------+
| No outstanding debt.      |
+---------------------------+
| [ Initiate unlock ]       |
| (first collateralId)      |
+---------------------------+
```

Unlock calls registry `initiateUnlock(collateralId)` after position load.
