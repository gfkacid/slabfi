// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ICollateralAdapter
/// @notice Extensibility interface for source chain collateral adapters
interface ICollateralAdapter {
    /// @notice Lock an NFT in the vault and notify the hub via CCIP
    /// @param tokenId The NFT token ID to lock
    /// @param hubOwner The borrower's address on the hub chain (for cross-chain address mismatch)
    /// @return ccipMessageId The CCIP message ID for tracking
    function lockAndNotify(uint256 tokenId, address hubOwner) external returns (bytes32 ccipMessageId);

    /// @notice Receive an UnlockCommand from hub and release NFT to recipient
    /// @param collateralId The collateral ID (keccak256(chainSelector, collection, tokenId))
    /// @param recipient Address to receive the NFT on source chain
    function receiveUnlock(bytes32 collateralId, address recipient) external;

    /// @notice Return the collection address this adapter manages
    function collection() external view returns (address);

    /// @notice Return the CCIP chain selector for this chain
    function chainSelector() external view returns (uint64);

    event Locked(uint256 indexed tokenId, address indexed owner, bytes32 ccipMessageId);
    event Unlocked(uint256 indexed tokenId, address indexed recipient);
}
