use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::{HubConfig, WAD};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + HubConfig::INIT_SPACE,
        seeds = [b"hub_config"],
        bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    /// CHECK: PDA used as SPL token owner for pool + NFT vault
    #[account(
        seeds = [b"vault_authority", hub_config.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle(ctx: Context<Initialize>, router_authority: Pubkey) -> Result<()> {
    let bump = ctx.bumps.hub_config;
    let va_bump = ctx.bumps.vault_authority;
    let hub = &mut ctx.accounts.hub_config;
    hub.admin = ctx.accounts.payer.key();
    hub.oracle_authority = ctx.accounts.payer.key();
    hub.router_authority = router_authority;
    hub.pool_usdc_vault = Pubkey::default();
    hub.usdc_mint = ctx.accounts.usdc_mint.key();
    hub.vault_authority_bump = va_bump;
    hub.borrow_index = WAD;
    hub.last_accrual_ts = Clock::get()?.unix_timestamp;
    hub.total_supply_shares = 0;
    hub.total_borrows = 0;
    hub.total_reserves = 0;
    hub.base_rate_bps = 200;
    hub.optimal_utilization_bps = 8000;
    hub.slope1_bps = 1000;
    hub.slope2_bps = 15_000;
    hub.protocol_fee_bps = 1000;
    hub.bump = bump;
    Ok(())
}
