use anchor_lang::prelude::*;

use crate::errors::SlabError;
use crate::state::{HubConfig, LiquidationAuction};

#[derive(Accounts)]
#[instruction(collateral_id: [u8; 32], reserve_price: u64)]
pub struct StartLiquidationAuction<'info> {
    pub liquidator: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump,
        constraint = hub_config.admin == liquidator.key() @ SlabError::Unauthorized
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        init,
        payer = liquidator,
        space = 8 + LiquidationAuction::INIT_SPACE,
        seeds = [b"auction", collateral_id.as_ref()],
        bump
    )]
    pub auction: Account<'info, LiquidationAuction>,
    pub system_program: Program<'info, System>,
}

pub fn start_auction(
    ctx: Context<StartLiquidationAuction>,
    collateral_id: [u8; 32],
    reserve_price: u64,
) -> Result<()> {
    let a = &mut ctx.accounts.auction;
    a.collateral_id = collateral_id;
    a.borrower = Pubkey::default();
    a.reserve_price = reserve_price;
    a.highest_bid = 0;
    a.highest_bidder = Pubkey::default();
    a.active = true;
    a.bump = ctx.bumps.auction;
    Ok(())
}

#[derive(Accounts)]
pub struct BidLiquidation<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(
        mut,
        seeds = [b"auction", auction.collateral_id.as_ref()],
        bump = auction.bump,
        constraint = auction.active @ SlabError::AuctionNotFound
    )]
    pub auction: Account<'info, LiquidationAuction>,
}

pub fn bid(ctx: Context<BidLiquidation>, amount: u64) -> Result<()> {
    require!(amount > 0, SlabError::InvalidAmount);
    let a = &mut ctx.accounts.auction;
    require!(amount >= a.reserve_price || amount > a.highest_bid, SlabError::InvalidAmount);
    a.highest_bid = amount;
    a.highest_bidder = ctx.accounts.bidder.key();
    Ok(())
}
