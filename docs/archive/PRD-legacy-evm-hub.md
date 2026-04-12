# Legacy EVM hub (Arc + CCIP) — archive note

The original **PRD.md** narrative assumed:

- A **Solidity hub** on **Arc** (lending pool, `CCIPMessageRouter`, `OracleConsumer`, etc.)
- **Chainlink CCIP** for lock/unlock notices between source chains and that hub
- **Chainlink CRE** for pushing signed price reports into `OracleConsumer`

The repository **no longer contains** that hub Solidity tree or CCIP deploy scripts. The live architecture is:

- **Hub:** Solana Anchor program **`slab_hub`**
- **Sources:** **Polygon** and **Base** (and more via config) with **`CollateralAdapterLayerZero`** + **`NFTVault`**, using **LayerZero V2** into the Solana program

Sections of **PRD.md** that still name Arc, CCIP routers, `Deploy_Hub.s.sol`, or Sepolia are **historical specification text**. For implementation and deploy commands, use **[SETUP.md](../../SETUP.md)**, **[DOCS.md](../../DOCS.md)**, and **[`shared/config/protocol.ts`](../../shared/config/protocol.ts)**.
