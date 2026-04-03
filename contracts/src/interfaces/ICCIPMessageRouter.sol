// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICCIPMessageRouter {
    function sendUnlockCommand(
        uint64 destinationChainSelector,
        address adapter,
        bytes32 collateralId,
        address recipient
    ) external returns (bytes32 messageId);
}
