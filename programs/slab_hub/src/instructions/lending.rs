use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::SlabError;
use crate::state::{CollateralItem, HubConfig, OraclePrice, UserBorrow, UserSupply, WAD};
use crate::util::ltv_bps_for_tier;

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        mut,
        constraint = pool_usdc.key() == hub_config.pool_usdc_vault @ SlabError::Unauthorized
    )]
    pub pool_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = depositor_usdc.owner == depositor.key() @ SlabError::Unauthorized)]
    pub depositor_usdc: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = depositor,
        space = 8 + UserSupply::INIT_SPACE,
        seeds = [b"supply", depositor.key().as_ref()],
        bump
    )]
    pub user_supply: Account<'info, UserSupply>,
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
    require!(amount > 0, SlabError::InvalidAmount);
    require!(
        ctx.accounts.hub_config.pool_usdc_vault != Pubkey::default(),
        SlabError::InsufficientLiquidity
    );
    let pool_before = ctx.accounts.pool_usdc.amount as u128;
    let hub = &mut ctx.accounts.hub_config;
    let shares = if hub.total_supply_shares == 0 {
        amount as u128
    } else {
        (amount as u128)
            .checked_mul(hub.total_supply_shares)
            .and_then(|x| x.checked_div(pool_before.max(1)))
            .ok_or(SlabError::MathOverflow)?
    };

    let cpi = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.depositor_usdc.to_account_info(),
            to: ctx.accounts.pool_usdc.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        },
    );
    token::transfer(cpi, amount)?;

    let us = &mut ctx.accounts.user_supply;
    if us.owner == Pubkey::default() {
        us.owner = ctx.accounts.depositor.key();
        us.shares = 0;
        us.bump = ctx.bumps.user_supply;
    }
    hub.total_supply_shares = hub
        .total_supply_shares
        .checked_add(shares)
        .ok_or(SlabError::MathOverflow)?;
    us.shares = us.shares.checked_add(shares).ok_or(SlabError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        mut,
        seeds = [b"vault_authority", hub_config.key().as_ref()],
        bump = hub_config.vault_authority_bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = pool_usdc.key() == hub_config.pool_usdc_vault @ SlabError::Unauthorized
    )]
    pub pool_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = depositor_usdc.owner == depositor.key() @ SlabError::Unauthorized)]
    pub depositor_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"supply", depositor.key().as_ref()],
        bump = user_supply.bump,
        constraint = user_supply.owner == depositor.key() @ SlabError::Unauthorized
    )]
    pub user_supply: Account<'info, UserSupply>,
    pub token_program: Program<'info, Token>,
}

pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, amount: u64) -> Result<()> {
    require!(amount > 0, SlabError::InvalidAmount);
    let hub = &mut ctx.accounts.hub_config;
    let pool_before = ctx.accounts.pool_usdc.amount as u128;
    let share_burn = (amount as u128)
        .checked_mul(hub.total_supply_shares)
        .and_then(|x| x.checked_div(pool_before.max(1)))
        .ok_or(SlabError::MathOverflow)?;
    let us = &mut ctx.accounts.user_supply;
    require!(us.shares >= share_burn, SlabError::InsufficientCredit);

    let seeds: &[&[u8]] = &[
        b"vault_authority",
        hub.key().as_ref(),
        &[hub.vault_authority_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.pool_usdc.to_account_info(),
            to: ctx.accounts.depositor_usdc.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi, amount)?;

    us.shares = us.shares.checked_sub(share_burn).ok_or(SlabError::MathOverflow)?;
    hub.total_supply_shares = hub
        .total_supply_shares
        .checked_sub(share_burn)
        .ok_or(SlabError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct Borrow<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        mut,
        seeds = [b"vault_authority", hub_config.key().as_ref()],
        bump = hub_config.vault_authority_bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = pool_usdc.key() == hub_config.pool_usdc_vault @ SlabError::Unauthorized
    )]
    pub pool_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = borrower_usdc.owner == borrower.key() @ SlabError::Unauthorized)]
    pub borrower_usdc: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = borrower,
        space = 8 + UserBorrow::INIT_SPACE,
        seeds = [b"borrow", borrower.key().as_ref()],
        bump
    )]
    pub user_borrow: Account<'info, UserBorrow>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn borrow(ctx: Context<Borrow>, amount: u64) -> Result<()> {
    require!(amount > 0, SlabError::InvalidAmount);
    require!(
        ctx.accounts.pool_usdc.amount >= amount,
        SlabError::InsufficientLiquidity
    );

    let rem = ctx.remaining_accounts;
    require!(!rem.is_empty(), SlabError::InsufficientCredit);
    require!(rem.len() % 2 == 0, SlabError::InvalidAmount);

    let mut weighted: u128 = 0;
    for chunk in rem.chunks(2) {
        require_keys_eq!(chunk[0].owner, ctx.program_id);
        require_keys_eq!(chunk[1].owner, ctx.program_id);
        let mut cdata = &chunk[0].try_borrow_data()?[..];
        let col = CollateralItem::try_deserialize(&mut cdata)?;
        let mut pdata = &chunk[1].try_borrow_data()?[..];
        let price = OraclePrice::try_deserialize(&mut pdata)?;
        require_keys_eq!(col.owner, ctx.accounts.borrower.key(), SlabError::Unauthorized);
        require!(col.status == 1, SlabError::CollateralNotFound);
        require_keys_eq!(price.collection, col.collection, SlabError::CollateralNotFound);
        require!(price.token_id == col.token_id, SlabError::CollateralNotFound);
        let ltv = ltv_bps_for_tier(price.tier) as u128;
        weighted = weighted
            .checked_add(
                (price.price_usd_8d as u128)
                    .checked_mul(ltv)
                    .ok_or(SlabError::MathOverflow)?,
            )
            .ok_or(SlabError::MathOverflow)?;
    }
    let max_borrow_raw = weighted
        .checked_mul(1_000_000)
        .and_then(|x| x.checked_div(10000 * 100))
        .ok_or(SlabError::MathOverflow)?;
    let max_borrow: u64 = max_borrow_raw.min(u64::MAX as u128) as u64;

    let ub = &mut ctx.accounts.user_borrow;
    if ub.owner == Pubkey::default() {
        ub.owner = ctx.accounts.borrower.key();
        ub.scaled_debt = 0;
        ub.principal = 0;
        ub.bump = ctx.bumps.user_borrow;
    }
    let new_debt = ub
        .principal
        .checked_add(amount)
        .ok_or(SlabError::MathOverflow)?;
    require!(new_debt <= max_borrow, SlabError::InsufficientCredit);

    let hub = &mut ctx.accounts.hub_config;
    let seeds: &[&[u8]] = &[
        b"vault_authority",
        hub.key().as_ref(),
        &[hub.vault_authority_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.pool_usdc.to_account_info(),
            to: ctx.accounts.borrower_usdc.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi, amount)?;

    ub.principal = new_debt;
    ub.scaled_debt = ub
        .scaled_debt
        .checked_add((amount as u128).checked_mul(WAD).ok_or(SlabError::MathOverflow)?)
        .ok_or(SlabError::MathOverflow)?;
    hub.total_borrows = hub
        .total_borrows
        .checked_add(amount)
        .ok_or(SlabError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        seeds = [b"hub_config"],
        bump = hub_config.bump
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        mut,
        constraint = pool_usdc.key() == hub_config.pool_usdc_vault @ SlabError::Unauthorized
    )]
    pub pool_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = borrower_usdc.owner == borrower.key() @ SlabError::Unauthorized)]
    pub borrower_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"borrow", borrower.key().as_ref()],
        bump = user_borrow.bump,
        constraint = user_borrow.owner == borrower.key() @ SlabError::Unauthorized
    )]
    pub user_borrow: Account<'info, UserBorrow>,
    pub token_program: Program<'info, Token>,
}

pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
    require!(amount > 0, SlabError::InvalidAmount);
    let cpi = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.borrower_usdc.to_account_info(),
            to: ctx.accounts.pool_usdc.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        },
    );
    token::transfer(cpi, amount)?;

    let ub = &mut ctx.accounts.user_borrow;
    let hub = &mut ctx.accounts.hub_config;
    ub.principal = ub.principal.saturating_sub(amount);
    ub.scaled_debt = ub.scaled_debt.saturating_sub((amount as u128).saturating_mul(WAD));
    hub.total_borrows = hub.total_borrows.saturating_sub(amount);
    Ok(())
}
