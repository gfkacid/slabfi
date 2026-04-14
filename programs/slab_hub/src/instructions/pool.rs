use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::SlabError;
use crate::state::HubConfig;

#[derive(Accounts)]
pub struct InitPoolUsdc<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"hub_config"],
        bump = hub_config.bump,
        has_one = admin @ SlabError::Unauthorized
    )]
    pub hub_config: Account<'info, HubConfig>,
    /// CHECK: vault PDA — stored as authority inside `pool_usdc` SPL account
    #[account(
        seeds = [b"vault_authority", hub_config.key().as_ref()],
        bump = hub_config.vault_authority_bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        seeds = [b"pool_usdc", hub_config.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = vault_authority,
    )]
    pub pool_usdc: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn init_pool_usdc(ctx: Context<InitPoolUsdc>) -> Result<()> {
    require!(
        ctx.accounts.hub_config.pool_usdc_vault == Pubkey::default(),
        SlabError::PoolAlreadyInit
    );
    let hub = &mut ctx.accounts.hub_config;
    hub.pool_usdc_vault = ctx.accounts.pool_usdc.key();
    Ok(())
}
