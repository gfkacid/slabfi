# CardFi deployments

_Generated: 2026-04-04 19:16:15 UTC_ (re-run `scripts/deploy-all.sh` to refresh.)

## Networks

| Network | Config (shared/config/testnet.ts) |
|---------|-------------------------------------|
| Arc (hub) | `hub.rpcUrl`, `hub.ccipRouter`, `hub.ccipChainSelector` |
| Ethereum Sepolia (source) | `source.rpcUrl`, `source.ccipRouter`, `source.ccipChainSelector` |

| Network | Chain selector value |
|---------|------------------------|
| Arc | 3034092155422581607 |
| Ethereum Sepolia | 16015286601757825753 |

## Hub contracts (Arc)

| Contract | Address |
|----------|---------|
| CCIPMessageRouter (app) | 0x969589b618E9b75F4181D3a262420a384df90AD2 |
| Chainlink CCIP router (on-chain) | 0xdE4E7FED43FAC37EB21aA0643d9852f75332eab8 |
| CollateralRegistry (proxy) | 0x96c990FAc3bA9329aEdbcf423C78e7880B6AB50e |
| OracleConsumer (proxy) | 0x66A7737Fd2ac66c409E7D2fe896821DbA3dEc735 |
| CRE Keystone forwarder (Arc testnet; config) | 0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1 |
| LendingPool (proxy) | 0x1BaE68aCD54C18716678c6049b1919a30520F2F8 |
| AuctionLiquidationManager (proxy) | 0x7691c741B6CB7F1C79BBc0f34bac0FF32f5A29eb |
| HealthFactorEngine (proxy) | 0xbE4a32F159Fe8e9E48aDEa1b70c6e16AFdcfb714 |
| USDC (hub, ERC-20) | 0x3600000000000000000000000000000000000000 |
| ChainlinkAutomationKeeper | 0x01DFbAe16B3E7Ac93152c9F26fB3827d1431279d |

_Proxy implementation addresses are stored in `contracts/deployments/hub.json`._

## Ethereum Sepolia (source)

| Contract | Address |
|----------|---------|
| CardFiCollectible | 0x3E299E9762eE497C5aa8a34eD8260BaeB98B5f60 |
| NFTVault | 0x7a783706CA89603f0Cec64EFC801dA1aD20ad953 |
| CollateralAdapter_CardFiCollectible | 0x68519cd40e0BA62EE6ABc9B5FE02e76e376C8A98 |

## Application config

Paste these into `shared/config/testnet.ts` (`hub.contracts` / `source.contracts`):

```ts
hub: {
  contracts: {
    lendingPool: "0x1BaE68aCD54C18716678c6049b1919a30520F2F8",
    collateralRegistry: "0x96c990FAc3bA9329aEdbcf423C78e7880B6AB50e",
    oracleConsumer: "0x66A7737Fd2ac66c409E7D2fe896821DbA3dEc735",
    healthFactorEngine: "0xbE4a32F159Fe8e9E48aDEa1b70c6e16AFdcfb714",
    liquidationManager: "0x7691c741B6CB7F1C79BBc0f34bac0FF32f5A29eb",
    usdc: "0x3600000000000000000000000000000000000000",
  },
},
source: {
  contracts: {
    collateralAdapter: "0x68519cd40e0BA62EE6ABc9B5FE02e76e376C8A98",
    slabFinanceCollectible: "0x3E299E9762eE497C5aa8a34eD8260BaeB98B5f60",
    nftVault: "0x7a783706CA89603f0Cec64EFC801dA1aD20ad953",
  },
},
```

## Artifact files

- `contracts/deployments/hub.json`
- `contracts/deployments/eth-sepolia.json`

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`)
- `jq`, `pnpm`
- Node dependencies for CCIP contracts: from repo root run `pnpm install`
- Native currency on Arc and Ethereum Sepolia for gas (and LINK or native CCIP fees on Sepolia when locking NFTs)

## One-command deployment

RPC URLs and CCIP constants are read from [`shared/config/testnet.ts`](../shared/config/testnet.ts) via `scripts/print-deploy-env.ts`. Set `DEPLOYER_PRIVATE_KEY` in `.env`, then:

```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

This runs: hub on Arc, source stack on Ethereum Sepolia, then hub configuration for the Sepolia adapter.

## Manual step-by-step

1. **Hub (Arc)** — writes `contracts/deployments/hub.json`:

   ```bash
   cd contracts
   # From repo root, export forge env from testnet config:
   eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
   export HUB_DEPLOYMENT_OUTPUT=deployments/hub.json
   forge script script/Deploy_Hub.s.sol:DeployHub --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
   ```

2. **Set hub router** for source script:

   ```bash
   export HUB_CCIP_ROUTER_ADDRESS=<ccipMessageRouter from hub.json>
   export HUB_CHAIN_SELECTOR=$ARC_CHAIN_SELECTOR
   ```

3. **Ethereum Sepolia**:

   ```bash
   eval "$(pnpm --filter @slabfinance/indexer exec tsx ../scripts/print-deploy-env.ts)"
   export SOURCE_CCIP_ROUTER=$CCIP_ROUTER_SEPOLIA
   export SOURCE_CHAIN_SELECTOR=$SEPOLIA_CHAIN_SELECTOR
   export DEPLOYMENT_OUTPUT_FILE=deployments/eth-sepolia.json
   export SOURCE_NETWORK_NAME=ethereum-sepolia
   forge script script/Deploy_SourceChain.s.sol:DeploySourceChain --rpc-url "$SEPOLIA_RPC" --broadcast --via-ir
   ```

4. **Register adapter on Arc**:

   ```bash
   export COLLATERAL_REGISTRY_ADDRESS=<collateralRegistry from hub.json>
   export SEPOLIA_ADAPTER_ADDRESS=<collateralAdapter from eth-sepolia.json>
   forge script script/Configure_Hub_Adapters.s.sol:ConfigureHubAdapters --rpc-url "$ARC_TESTNET_RPC" --broadcast --via-ir
   ```

## After deploy

Copy addresses into [`shared/config/testnet.ts`](../shared/config/testnet.ts) under `hub.contracts` and `source.contracts` (and `source.contracts.nftVault` for the indexer).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DEPLOYER_PRIVATE_KEY` | EOA used on Arc and Sepolia (must hold gas on both) |
| `DEPLOY_CRE_WORKFLOW` | Set to `1` to run local `cre workflow simulate --broadcast` after hub + Sepolia, then `cast send` `setMockPrice` (needs `cre`, `cast`, reachable price API — default `http://127.0.0.1:3001/...`) |
| `FAIL_ON_CRE_FAILURE` | Set to `1` to exit non-zero if CRE simulate or on-chain price tx does not complete |
| `EXTERNAL_PRICE_API_URL` | Optional; overrides `apiUrl` in generated `cre/price-oracle/config.deploy.json` |
| `CRE_PRICE_TOKEN_ID` | Optional token id string for the CRE config (default: first entry in `config.json`) |

Forge RPCs, CCIP values, and default `CRE_FORWARDER_ADDRESS` come from `shared/config/testnet.ts` via `eval "$(... print-deploy-env.ts)"` after sourcing `.env` (exports from the script override same-named vars from `.env`).
