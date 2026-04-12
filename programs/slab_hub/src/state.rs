use anchor_lang::prelude::*;

pub const MAX_COLLATERAL_PER_USER: usize = 24;

#[account]
#[derive(InitSpace)]
pub struct HubConfig {
    pub admin: Pubkey,
    pub oracle_authority: Pubkey,
    pub router_authority: Pubkey,
    pub pool_usdc_vault: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault_authority_bump: u8,
    pub borrow_index: u128,
    pub last_accrual_ts: i64,
    pub total_supply_shares: u128,
    pub total_borrows: u64,
    pub total_reserves: u64,
    pub base_rate_bps: u16,
    pub optimal_utilization_bps: u16,
    pub slope1_bps: u16,
    pub slope2_bps: u16,
    pub protocol_fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct WhitelistedCollection {
    pub collection_mint: Pubkey,
    pub kind: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CollateralItem {
    pub collateral_id: [u8; 32],
    pub source_eid: u32,
    pub collection: Pubkey,
    pub token_id: u64,
    pub owner: Pubkey,
    pub locked_at: i64,
    pub status: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    #[max_len(MAX_COLLATERAL_PER_USER)]
    pub collateral_ids: Vec<[u8; 32]>,
    pub status: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct OraclePrice {
    pub collection: Pubkey,
    pub token_id: u64,
    pub price_usd_8d: u64,
    pub tier: u8,
    pub updated_ts: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReplayEntry {
    pub digest: [u8; 32],
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserBorrow {
    pub owner: Pubkey,
    pub scaled_debt: u128,
    pub principal: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserSupply {
    pub owner: Pubkey,
    pub shares: u128,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VaultEscrow {
    pub mint: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LiquidationAuction {
    pub collateral_id: [u8; 32],
    pub borrower: Pubkey,
    pub reserve_price: u64,
    pub highest_bid: u64,
    pub highest_bidder: Pubkey,
    pub active: bool,
    pub bump: u8,
}

pub const WAD: u128 = 1_000_000_000_000_000_000;
