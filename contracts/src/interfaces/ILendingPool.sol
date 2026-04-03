// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILendingPool {
    function outstandingDebt(address borrower)
        external
        view
        returns (uint256 principal, uint256 interest, uint256 total);

    /// @notice Idle USDC in the pool (upper bound for new borrows / withdraws)
    function availableLiquidity() external view returns (uint256);
}
