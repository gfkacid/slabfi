# Deployments

Canonical RPCs, LayerZero endpoint ids, program id, and contract addresses live in **[`shared/config/protocol.ts`](shared/config/protocol.ts)**.

After deploying with Foundry, write JSON to:

- [`contracts/deployments/evm/polygon.json`](contracts/deployments/evm/polygon.json)
- [`contracts/deployments/evm/base.json`](contracts/deployments/evm/base.json)

…then run **`pnpm sync:protocol`** to copy addresses into the `// @slabfi-sync:evm-*` regions of `protocol.ts`.
