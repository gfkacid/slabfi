use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::SlabError;
use crate::state::{CollateralItem, HubConfig, Position, UserBorrow, WhitelistedCollection};
use crate::util::collateral_id_solana_packed;

#[derive(Accounts)]
#[instruction(source_eid: u32, token_id: u64, collateral_id: [u8; 32])]
pub struct LockSplNft<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        seeds = [b"wl", collection_mint.key().as_ref()],
        bump = whitelist.bump,
        constraint = whitelist.collection_mint == collection_mint.key() @ SlabError::NotWhitelisted
    )]
    pub whitelist: Account<'info, WhitelistedCollection>,
    pub collection_mint: Account<'info, Mint>,
    #[account(mut, constraint = user_nft.owner == user.key() @ SlabError::WrongNftOwner)]
    pub user_nft: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"nft_escrow", hub_config.key().as_ref(), collection_mint.key().as_ref()],
        bump,
        token::mint = collection_mint,
        token::authority = vault_authority,
    )]
    pub escrow_nft: Account<'info, TokenAccount>,
    /// CHECK: PDA
    #[account(
        seeds = [b"vault_authority", hub_config.key().as_ref()],
        bump = hub_config.vault_authority_bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + CollateralItem::INIT_SPACE,
        seeds = [b"item", collateral_id.as_ref()],
        bump
    )]
    pub collateral: Account<'info, CollateralItem>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"pos", user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn lock_spl_nft(
    ctx: Context<LockSplNft>,
    source_eid: u32,
    token_id: u64,
    collateral_id: [u8; 32],
) -> Result<()> {
    let expected = collateral_id_solana_packed(
        source_eid as u64,
        &ctx.accounts.collection_mint.key(),
        token_id,
    );
    require!(expected == collateral_id, SlabError::CollateralNotFound);

    let cpi = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_nft.to_account_info(),
            to: ctx.accounts.escrow_nft.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(cpi, 1)?;

    let now = Clock::get()?.unix_timestamp;
    let item = &mut ctx.accounts.collateral;
    item.collateral_id = collateral_id;
    item.source_eid = source_eid;
    item.collection = ctx.accounts.collection_mint.key();
    item.token_id = token_id;
    item.owner = ctx.accounts.user.key();
    item.locked_at = now;
    item.status = 1;
    item.bump = ctx.bumps.collateral;

    let pos = &mut ctx.accounts.position;
    if pos.owner == Pubkey::default() {
        pos.owner = ctx.accounts.user.key();
        pos.collateral_ids = Vec::new();
        pos.status = 0;
        pos.bump = ctx.bumps.position;
    }
    require_keys_eq!(pos.owner, ctx.accounts.user.key(), SlabError::Unauthorized);
    require!(
        pos.collateral_ids.len() < crate::state::MAX_COLLATERAL_PER_USER,
        SlabError::PositionCap
    );
    require!(!pos.collateral_ids.contains(&collateral_id), SlabError::CollateralExists);
    pos.collateral_ids.push(collateral_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(token_id: u64, collateral_id: [u8; 32])]
pub struct UnlockSplNft<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    pub collection_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"nft_escrow", hub_config.key().as_ref(), collection_mint.key().as_ref()],
        bump
    )]
    pub escrow_nft: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"vault_authority", hub_config.key().as_ref()],
        bump = hub_config.vault_authority_bump
    )]
    /// CHECK: PDA signer
    pub vault_authority: UncheckedAccount<'info>,
    #[account(mut, constraint = user_nft.owner == user.key() @ SlabError::WrongNftOwner)]
    pub user_nft: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"item", collateral_id.as_ref()],
        bump = collateral.bump,
        constraint = collateral.owner == user.key() @ SlabError::Unauthorized,
        constraint = collateral.collection == collection_mint.key() @ SlabError::CollateralNotFound,
        constraint = collateral.token_id == token_id @ SlabError::CollateralNotFound
    )]
    pub collateral: Account<'info, CollateralItem>,
    #[account(
        mut,
        seeds = [b"pos", user.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserBorrow::INIT_SPACE,
        seeds = [b"borrow", user.key().as_ref()],
        bump
    )]
    pub user_borrow: Account<'info, UserBorrow>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn unlock_spl_nft(ctx: Context<UnlockSplNft>, token_id: u64, collateral_id: [u8; 32]) -> Result<()> {
    let _ = (token_id, collateral_id);
    let ub = &mut ctx.accounts.user_borrow;
    if ub.owner == Pubkey::default() {
        ub.owner = ctx.accounts.user.key();
        ub.scaled_debt = 0;
        ub.principal = 0;
        ub.bump = ctx.bumps.user_borrow;
    }
    require_keys_eq!(ub.owner, ctx.accounts.user.key(), SlabError::Unauthorized);
    require!(ub.scaled_debt == 0 && ub.principal == 0, SlabError::HasDebt);

    let hub = &ctx.accounts.hub_config;
    let seeds: &[&[u8]] = &[
        b"vault_authority",
        hub.key().as_ref(),
        &[hub.vault_authority_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_nft.to_account_info(),
            to: ctx.accounts.user_nft.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi, 1)?;

    let cid = ctx.accounts.collateral.collateral_id;
    ctx.accounts.position.collateral_ids.retain(|x| *x != cid);
    ctx.accounts.collateral.status = 3;
    Ok(())
}
