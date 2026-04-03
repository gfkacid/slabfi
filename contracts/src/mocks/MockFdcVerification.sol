// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IFdcVerification} from "../interfaces/IFdcVerification.sol";

contract MockFdcVerification is IFdcVerification {
    function verifyAttestation(bytes calldata) external pure override returns (bool) {
        return true;
    }
}
