# Wireframe: Lock collateral (`/lock`)

`LockPage`: EVM-only flow on **Polygon** or **Base**; `lockAndNotify` + LayerZero fee; success toast + explorer link.

## Disconnected

```
+---------------------------+
| Lock collateral           |
+---------------------------+
| +-----------------------+ |
| | Connect your wallet   | |
| +-----------------------+ |
+---------------------------+
```

## Wrong source chain

```
+---------------------------+
| Lock collateral           |
+---------------------------+
| +-----------------------+ |
| | Switch to Polygon or  | |
| | Base to lock.         | |
| | [ Switch Polygon ]    | |
| | [ Switch Base ]       | |
| +-----------------------+ |
+---------------------------+
```

## Main flow (on source chain)

```
+---------------------------+
| Lock collateral           |
| (i) Approve + LZ fee      |
+---------------------------+
| { Success: tx link }      |
+---------------------------+
| NFT GRID (select one)     |
| +-----------+ +-----------+|
| | [x] Card A| |   Card B  ||
| | #tokenId  | | #tokenId  ||
| +-----------+ +-----------+|
| …                          |
+---------------------------+
| [ Lock selected NFT ]      |
+---------------------------+
```

Loading: “Loading your NFTs…”. Empty: “No NFTs found…” `Card`.
