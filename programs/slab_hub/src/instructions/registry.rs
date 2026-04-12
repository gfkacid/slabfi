use anchor_lang::prelude::*;

use crate::errors::SlabError;
use crate::state::{HubConfig, WhitelistedCollection};

#[derive(Accounts)]
pub struct WhitelistCollection<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump,
        has_one = admin @ SlabError::Unauthorized
    )]
    pub hub_config: Account<'info, HubConfig>,
    pub collection_mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + WhitelistedCollection::INIT_SPACE,
        seeds = [b"wl", collection_mint.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, WhitelistedCollection>,
    pub system_program: Program<'info, System>,
}

pub fn whitelist_collection(ctx: Context<WhitelistCollection>, kind: u8) -> Result<()> {
    require!(kind <= 2, SlabError::InvalidCollectionKind);
    let wl = &mut ctx.accounts.whitelist;
    wl.collection_mint = ctx.accounts.collection_mint.key();
    wl.kind = kind;
    wl.bump = ctx.bumps.whitelist;
    Ok(())
}
