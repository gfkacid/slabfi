// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILiquidationManager {
    function queueLiquidation(address borrower, bytes32 collateralId) external;

    /// @notice HF engine calls when borrower cures (HF >= 1); refunds all bids and cancels pending auctions.
    function cancelAllAuctionsForBorrower(address borrower) external;
}
