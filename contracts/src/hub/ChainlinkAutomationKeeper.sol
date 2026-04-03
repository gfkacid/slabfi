// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAutomationCompatible} from "../interfaces/IAutomationCompatible.sol";
import {HealthFactorEngine} from "./HealthFactorEngine.sol";
import {OracleConsumer} from "./OracleConsumer.sol";
import {CollateralRegistry} from "./CollateralRegistry.sol";

contract ChainlinkAutomationKeeper is IAutomationCompatible {
    HealthFactorEngine public healthFactorEngine;
    OracleConsumer public oracleConsumer;
    CollateralRegistry public collateralRegistry;

    uint256 public lastSweepTime;
    address[] public borrowers;

    constructor(address _healthFactorEngine, address _oracleConsumer, address _collateralRegistry) {
        healthFactorEngine = HealthFactorEngine(payable(_healthFactorEngine));
        oracleConsumer = OracleConsumer(payable(_oracleConsumer));
        collateralRegistry = CollateralRegistry(payable(_collateralRegistry));
    }

    function addBorrower(address borrower) external {
        for (uint256 i = 0; i < borrowers.length; i++) {
            if (borrowers[i] == borrower) return;
        }
        borrowers.push(borrower);
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        if (oracleConsumer.lastPriceUpdateTime() <= lastSweepTime) {
            return (false, "");
        }

        address[] memory toSweep = new address[](borrowers.length);
        uint256 count = 0;
        for (uint256 i = 0; i < borrowers.length; i++) {
            if (collateralRegistry.getPosition(borrowers[i]).borrower != address(0)) {
                toSweep[count] = borrowers[i];
                count++;
            }
        }
        if (count == 0) return (false, "");

        assembly {
            mstore(toSweep, count)
        }
        return (true, abi.encode(toSweep));
    }

    function performUpkeep(bytes calldata performData) external override {
        require(oracleConsumer.lastPriceUpdateTime() > lastSweepTime, "No new prices");
        address[] memory toSweep = abi.decode(performData, (address[]));
        healthFactorEngine.sweepPositions(toSweep);
        lastSweepTime = block.timestamp;
    }
}
