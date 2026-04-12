use anchor_lang::prelude::*;

use crate::errors::SlabError;
use crate::state::{HubConfig, Position};

#[derive(Accounts)]
pub struct RefreshHealth<'info> {
    pub owner: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        mut,
        seeds = [b"pos", owner.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == owner.key() @ SlabError::Unauthorized
    )]
    pub position: Account<'info, Position>,
}

pub fn refresh_health(ctx: Context<RefreshHealth>) -> Result<()> {
    let _hub = ctx.accounts.hub_config.key();
    let pos = &mut ctx.accounts.position;
    pos.status = if pos.collateral_ids.is_empty() {
        3
    } else {
        0
    };
    Ok(())
}
