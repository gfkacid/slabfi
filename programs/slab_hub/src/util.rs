use anchor_lang::solana_program::keccak;

/// Match Solidity `keccak256(abi.encodePacked(uint64 selector, address collection, uint256 tokenId))`.
pub fn collateral_id_evm_packed(
    source_chain_selector: u64,
    collection_20: &[u8; 20],
    token_id: u64,
) -> [u8; 32] {
    let mut token_u256 = [0u8; 32];
    token_u256[24..32].copy_from_slice(&token_id.to_be_bytes());
    let hash = keccak::hashv(&[
        &source_chain_selector.to_be_bytes(),
        collection_20.as_slice(),
        &token_u256,
    ]);
    hash.to_bytes()
}

/// Solana-native: `keccak256(abi.encodePacked(uint64 lz_eid, bytes32 collection, uint256 tokenId))`
/// where `collection` is the full 32-byte mint pubkey.
pub fn collateral_id_solana_packed(source_eid: u64, collection: &Pubkey, token_id: u64) -> [u8; 32] {
    let mut tid = [0u8; 32];
    tid[24..32].copy_from_slice(&token_id.to_be_bytes());
    let hash = keccak::hashv(&[
        &source_eid.to_be_bytes(),
        collection.as_ref(),
        &tid,
    ]);
    hash.to_bytes()
}

pub fn ltv_bps_for_tier(tier: u8) -> u16 {
    match tier {
        1 => 5000,
        2 => 3500,
        3 => 2000,
        _ => 2000,
    }
}
