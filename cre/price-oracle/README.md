# Slab.Finance CRE price oracle workflow

TypeScript [Chainlink CRE](https://docs.chain.link/cre) workflow: cron → HTTP fetch of **EXTERNAL_PRICE_API** → signed report → `OracleConsumer.onReport` on the hub chain.

## Prerequisites

- [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation) and a CRE account
- **Bun** 1.2.21+ (recommended by Chainlink for TypeScript workflows) or adjust install to your setup
- Hub chain supported by CRE **KeystoneForwarder** / simulation **MockKeystoneForwarder** (see [forwarder directory](https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory-ts))

## Setup

1. Copy `config.json` and set `apiUrl`, `evms[0].oracleConsumerAddress`, `collection`, `tokenId`, `chainSelectorName`, and `gasLimit`.
2. Ensure the API response includes **`priceUsd`** as a string or number in **8 decimals** (same as on-chain `OracleConsumer`), or adjust `parsePriceFromBody` in `main.ts`.
3. Install dependencies: `bun install` or `npm install`.

## Simulate

From this directory:

```bash
cre workflow simulate . --target local-simulation --broadcast
```

Use `--broadcast` only when you intend to submit transactions during simulation.

## Deploy hub contract

Set `CRE_FORWARDER_ADDRESS` when running `Deploy_Hub.s.sol` to the **MockKeystoneForwarder** (simulation) or **KeystoneForwarder** (production) for your hub network, then call `setForwarderAddress` if you rotate keys or networks.
