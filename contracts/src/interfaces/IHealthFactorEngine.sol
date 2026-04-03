// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ICardFiTypes.sol";

interface IHealthFactorEngine {
    function recomputePosition(address borrower) external returns (uint256 healthFactor, PositionStatus newStatus);

    function getPositionStatus(address borrower) external view returns (PositionStatus);
}
