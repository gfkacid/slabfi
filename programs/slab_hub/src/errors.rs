use anchor_lang::prelude::*;

#[error_code]
pub enum SlabError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid collection kind")]
    InvalidCollectionKind,
    #[msg("Collection not whitelisted")]
    NotWhitelisted,
    #[msg("Replayed message digest")]
    Replay,
    #[msg("Collateral already exists")]
    CollateralExists,
    #[msg("Collateral not found")]
    CollateralNotFound,
    #[msg("Insufficient credit")]
    InsufficientCredit,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Still has debt")]
    HasDebt,
    #[msg("Wrong NFT owner")]
    WrongNftOwner,
    #[msg("Auction not found")]
    AuctionNotFound,
    #[msg("Position cap reached")]
    PositionCap,
    #[msg("Pool already initialized")]
    PoolAlreadyInit,
}
