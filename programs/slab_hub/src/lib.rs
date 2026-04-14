//! Slab.Finance Solana hub program — consolidates oracle, collateral registry, lending pool,
//! NFT vault (SPL + hooks for pNFT/cNFT), health checks, liquidation auctions, and LayerZero
//! message entry (authority-gated until full OApp CPI wiring).

pub mod errors;
pub mod instructions;
pub mod state;
pub mod util;

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidJQWCH3S6H6DH8pS9Nxn52v5Z3r1Kv");

#[program]
pub mod slab_hub {
    use super::instructions::*;

    pub fn initialize(ctx: Context<Initialize>, router_authority: Pubkey) -> Result<()> {
        instructions::initialize::handle(ctx, router_authority)
    }

    pub fn init_pool_usdc(ctx: Context<InitPoolUsdc>) -> Result<()> {
        instructions::pool::init_pool_usdc(ctx)
    }

    pub fn whitelist_collection(ctx: Context<WhitelistCollection>, kind: u8) -> Result<()> {
        instructions::registry::whitelist_collection(ctx, kind)
    }

    pub fn oracle_set_price(
        ctx: Context<OracleSetPrice>,
        token_id: u64,
        price_usd_8d: u64,
        tier: u8,
    ) -> Result<()> {
        instructions::oracle::set_price(ctx, token_id, price_usd_8d, tier)
    }

    /// Lock a standard SPL NFT (amount = 1). pNFT / Bubblegum cNFT flows use the same SPL mint
    /// when the mint is a legacy NFT; programmable rules may require additional CPIs.
    pub fn lock_spl_nft(
        ctx: Context<LockSplNft>,
        source_eid: u32,
        token_id: u64,
        collateral_id: [u8; 32],
    ) -> Result<()> {
        instructions::nft_vault::lock_spl_nft(ctx, source_eid, token_id, collateral_id)
    }

    pub fn unlock_spl_nft(
        ctx: Context<UnlockSplNft>,
        token_id: u64,
        collateral_id: [u8; 32],
    ) -> Result<()> {
        instructions::nft_vault::unlock_spl_nft(ctx, token_id, collateral_id)
    }

    pub fn receive_cross_chain_lock(
        ctx: Context<ReceiveCrossChainLock>,
        source_eid: u32,
        collection_20: [u8; 20],
        token_id: u64,
        owner_20: [u8; 20],
        message_digest: [u8; 32],
        collateral_id: [u8; 32],
    ) -> Result<()> {
        instructions::lz_entry::receive_cross_chain_lock(
            ctx,
            source_eid,
            collection_20,
            token_id,
            owner_20,
            message_digest,
            collateral_id,
        )
    }

    pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
        instructions::lending::deposit_liquidity(ctx, amount)
    }

    pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, amount: u64) -> Result<()> {
        instructions::lending::withdraw_liquidity(ctx, amount)
    }

    pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
        instructions::lending::borrow(ctx, amount)
    }

    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        instructions::lending::repay(ctx, amount)
    }

    pub fn refresh_health(ctx: Context<RefreshHealth>) -> Result<()> {
        instructions::health::refresh_health(ctx)
    }

    pub fn start_liquidation_auction(
        ctx: Context<StartLiquidationAuction>,
        collateral_id: [u8; 32],
        reserve_price: u64,
    ) -> Result<()> {
        instructions::liquidation::start_auction(ctx, collateral_id, reserve_price)
    }

    pub fn bid_liquidation(ctx: Context<BidLiquidation>, amount: u64) -> Result<()> {
        instructions::liquidation::bid(ctx, amount)
    }
}
