use anchor_lang::prelude::*;

use crate::errors::SlabError;
use crate::state::{HubConfig, OraclePrice};

#[derive(Accounts)]
#[instruction(token_id: u64)]
pub struct OracleSetPrice<'info> {
    pub oracle_authority: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump,
        constraint = hub_config.oracle_authority == oracle_authority.key() @ SlabError::Unauthorized
    )]
    pub hub_config: Account<'info, HubConfig>,
    pub collection_mint: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = oracle_authority,
        space = 8 + OraclePrice::INIT_SPACE,
        seeds = [b"price", collection_mint.key().as_ref(), &token_id.to_le_bytes()],
        bump
    )]
    pub price: Account<'info, OraclePrice>,
    pub system_program: Program<'info, System>,
}

pub fn set_price(
    ctx: Context<OracleSetPrice>,
    token_id: u64,
    price_usd_8d: u64,
    tier: u8,
) -> Result<()> {
    require!(tier >= 1 && tier <= 3, SlabError::InvalidCollectionKind);
    let p = &mut ctx.accounts.price;
    p.collection = ctx.accounts.collection_mint.key();
    p.token_id = token_id;
    p.price_usd_8d = price_usd_8d;
    p.tier = tier;
    p.updated_ts = Clock::get()?.unix_timestamp;
    p.bump = ctx.bumps.price;
    Ok(())
}
