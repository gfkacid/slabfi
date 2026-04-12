# Solana programs (`slab_hub`)

The hub is implemented as **one** Anchor program ([`slab_hub`](slab_hub/)) whose modules map to the seven logical components from the protocol design:

| Module / area in `slab_hub` | Role |
| --- | --- |
| `instructions/oracle.rs` | Oracle price feeds (trusted authority) |
| `instructions/registry.rs` | Whitelisted collections (Collector Crypt, Phygitals, etc.) |
| `instructions/lending.rs` | USDC pool, supply shares, borrow/repay |
| `instructions/nft_vault.rs` | SPL NFT lock/unlock (pNFT / Bubblegum need extra CPIs in production) |
| `instructions/lz_entry.rs` | Cross-chain lock registration (router authority; replace with LayerZero `lz_receive` CPI when wired) |
| `instructions/health.rs` | Position health refresh |
| `instructions/liquidation.rs` | Auction stubs |

## Build

Requires [Anchor](https://www.anchor-lang.com/) and Solana CLI:

```bash
anchor build -p slab_hub
```

Program id is declared in `slab_hub/src/lib.rs` and `Anchor.toml` — replace with your deploy keypair and run `anchor keys sync` before mainnet deploy.

## Pool USDC

After `initialize`, the admin must call `init_pool_usdc` once to create the program-owned USDC vault PDA.
