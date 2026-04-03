// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title IReceiver
/// @notice Chainlink CRE KeystoneForwarder callback — receives signed workflow reports
interface IReceiver is IERC165 {
    /// @notice Handles incoming keystone reports from the forwarder
    /// @param metadata Report metadata (workflow id, name, owner) — encoded by the forwarder
    /// @param report ABI-encoded payload from the CRE workflow
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
