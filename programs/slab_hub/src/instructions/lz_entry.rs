use anchor_lang::prelude::*;

use crate::errors::SlabError;
use crate::state::{CollateralItem, HubConfig, Position};
use crate::util::collateral_id_evm_packed;

#[derive(Accounts)]
#[instruction(
    source_eid: u32,
    collection_20: [u8; 20],
    token_id: u64,
    owner_20: [u8; 20],
    message_digest: [u8; 32],
    collateral_id: [u8; 32],
)]
pub struct ReceiveCrossChainLock<'info> {
    pub router: Signer<'info>,
    #[account(
        seeds = [b"hub_config"],
        bump = hub_config.bump,
        constraint = hub_config.router_authority == router.key() @ SlabError::Unauthorized
    )]
    pub hub_config: Account<'info, HubConfig>,
    #[account(
        init,
        payer = payer,
        space = 8 + crate::state::ReplayEntry::INIT_SPACE,
        seeds = [b"replay", message_digest.as_ref()],
        bump
    )]
    pub replay: Account<'info, crate::state::ReplayEntry>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Must equal 32-byte Pubkey with EVM address in the last 20 bytes (same encoding as `owner_20`)
    pub synthetic_owner: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + CollateralItem::INIT_SPACE,
        seeds = [b"item", collateral_id.as_ref()],
        bump
    )]
    pub collateral: Account<'info, CollateralItem>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"pos", synthetic_owner.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
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
    let expected = collateral_id_evm_packed(source_eid as u64, &collection_20, token_id);
    require!(expected == collateral_id, SlabError::CollateralNotFound);

    let mut own_pubkey = [0u8; 32];
    own_pubkey[12..32].copy_from_slice(&owner_20);
    let owner = Pubkey::new_from_array(own_pubkey);
    require_keys_eq!(
        ctx.accounts.synthetic_owner.key(),
        owner,
        SlabError::Unauthorized
    );

    let replay = &mut ctx.accounts.replay;
    replay.digest = message_digest;
    replay.bump = ctx.bumps.replay;

    let mut col_pubkey = [0u8; 32];
    col_pubkey[12..32].copy_from_slice(&collection_20);
    let collection = Pubkey::new_from_array(col_pubkey);

    let now = Clock::get()?.unix_timestamp;
    let item = &mut ctx.accounts.collateral;
    item.collateral_id = collateral_id;
    item.source_eid = source_eid;
    item.collection = collection;
    item.token_id = token_id;
    item.owner = owner;
    item.locked_at = now;
    item.status = 1;
    item.bump = ctx.bumps.collateral;

    let pos = &mut ctx.accounts.position;
    if pos.owner == Pubkey::default() {
        pos.owner = owner;
        pos.collateral_ids = Vec::new();
        pos.status = 0;
        pos.bump = ctx.bumps.position;
    }
    require_keys_eq!(pos.owner, owner, SlabError::Unauthorized);
    require!(
        pos.collateral_ids.len() < crate::state::MAX_COLLATERAL_PER_USER,
        SlabError::PositionCap
    );
    require!(!pos.collateral_ids.contains(&collateral_id), SlabError::CollateralExists);
    pos.collateral_ids.push(collateral_id);
    Ok(())
}
